import express from "express";
const router = express.Router();
import body_parser from "body-parser";
import { client, domain, secret, timediff } from "../../common";
import { JSDOM } from "jsdom";
import isInteger from "is-sn-integer";
import createDOMPurify from "dompurify";
import axios from "axios";
import { verify } from "../lib/recaptcha";
import findimages from "../lib/findimages";
import { Type } from "@sinclair/typebox";
import { ajv } from "../lib/ajv";
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
  if (!ajv.validate(schema, req.body)) {
    res.status(400);
    res.send({ error: "Bad request." });
    return;
  }
  if (!(await verify(secret, req.body.rtoken))) {
    res.status(400);
    res.send({ error: "recaptcha token invalid." });
    return;
  }
  const conversation = client.db("metahkg-threads").collection("conversation");
  const users = client.db("metahkg-threads").collection("users");
  const summary = client.db("metahkg-threads").collection("summary");
  const metahkgusers = client.db("metahkg-users").collection("users");
  const limit = client.db("metahkg-users").collection("limit");
  const hottest = client.db("metahkg-threads").collection("hottest");
  const images = client.db("metahkg-threads").collection("images");
  const key = req.cookies.key;
  const user = await metahkgusers.findOne({ key: key });
  const comment = DOMPurify.sanitize(req.body.comment);
  if (
    !(await metahkgusers.findOne({ key: key })) ||
    !(await conversation.findOne({ id: req.body.id }))
  ) {
    res.status(404);
    res.send({ error: "Not found." });
    return;
  }
  if ((await limit.countDocuments({ id: user.id, type: "comment" })) >= 300) {
    res.status(429);
    res.send({ error: "You cannot add more than 300 comments a day." });
    return;
  }
  const newid = (await summary.findOne({ id: req.body.id })).c + 1;
  await summary.updateOne(
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
  await conversation.updateOne(
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
  if (!(await users.findOne({ id: req.body.id }))?.[user.id]) {
    await users.updateOne(
      { id: req.body.id },
      { $set: { [user.id]: { sex: user.sex, name: user.user } } }
    );
  }
  const cimages = findimages(comment);
  if (cimages.length) {
    const timages: { image: string; cid: number }[] = (
      await images.findOne({
        id: req.body.id,
      })
    ).images;
    cimages.forEach((item) => {
      if (timages.findIndex((i) => i.image === item) === -1) {
        timages.push({ image: item, cid: newid });
      }
    });
    await images.updateOne({ id: req.body.id }, { $set: { images: timages } });
  }
  const h = await hottest.findOne({ id: req.body.id });
  if (h) {
    await hottest.updateOne(
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
    const s = await summary.findOne({
      id: req.body.id,
    });
    const o = {
      lastModified: new Date(),
      createdAt: new Date(),
      id: s.id,
      c: 1,
      category: s.category,
    };
    await hottest.insertOne(o);
  }
  res.send({ id: newid });
});
export default router;
