import express from "express";

const router = express.Router();
import body_parser from "body-parser";
import { conversationCl, db, domain, imagesCl, limitCl, secret, summaryCl, timediff, usersCl, viralCl } from "../../common";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";
import axios from "axios";
import { verify } from "../../lib/recaptcha";
import findimages from "../../lib/findimages";
import { Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import verifyUser from "../auth/verify";

const jsdomwindow: any = new JSDOM("").window;
const DOMPurify = createDOMPurify(jsdomwindow);
/** add a comment
 * Syntax: POST /api/comment {id (thread id) : number, comment : string}
 * client must have a cookie "key"
 */
router.post("/api/comment", body_parser.json(), async (req, res) => {
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

    if ((await limitCl.countDocuments({ id: user.id, type: "comment" })) >= 300)
        return res
            .status(429)
            .send({ error: "You cannot add more than 300 comments a day." });

    const newid = (await summaryCl.findOne({ id: req.body.id })).c + 1;
    await summaryCl.updateOne(
        { id: req.body.id },
        { $inc: { c: 1 }, $currentDate: { lastModified: true } }
    );
    let slink: string;
    try {
        slink = `https://l.wcyat.me/${
            (
                await axios.post("https://api-us.wcyat.me/create", {
                    url: `https://${domain}/thread/${req.body.id}?c=${newid}`,
                })
            ).data.id
        }`;
    } catch {}
    await conversationCl.updateOne(
        { id: req.body.id },
        {
            $push: {
                conversation: {
                    id: newid,
                    user: user.id,
                    comment: comment,
                    createdAt: new Date(),
                    slink: slink,
                },
            },
            $currentDate: { lastModified: true },
        }
    );
    if (!(await usersCl.findOne({ id: req.body.id }))?.[user.id]) {
        await usersCl.updateOne(
            { id: req.body.id },
            { $set: { [user.id]: { sex: user.sex, name: user.user } } }
        );
    }
    const cimages = findimages(comment);
    if (cimages.length) {
        const timages: { image: string; cid: number }[] = (
            await imagesCl.findOne({
                id: req.body.id,
            })
        ).images;
        cimages.forEach((item) => {
            if (timages.findIndex((i) => i.image === item) === -1) {
                timages.push({ image: item, cid: newid });
            }
        });
        await imagesCl.updateOne({ id: req.body.id }, { $set: { images: timages } });
    }
    const h = await viralCl.findOne({ id: req.body.id });
    if (h) {
        await viralCl.updateOne(
            { id: req.body.id },
            {
                $inc: { c: 1 },
                $currentDate:
                    timediff(h.createdAt) > 86400
                        ? { lastModified: true, createdAt: true }
                        : { lastModified: true },
            }
        );
    } else {
        const s = await summaryCl.findOne({
            id: req.body.id,
        });
        const o = {
            lastModified: new Date(),
            createdAt: new Date(),
            id: s.id,
            c: 1,
            category: s.category,
        };
        await viralCl.insertOne(o);
    }
    res.send({ id: newid });
});
export default router;
