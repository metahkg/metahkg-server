/*
 * get conversation
 * Syntax: GET /api/thread/<thread id>/<"conversation"/"users">
 * conversation: main conversation content
 * users: content of users involved in the conversation
 */
import express from "express";
const router = express.Router();
import { MongoClient } from "mongodb";
import { mongouri } from "../../common";
import isInteger from "is-sn-integer";
/*
 * type:
 *  0: users
 *  1: details
 *  2: conversation
 * default type is 1
 */
router.get("/api/thread/:id", async (req, res) => {
  const id = Number(req.params.id);
  const type = Number(req.query.type ?? 1);
  const page = Number(req.query.page) || 1;
  const start = Number(req.query.start);
  const end = Number(req.query.end);
  if (
    !isInteger(id) ||
    ![0, 1, 2].includes(type) ||
    !isInteger(page) ||
    page < 1 ||
    (start &&
      (!isInteger(start) ||
        start > end ||
        (!end && (start < (page - 1) * 25 + 1 || start > page * 25)))) ||
    (end &&
      (!isInteger(end) ||
        end < start ||
        (!start && (end > page * 25 || end < (page - 1) * 25 + 1))))
  ) {
    res.status(400);
    res.send({ error: "Bad request" });
    return;
  }
  const client = new MongoClient(mongouri);
  await client.connect();
  const metahkgThreads = client.db("metahkg-threads");
  try {
    if (type === 0) {
      //not using !type to avoid confusion
      const users = metahkgThreads.collection("users");
      const result = await users.findOne(
        { id: Number(req.params.id) },
        { projection: { _id: 0 } }
      );
      if (!result) {
        res.status(404);
        res.send({ error: "Not found" });
        return;
      }
      res.send(result);
      return;
    }
    const conversation = metahkgThreads.collection("conversation");
    const summary = metahkgThreads.collection("summary");
    const result =
      type === 1
        ? await summary.findOne(
            { id: Number(req.params.id) },
            {
              projection: {
                _id: 0,
                sex: 0,
                vote: 0,
                catname: 0,
                lastModified: 0,
                createdAt: 0,
              },
            }
          )
        : await conversation.findOne(
            { id: Number(req.params.id) },
            {
              projection: {
                _id: 0,
                conversation: {
                  $filter: {
                    input: "$conversation",
                    cond: {
                      $and: [
                        {
                          $gte: [
                            "$$this.id",
                            Number(req.query.start) || (page - 1) * 25 + 1,
                          ],
                        },
                        {
                          $lte: [
                            "$$this.id",
                            Number(req.query.end) || page * 25,
                          ],
                        },
                      ],
                    },
                  },
                },
              },
            }
          );
    if (!result) {
      res.status(404);
      res.send({ error: "Not found." });
      return;
    }
    if (result?.conversation && !result?.conversation?.length) {
      res.send([null]);
      return;
    }
    res.send(result?.conversation || result);
  } finally {
    await client.close();
  }
});
export default router;
