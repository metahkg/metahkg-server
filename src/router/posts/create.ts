//Create a topic
/*Syntax: POST /api/create
{
  icomment (initial comment) : string,
  rtoken (recaptcha token) : string,
  title : string,
  category : number
}*/
//only for human
import express from "express";

const router = express.Router();
import body_parser from "body-parser";
import {
    secret,
    limitCl,
    categoryCl,
    viralCl,
    imagesCl,
    LINKS_DOMAIN,
    linksCl,
    threadCl,
} from "../../common";
import { verify } from "../../lib/recaptcha";
import findimages from "../../lib/findimages";
import { Static, Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import verifyUser from "../../lib/auth/verify";
import { generate } from "wcyat-rg";
import sanitize from "../../lib/sanitize";
const schema = Type.Object(
    {
        comment: Type.String(),
        rtoken: Type.String(),
        title: Type.String(),
        category: Type.Integer(),
    },
    { additionalProperties: false }
);

router.post(
    "/api/posts/create",
    body_parser.json(),
    async (
        req: { body: Static<typeof schema>; headers: { authorization?: string } },
        res
    ) => {
        if (!ajv.validate(schema, req.body))
            return res.status(400).send({ error: "Bad request." });

        const comment = sanitize(req.body.comment);

        if (!(await verify(secret, req.body.rtoken)))
            return res.status(400).send({ error: "recaptcha token invalid." });

        const user = verifyUser(req.headers.authorization);
        if (!user) return res.status(400).send({ error: "User not found." });

        if ((await limitCl.countDocuments({ id: user.id, type: "create" })) >= 10)
            return res
                .status(429)
                .send({ error: "You cannot create more than 10 topics a day." });

        const category = await categoryCl.findOne({ id: req.body.category });
        if (!category) return res.status(404).send({ error: "Category not found." });

        const newThreadId =
            (
                await threadCl
                    .find()
                    .sort({ id: -1 })
                    .limit(1)
                    .project({ id: 1, _id: 0 })
                    .toArray()
            )[0]?.id + 1 || 1;

        const date = new Date();

        let commentSlinkId = generate({
            include: { numbers: true, upper: true, lower: true, special: false },
            digits: 7,
        });

        while (await linksCl.findOne({ id: commentSlinkId })) {
            commentSlinkId = generate({
                include: { numbers: true, upper: true, lower: true, special: false },
                digits: 7,
            });
        }

        await linksCl.insertOne({
            id: commentSlinkId,
            url: `/thread/${newThreadId}?c=1`,
        });

        const threadData = {
            id: newThreadId,
            conversation: [
                {
                    id: 1,
                    user: user.id,
                    slink: `https://${LINKS_DOMAIN}/${commentSlinkId}`,
                    comment: comment,
                    createdAt: date,
                },
            ],
            op: {
                id: user.id,
                name: user.name,
                sex: user.sex,
                role: user.role,
            },
            sex: user.sex,
            c: 1,
            vote: 0,
            slink: `https://${LINKS_DOMAIN}/${newThreadId}`,
            title: req.body.title,
            category: category.id,
            lastModified: date,
            createdAt: date,
        };

        await threadCl.insertOne(threadData);
        await viralCl.insertOne({
            id: threadData.id,
            c: 1,
            category: threadData.category,
            lastModified: date,
            createdAt: date,
        });

        const imagesData: { image: string; cid: number }[] = [];
        findimages(comment).forEach((item) => {
            imagesData.push({ image: item, cid: 1 });
        });

        await imagesCl.insertOne({ id: newThreadId, images: imagesData });
        await limitCl.insertOne({ id: user.id, createdAt: date, type: "create" });

        res.send({ id: newThreadId });
    }
);
export default router;
