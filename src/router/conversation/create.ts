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
import { MongoClient } from "mongodb";
import { mongouri, secret, domain, allequal } from "../../common";
import { verify } from "../lib/recaptcha";
import axios from "axios";
router.post(
  "/api/create",
  body_parser.json(),
  async (
    req: {
      body: {
        icomment: string;
        rtoken: string;
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
      !req.body.rtoken ||
      !req.body.title ||
      !req.body.category ||
      Object.keys(req.body)?.length > 4 ||
      !(
        allequal([
          typeof req.body.icomment,
          typeof req.body.title,
          typeof req.body.rtoken,
          "string",
        ]) && typeof req.body.category === "number"
      )
    ) {
      res.status(400);
      res.send({ error: "Bad request." });
      return;
    }
    const client = new MongoClient(mongouri);
    const { icomment, rtoken, title, category } = req.body;
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
    if (!(await verify(secret, req.body.rtoken))) {
      res.status(400);
      res.send({ error: "recaptcha token invalid." });
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
            comment: req.body.icomment,
            createdAt: date,
          },
        ],
        lastModified: date,
      });
      await cachedusers.insertOne({
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
      res.send({ id: newtid });
    } finally {
      await client.close();
    }
  }
);
export default router;
