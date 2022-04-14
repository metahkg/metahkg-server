import express from "express";

const router = express.Router();
import body_parser from "body-parser";
import {
    domain,
    conversationCl,
    imagesCl,
    linksCl,
    secret,
    summaryCl,
    timediff,
    viralCl,
    LINKS_DOMAIN,
} from "../../common";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";
import { verify } from "../../lib/recaptcha";
import findimages from "../../lib/findimages";
import { Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import verifyUser from "../../lib/auth/verify";
import { generate } from "wcyat-rg";

const jsdomwindow: any = new JSDOM("").window;
const DOMPurify = createDOMPurify(jsdomwindow);
/** add a comment
 * Syntax: POST /api/comment {id (thread id) : number, comment : string}
 * client must have a cookie "key"
 */
router.post("/api/posts/comment", body_parser.json(), async (req, res) => {
    const schema = Type.Object(
        {
            id: Type.Integer(),
            comment: Type.String(),
            rtoken: Type.String(),
        },
        { additionalProperties: false }
    );
    if (!ajv.validate(schema, req.body))
        return res.status(400).send({ error: "Bad request." });

    if (!(await verify(secret, req.body.rtoken)))
        return res.status(400).send({ error: "recaptcha token invalid." });

    const user = verifyUser(req.headers.authorization);

    const comment = DOMPurify.sanitize(req.body.comment);
    if (!user || !(await conversationCl.findOne({ id: req.body.id })))
        return res.status(404).send({ error: "Not found." });

    const newCommentId = (await summaryCl.findOne({ id: req.body.id })).c + 1;
    await summaryCl.updateOne(
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
        url: `/thread/${req.body.id}?c=${newCommentId}`,
    });

    await conversationCl.updateOne(
        { id: req.body.id },
        {
            $push: {
                conversation: {
                    id: newCommentId,
                    user: user.id,
                    comment: comment,
                    createdAt: new Date(),
                    slink: `https://${LINKS_DOMAIN}/${slinkId}`,
                },
            },
            $currentDate: { lastModified: true },
        }
    );

    const imagesInComment = findimages(comment);
    if (imagesInComment.length) {
        const imagesData: { image: string; cid: number }[] = (
            await imagesCl.findOne({
                id: req.body.id,
            })
        ).images;

        imagesInComment.forEach((item) => {
            if (imagesData.findIndex((i) => i.image === item) === -1)
                imagesData.push({ image: item, cid: newCommentId });
        });

        await imagesCl.updateOne({ id: req.body.id }, { $set: { images: imagesData } });
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
        const summaryData = await summaryCl.findOne({
            id: req.body.id,
        });
        await viralCl.insertOne({
            lastModified: new Date(),
            createdAt: new Date(),
            id: summaryData.id,
            c: 1,
            category: summaryData.category,
        });
    }
    res.send({ id: newCommentId });
});
export default router;
