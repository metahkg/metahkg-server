//get categories
//Syntax: GET /api/category/<"all" | number(category id)>
//"all" returns an array of all categories
import express from "express";
const router = express.Router();
import body_parser from "body-parser";
import isInteger from "is-sn-integer";
import { MongoClient } from "mongodb";
import { mongouri } from "../common";
router.get("/api/category/:id", body_parser.json(), async (req, res) => {
  if (
    (req.params.id !== "all" &&
      !isInteger(req.params.id) &&
      !req.params.id?.startsWith("bytid")) ||
    (req.params.id?.startsWith("bytid") &&
      !isInteger(req.params.id?.replace("bytid", "")))
  ) {
    res.status(400);
    res.send({ error: "Bad request." });
    return;
  }
  const client = new MongoClient(mongouri);
  try {
    await client.connect();
    const categories = client.db("metahkg-threads").collection("category");
    if (req.params.id === "all") {
      const c = await categories.find({}).toArray();
      const o: any = {};
      for (const i of c) {
        o[i.id] = i.name;
      }
      res.send(o);
      return;
    }
    if (req.params.id?.startsWith("bytid")) {
      const summary = client.db("metahkg-threads").collection("summary");
      const s = await summary.findOne({
        id: Number(req.params.id?.replace("bytid", "")),
      });
      const c = await categories.findOne({ id: s?.category });
      if (!c) {
        res.status(404);
        res.send({ error: "Not found." });
        return;
      }
      res.send({ id: c.id, name: c.name });
      return;
    }
    const c = await categories.findOne({ id: Number(req.params.id) });
    if (!c) {
      res.status(404);
      res.send({ error: "Not found." });
      return;
    }
    res.send({ id: c.id, name: c.name });
  } finally {
    await client.close();
  }
});
export default router;
