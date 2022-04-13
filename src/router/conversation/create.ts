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
    domain,
    limitCl,
    categoryCl,
    summaryCl,
    conversationCl,
    viralCl,
    imagesCl,
} from "../../common";
import { verify } from "../../lib/recaptcha";
import axios from "axios";
import findimages from "../../lib/findimages";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import verifyUser from "../auth/verify";

const jsdomwindow: any = new JSDOM("").window;
const DOMPurify = createDOMPurify(jsdomwindow);

router.post("/api/create", body_parser.json(), async (req, res) => {
    const schema = Type.Object(
        {
            icomment: Type.String(),
            rtoken: Type.String(),
            title: Type.String(),
            category: Type.Integer(),
        },
        { additionalProperties: false }
    );
    if (!ajv.validate(schema, req.body))
        return res.status(400).send({ error: "Bad request." });

    const icomment = DOMPurify.sanitize(req.body.icomment);

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

    const newtid =
        (
            await summaryCl
                .find()
                .sort({ id: -1 })
                .limit(1)
                .project({ id: 1, _id: 0 })
                .toArray()
        )[0]?.id + 1 || 1;

    const date = new Date();

    let threadSlink: string, commentSlink: string;
    try {
        threadSlink = `https://l.wcyat.me/${
            (
                await axios.post("https://api-us.wcyat.me/create", {
                    url: `https://${domain}/thread/${newtid}?page=1`,
                })
            ).data.id
        }`;
        commentSlink = `https://l.wcyat.me/${
            (
                await axios.post("https://api-us.wcyat.me/create", {
                    url: `https://${domain}/thread/${newtid}?c=1`,
                })
            ).data.id
        }`;
    } catch {}

    await conversationCl.insertOne({
        id: newtid,
        conversation: [
            {
                id: 1,
                user: user.id,
                slink: commentSlink,
                comment: icomment,
                createdAt: date,
            },
        ],
        lastModified: date,
    });

    const summaryData = {
        id: newtid,
        op: {
            id: user.id,
            name: user.name,
            sex: user.sex,
            role: user.role,
        },
        sex: user.sex,
        c: 1,
        vote: 0,
        slink: threadSlink,
        title: req.body.title,
        category: category.id,
        lastModified: date,
        createdAt: date,
    };

    await summaryCl.insertOne(summaryData);
    await viralCl.insertOne({
        id: summaryData.id,
        c: 1,
        category: summaryData.category,
        lastModified: date,
        createdAt: date,
    });

    const imagesData: { image: string; cid: number }[] = [];
    findimages(icomment).forEach((item) => {
        imagesData.push({ image: item, cid: 1 });
    });

    await imagesCl.insertOne({ id: newtid, images: imagesData });
    await limitCl.insertOne({ id: user.id, createdAt: date, type: "create" });

    res.send({ id: newtid });
});
export default router;
