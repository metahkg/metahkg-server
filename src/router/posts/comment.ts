import express from "express";

const router = express.Router();
import body_parser from "body-parser";
import {
    imagesCl,
    linksCl,
    secret,
    timediff,
    viralCl,
    LINKS_DOMAIN,
    threadCl,
} from "../../common";
import { verify } from "../../lib/recaptcha";
import findimages from "../../lib/findimages";
import { Static, Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import verifyUser from "../../lib/auth/verify";
import { generate } from "wcyat-rg";
import sanitize from "../../lib/sanitize";
import Images from "../../models/images";
import Thread, { commentType } from "../../models/thread";

const schema = Type.Object(
    {
        id: Type.Integer(),
        comment: Type.String(),
        rtoken: Type.String(),
        quote: Type.Optional(Type.Integer({ minimum: 1 })),
    },
    { additionalProperties: false }
);

/** add a comment
 * Syntax: POST /api/comment {id (thread id) : number, comment : string}
 * client must have a cookie "key"
 */
router.post(
    "/api/posts/comment",
    body_parser.json(),
    async (
        req: { body: Static<typeof schema>; headers: { authorization?: string } },
        res
    ) => {
        const { id, rtoken, quote } = req.body;

        if (!ajv.validate(schema, req.body))
            return res.status(400).send({ error: "Bad request." });

        if (!(await verify(secret, rtoken)))
            return res.status(400).send({ error: "recaptcha token invalid." });

        const user = verifyUser(req.headers.authorization);

        const comment = sanitize(req.body.comment);
        if (!user || !(await threadCl.findOne({ id: req.body.id }) as Thread))
            return res.status(404).send({ error: "Not found." });

        const newCommentId = (await threadCl.findOne({ id: req.body.id }) as Thread)?.c + 1;
        await threadCl.updateOne(
            { id: req.body.id },
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
            const thread = await threadCl.findOne({ id: id }) as Thread;
            quoteIndex = thread?.conversation?.findIndex((i) => i.id === quote);
            quotedComment =
                (quoteIndex !== -1 && thread.conversation[quoteIndex]) || undefined;
        }

        await threadCl.updateOne(
            { id: id },
            {
                $push: {
                    conversation: Object.assign(
                        {
                            id: newCommentId,
                            user: {
                                id: user.id,
                                name: user.name,
                                role: user.role,
                                sex: user.sex,
                            },
                            comment: comment,
                            createdAt: new Date(),
                            slink: `https://${LINKS_DOMAIN}/${slinkId}`,
                        },
                        quotedComment && { quote: quotedComment }
                    ),
                },
                $currentDate: { lastModified: true },
            }
        );
        quotedComment &&
            (await threadCl.updateOne(
                { id: id },
                { $push: { [`conversation.${quoteIndex}.replies`]: newCommentId } }
            ));

        const imagesInComment = findimages(comment);
        if (imagesInComment.length) {
            const imagesData: { image: string; cid: number }[] = (
                await imagesCl.findOne({
                    id: req.body.id,
                }) as Images
            ).images;

            imagesInComment.forEach((item) => {
                if (imagesData.findIndex((i) => i.image === item) === -1)
                    imagesData.push({ image: item, cid: newCommentId });
            });

            await imagesCl.updateOne(
                { id: req.body.id },
                { $set: { images: imagesData } as Images }
            );
        }
        const viralData = await viralCl.findOne({ id: req.body.id });
        if (viralData) {
            await viralCl.updateOne(
                { id: req.body.id },
                {
                    $inc: { c: 1 },
                    $currentDate:
                        timediff(viralData.createdAt) > 86400
                            ? { lastModified: true, createdAt: true }
                            : { lastModified: true },
                }
            );
        } else {
            const thread = await threadCl.findOne(
                {
                    id: req.body.id,
                },
                { projection: { _id: 0, conversation: 0 } }
            ) as Thread;
            await viralCl.insertOne({
                lastModified: new Date(),
                createdAt: new Date(),
                id: thread.id,
                c: 1,
                category: thread.category,
            });
        }
        res.send({ id: newCommentId });
    }
);
export default router;
