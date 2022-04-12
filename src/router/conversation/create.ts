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
import { secret, domain, db } from "../../common";
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
router.post(
    "/api/create",
    body_parser.json(),
    async (req,res) => {
        const schema = Type.Object(
            {
                icomment: Type.String(),
                rtoken: Type.String(),
                title: Type.String(),
                category: Type.Integer(),
            },
            { additionalProperties: false }
        );
        if (!ajv.validate(schema, req.body)) {
            res.status(400);
            res.send({ error: "Bad request." });
            return;
        }
        const key = String(req.cookies.key);
        const icomment = DOMPurify.sanitize(req.body.icomment);
        const threadusers = db.collection("threadusers");
        const categories = db.collection("category");
        const summary = db.collection("summary");
        const viral = db.collection("viral");
        const conversation = db.collection("conversation");
        const images = db.collection("images");
        const limit = db.collection("limit");
        const users = db.collection("users");
        if (!(await verify(secret, req.body.rtoken))) {
            res.status(400);
            res.send({ error: "recaptcha token invalid." });
            return;
        }
        const user = verifyUser(req.headers.authorization);
        if (!user)
            return res.status(400).send({ error: "User not found." });
        if ((await limit.countDocuments({ id: user.id, type: "create" })) >= 10)
            return res.status(429).send({ error: "You cannot create more than 10 topics a day." });
        const category = await categories.findOne({ id: req.body.category });
        if (!category) {
            res.status(404);
            res.send({ error: "Category not found." });
            return;
        }
        const newtid =
            ((
                await summary
                    .find()
                    .sort({ id: -1 })
                    .limit(1)
                    .project({ id: 1, _id: 0 })
                    .toArray()
            )[0]?.id || (await conversation.countDocuments())) + 1;
        const date = new Date();
        let slink: string, cslink: string;
        try {
            slink = `https://l.wcyat.me/${
                (
                    await axios.post("https://api-us.wcyat.me/create", {
                        url: `https://${domain}/thread/${newtid}?page=1`,
                    })
                ).data.id
            }`;
            cslink = `https://l.wcyat.me/${
                (
                    await axios.post("https://api-us.wcyat.me/create", {
                        url: `https://${domain}/thread/${newtid}?c=1`,
                    })
                ).data.id
            }`;
        } catch {}
        await conversation.insertOne({
            id: newtid,
            conversation: [
                {
                    id: 1,
                    user: user.id,
                    slink: cslink,
                    comment: icomment,
                    createdAt: date,
                },
            ],
            lastModified: date,
        });
        await threadusers.insertOne({
            id: newtid,
            [user.id]: { name: user.user, sex: user.sex },
        });
        const s = {
            id: newtid,
            op: user.user,
            sex: user.sex,
            c: 1,
            vote: 0,
            slink: slink,
            title: req.body.title,
            category: category.id,
            lastModified: date,
            createdAt: date,
        };
        await summary.insertOne(s);
        await viral.insertOne({
            id: s.id,
            c: 1,
            category: s.category,
            lastModified: date,
            createdAt: date,
        });
        const cimages: { image: string; cid: number }[] = [];
        findimages(icomment).forEach((item) => {
            cimages.push({ image: item, cid: 1 });
        });
        await images.insertOne({ id: newtid, images: cimages });
        await limit.insertOne({ id: user.id, createdAt: date, type: "create" });
        res.send({ id: newtid });
    }
);
export default router;
