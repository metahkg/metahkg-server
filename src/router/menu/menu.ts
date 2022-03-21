// get 20 neweat/hottezt threads in a category
// note: category 1 returns all categories
// Syntax: GET /api/menu/<category id>?sort=<0 | 1>&page=<number>
import express from "express";
import isInteger from "is-sn-integer";
import { MongoClient } from "mongodb";
import { client, mongouri } from "../../common";
const router = express.Router();
/**
 * sort:
 * 0 : newest
 * 1 : hottest
 */
router.get("/api/menu/:category", async (req, res) => {
  if (
    (!isInteger(req.params?.category) &&
      !req.params.category?.startsWith("bytid")) ||
    (req.params.category?.startsWith("bytid") &&
      !isInteger(req.params.category?.replace("bytid", ""))) ||
    (req.query.sort && ![0, 1].includes(Number(req.query.sort))) ||
    (req.query.page && !isInteger(Number(req.query.page)))
  ) {
    res.status(400);
    res.send({ error: "Bad request." });
    return;
  }
  const sort = Number(req.query.sort || 0);
  const page = Number(req.query.page) || 1;
  let category = Number(req.params.category);
  const summary = client.db("metahkg-threads").collection("summary");
  const hottest = client.db("metahkg-threads").collection("hottest");
  if (req.params.category.startsWith("bytid")) {
    const s = await summary.findOne({
      id: Number(req.params.category.replace("bytid", "")),
    });
    if (!s || !s.category) {
      res.status(404);
      res.send({ error: "Not found." });
      return;
    }
    category = s.category;
  }
  if (
    !(await client
      .db("metahkg-threads")
      .collection("category")
      .findOne({ id: category }))
  ) {
    res.status(404);
    res.send({ error: "Not found." });
    return;
  }
  const data = sort
    ? await hottest
        .find(category === 1 ? {} : { category: category })
        .sort({ c: -1, lastModified: -1 })
        .skip(25 * (page - 1))
        .limit(25)
        .toArray()
    : await summary
        .find(category === 1 ? {} : { category: category })
        .sort({ lastModified: -1 })
        .skip(25 * (page - 1))
        .limit(25)
        .project({ _id: 0 })
        .toArray();
  if (sort) {
    for (let index = 0; index < data.length; index++) {
      data[index] = await summary.findOne(
        { id: data[index].id },
        { projection: { _id: 0 } }
      );
    }
  }
  res.send(data.length ? data : [null]);
});
export default router;
