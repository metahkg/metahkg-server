//Create a topic
/*Syntax: POST /api/create 
{
  icomment (initial comment) : string,
  htoken (hcaptcha token) : string,
  title : string,
  category : number
}*/
//only for human
import express from "express";
const router = express.Router();
import body_parser from "body-parser";
import { MongoClient } from "mongodb";
import { mongouri, secret, domain, allequal } from "../../common";
import { verify } from "hcaptcha";
import axios from "axios";
router.post(
  "/api/create",
  body_parser.json(),
  async (
    req: {
      body: {
        icomment: string;
        htoken: string;
        title: string;
        category: number;
      };
      cookies: {
        key: string;
      };
    },
    res
  ) => {
    if (
      !req.body.icomment ||
      !req.body.htoken ||
      !req.body.title ||
      !req.body.category ||
      Object.keys(req.body)?.length > 4 ||
      !(
        allequal([
          typeof req.body.icomment,
          typeof req.body.title,
          typeof req.body.htoken,
          "string",
        ]) && typeof req.body.category === "number"
      )
    ) {
      res.status(400);
      res.send({ error: "Bad request." });
      return;
    }
    const client = new MongoClient(mongouri);
    const { icomment, htoken, title, category } = req.body;
    const key = String(req.cookies.key);
    const metahkgThreads = client.db("metahkg-threads");
    const metahkgUsers = client.db("metahkg-users");
    const cachedusers = metahkgThreads.collection("users");
    const categories = metahkgThreads.collection("category");
    const summary = metahkgThreads.collection("summary");
    const hottest = metahkgThreads.collection("hottest");
    const conversation = metahkgThreads.collection("conversation");
    const limit = metahkgUsers.collection("limit");
    const users = metahkgUsers.collection("users");
    const hvalid = await verify(secret, htoken);
    if (!hvalid.success) {
      res.status(400);
      res.send({ error: "hCaptcha token invalid." });
      return;
    }
    try {
      await client.connect();
      const user = await users.findOne({ key: key });
      if (!user) {
        res.status(400);
        res.send({ error: "User not found." });
        return;
      }
      if ((await limit.countDocuments({ id: user.id, type: "create" })) >= 10) {
        res.status(429);
        res.send({ error: "You cannot create more than 10 topics a day." });
        return;
      }
      const category = await categories.findOne({ id: req.body.category });
      if (!category) {
        res.status(404);
        res.send({ error: "Category not found." });
        return;
      }
      const newcid =
        ((
          await summary
            .find()
            .sort({ id: -1 })
            .limit(1)
            .project({ id: 1, _id: 0 })
            .toArray()
        )[0]?.id || (await conversation.countDocuments())) + 1;
      const date = new Date();
      const slink = `https://l.wcyat.me/${
        (
          await axios.post("https://api-us.wcyat.me/create", {
            url: `https://${domain}/thread/${newcid}?page=1`,
          })
        ).data.id
      }`;
      await conversation.insertOne({
        id: newcid,
        conversation: [
          { id: 1, user: user.id, comment: req.body.icomment, createdAt: date },
        ],
        lastModified: date,
      });
      await cachedusers.insertOne({
        id: newcid,
        [user.id]: { name: user.user, sex: user.sex },
      });
      const s = {
        id: newcid,
        op: user.user,
        sex: user.sex,
        c: 1,
        vote: 0,
        slink: slink,
        title: req.body.title,
        category: category.id,
        catname: category.name,
        lastModified: date,
        createdAt: date,
      };
      await summary.insertOne(s);
      await hottest.insertOne({
        id: s.id,
        c: 1,
        category: s.category,
        lastModified: date,
        createdAt: date,
      });
      await limit.insertOne({ id: user.id, createdAt: date, type: "create" });
      res.send({ id: newcid });
    } finally {
      await client.close();
    }
  }
);
export default router;
