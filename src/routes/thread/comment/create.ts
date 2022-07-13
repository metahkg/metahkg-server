import { imagesCl, linksCl, secret, LINKS_DOMAIN, threadCl } from "../../../common";
import { verifyCaptcha } from "../../../lib/recaptcha";
import findImages from "../../../lib/findimages";
import { Static, Type } from "@sinclair/typebox";
import verifyUser from "../../../lib/auth/verify";
import { generate } from "wcyat-rg";
import sanitize from "../../../lib/sanitize";
import Images from "../../../models/images";
import Thread, { commentType } from "../../../models/thread";
import { htmlToText } from "html-to-text";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../lib/regex";

export default (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
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

    /** add a comment
     * Syntax: POST /api/comment {id (thread id) : number, comment : string}
     * client must have a cookie "key"
     */
    fastify.post(
        "/:id/comment",
        {
            schema: {
                body: schema,
                params: paramsSchema,
            },
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

            if (!(await verifyCaptcha(secret, rtoken)))
                return res.code(429).send({ error: "Recaptcha token invalid." });

            const user = verifyUser(req.headers.authorization);
            if (!user) return res.code(401).send({ error: "Unauthorized." });

            if (!((await threadCl.findOne({ id })) as Thread))
                return res.code(404).send({ error: "Thread not found." });

            const comment = sanitize(req.body.comment);
            const text = htmlToText(comment, { wordwrap: false });

            const newCommentId = ((await threadCl.findOne({ id })) as Thread)?.c + 1;
            await threadCl.updateOne(
                { id },
                { $inc: { c: 1 }, $currentDate: { lastModified: true } }
            );
            let slinkId = generate({
                include: { numbers: true, lower: true, upper: true, special: false },
                digits: 7,
            });
            while (await linksCl.findOne({ id: slinkId })) {
                slinkId = generate({
                    include: { numbers: true, lower: true, upper: true, special: false },
                    digits: 7,
                });
            }

            await linksCl.insertOne({
                id: slinkId,
                url: `/thread/${id}?c=${newCommentId}`,
            });

            let quotedComment: commentType | undefined, quoteIndex: number;

            if (quote) {
                const thread = (await threadCl.findOne({ id })) as Thread;
                quoteIndex = thread?.conversation?.findIndex((i) => i?.id === quote);
                quotedComment =
                    (quoteIndex !== -1 && thread.conversation[quoteIndex]) || undefined;
            }

            await threadCl.updateOne(
                { id },
                {
                    $push: {
                        conversation: {
                            id: newCommentId,
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
                            ...(quotedComment && { quote: quotedComment }),
                        },
                    },
                    $currentDate: { lastModified: true },
                }
            );
            quotedComment &&
                (await threadCl.updateOne(
                    { id: id },
                    { $push: { [`conversation.${quoteIndex}.replies`]: newCommentId } }
                ));

            const imagesInComment = findImages(comment);
            if (imagesInComment.length) {
                const imagesData: { image: string; cid: number }[] = (
                    (await imagesCl.findOne({
                        id,
                    })) as Images
                ).images;

                imagesInComment.forEach((item) => {
                    if (imagesData.findIndex((i) => i.image === item) === -1)
                        imagesData.push({ image: item, cid: newCommentId });
                });

                await imagesCl.updateOne(
                    { id },
                    { $set: { images: imagesData } as Images }
                );
            }

            res.send({ id: newCommentId });
        }
    );
    done();
};
