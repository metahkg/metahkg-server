import { linksCl, RecaptchaSecret, LINKS_DOMAIN, threadCl } from "../../../../common";
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
                return res.code(429).send({ error: "Recaptcha token invalid." });

            const user = verifyUser(req.headers.authorization);
            if (!user) return res.code(401).send({ error: "Unauthorized." });

            if (!((await threadCl.findOne({ id })) as Thread))
                return res.code(404).send({ error: "Thread not found." });

            const comment = sanitize(req.body.comment);
            const text = htmlToText(comment, { wordwrap: false });

            const thread = (await threadCl.findOne(
                { id },
                { projection: { count: 1 } }
            )) as Thread;

            if ("removed" in thread) return;

            const newcid = thread?.count + 1;

            let slinkId = generate({
                numbers: true,
                lowercase: true,
                uppercase: true,
                symbols: false,
                length: 7,
            });

            while (await linksCl.findOne({ id: slinkId })) {
                slinkId = generate({
                    numbers: true,
                    lowercase: true,
                    uppercase: true,
                    symbols: false,
                    length: 7,
                });
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

            quotedComment &&
                (await threadCl.updateOne(
                    { id },
                    { $push: { [`conversation.${quoteIndex}.replies`]: newcid } }
                ));

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

            res.send({ id: newcid });
        }
    );
    done();
};
