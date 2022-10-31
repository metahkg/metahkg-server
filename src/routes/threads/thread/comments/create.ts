import {
    linksCl,
    RecaptchaSecret,
    LINKS_DOMAIN,
    threadCl,
    domain,
    usersCl,
} from "../../../../common";
import { verifyCaptcha } from "../../../../lib/recaptcha";
import findImages from "../../../../lib/findimages";
import { Static, Type } from "@sinclair/typebox";
import verifyUser from "../../../../lib/auth/verify";
import { generate } from "generate-password";
import sanitize from "../../../../lib/sanitize";
import Images from "../../../../models/images";
import Thread, { commentType } from "../../../../models/thread";
import { htmlToText } from "html-to-text";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../../lib/regex";
import checkMuted from "../../../../plugins/checkMuted";
import { sendNotification } from "../../../../lib/notifications/sendNotification";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            comment: Type.String(),
            rtoken: Type.String(),
            quote: Type.Optional(Type.Integer({ minimum: 1 })),
        },
        { additionalProperties: false }
    );

    const paramsSchema = Type.Object({ id: Type.RegEx(regex.integer) });

    fastify.post(
        "/",
        {
            schema: {
                body: schema,
                params: paramsSchema,
            },
            preHandler: [checkMuted],
        },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id);

            const { rtoken, quote } = req.body;

            if (!(await verifyCaptcha(RecaptchaSecret, rtoken)))
                return res
                    .code(429)
                    .send({ statusCode: 429, error: "Recaptcha token invalid." });

            const user = await verifyUser(req.headers.authorization, req.ip);
            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

            if (!((await threadCl.findOne({ id })) as Thread))
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Thread not found." });

            const comment = sanitize(req.body.comment);
            const text = htmlToText(comment, { wordwrap: false });

            const thread = (await threadCl.findOne(
                { id },
                { projection: { count: 1, op: 1, id: 1, title: 1 } }
            )) as Thread;

            if ("removed" in thread) return;

            const newcid = thread?.count + 1;

            const genOpts = {
                numbers: true,
                lowercase: true,
                uppercase: true,
                symbols: false,
                length: 7,
                strict: true,
            };

            let slinkId = generate(genOpts);

            while (await linksCl.findOne({ id: slinkId })) {
                slinkId = generate(genOpts);
            }

            await linksCl.insertOne({
                id: slinkId,
                url: `/thread/${id}?c=${newcid}`,
            });

            let quotedComment: commentType | undefined, quoteIndex: number;

            if (quote) {
                const thread = (await threadCl.findOne(
                    { id, conversation: { $elemMatch: { id: quote } } },
                    {
                        projection: {
                            _id: 0,
                            conversation: { $elemMatch: { id: quote } },
                            index: { $indexOfArray: ["$conversation.id", quote] },
                        },
                    }
                )) as (Thread & { index: number }) | null;

                if (thread && !("removed" in thread)) {
                    quotedComment =
                        (Object.fromEntries(
                            Object.entries(thread.conversation[0]).filter(
                                (i) =>
                                    !["emotions", "replies", "U", "D", "admin"].includes(
                                        i[0]
                                    )
                            )
                        ) as commentType) || undefined;
                    if ("removed" in quotedComment) quotedComment = undefined;

                    if (quotedComment) quoteIndex = thread?.index;
                }
            }

            const imagesInComment = findImages(comment);

            await threadCl.updateOne(
                { id },
                {
                    $push: {
                        conversation: {
                            id: newcid,
                            user: {
                                id: user.id,
                                name: user.name,
                                role: user.role,
                                sex: user.sex,
                            },
                            comment,
                            text,
                            createdAt: new Date(),
                            slink: `https://${LINKS_DOMAIN}/${slinkId}`,
                            images: imagesInComment,
                            ...(quotedComment && { quote: quotedComment }),
                        },
                    },
                    $currentDate: { lastModified: true },
                    $inc: { count: 1 },
                }
            );

            if (quotedComment) {
                await threadCl.updateOne(
                    { id },
                    { $push: { [`conversation.${quoteIndex}.replies`]: newcid } }
                );
            }

            if (imagesInComment.length) {
                const imagesData = (
                    (await threadCl.findOne(
                        { id },
                        { projection: { _id: 0, images: 1 } }
                    )) as Images
                ).images;

                await threadCl.updateOne(
                    { id },
                    {
                        $push: {
                            images: {
                                $each: imagesInComment
                                    .filter(
                                        (item) =>
                                            imagesData.findIndex(
                                                (i) => i.src === item
                                            ) === -1
                                    )
                                    .map((item) => {
                                        return { src: item, cid: newcid };
                                    }),
                            },
                        },
                    }
                );
            }

            (
                usersCl
                    .find({
                        starred: { $elemMatch: { id: thread.id } },
                        sessions: { $elemMatch: { subscription: { $exists: true } } },
                    })
                    .project({ _id: 0, id: 1 })
                    .toArray() as Promise<{ id: number }[]>
            ).then((users) => {
                if (!users.find((i) => i.id === thread.op.id))
                    users.push({ id: thread.op.id });

                users.forEach(({ id }) => {
                    if (id !== user.id)
                        sendNotification(id, {
                            title: `New comment (${thread.title})`,
                            createdAt: new Date(),
                            options: {
                                body: `${user.name} (#${user.id}): ${
                                    text.length < 200 ? text : `${text.slice(0, 200)}...`
                                }`,
                                data: {
                                    type: "comment",
                                    threadId: thread.id,
                                    commentId: newcid,
                                    url: `https://${domain}/thread/${thread.id}?c=${newcid}`,
                                },
                            },
                        });
                });
            });

            if (quotedComment && !("removed" in quotedComment)) {
                if (quotedComment.user.id !== user.id)
                    sendNotification(quotedComment.user.id, {
                        title: `New reply (${thread.title})`,
                        createdAt: new Date(),
                        options: {
                            body: `${user.name} (#${user.id}): ${
                                text.length < 200 ? text : `${text.slice(0, 200)}...`
                            }`,
                            data: {
                                type: "reply",
                                threadId: thread.id,
                                commentId: newcid,
                                url: `https://${domain}/thread/${thread.id}?c=${newcid}`,
                            },
                        },
                    });
            }

            res.send({ id: newcid });
        }
    );
    done();
};
