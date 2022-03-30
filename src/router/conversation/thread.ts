/**
 * get conversation
 * Syntax: GET /api/thread/<thread id>/<"conversation"/"users">
 * conversation: main conversation content
 * users: content of users involved in the conversation
 */
import express from "express";
const router = express.Router();
import { client } from "../../common";
import isInteger from "is-sn-integer";
import { hiddencats } from "../lib/hiddencats";
import { signedin } from "../lib/users";
import { Type } from "@sinclair/typebox";
import { ajv } from "../lib/ajv";
/**
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
  const schema = Type.Object(
    {
      id: Type.Integer(),
      page: Type.Integer({ minimum: 1 }),
      type: Type.Union([Type.Literal(0), Type.Literal(1), Type.Literal(2)]),
      start: Type.Optional(Type.Integer()),
      end: Type.Optional(Type.Integer()),
    },
    { additionalProperties: false }
  );
  if (
    !ajv.validate(schema, {
      id: id,
      page: page,
      type: type,
      start: start || undefined,
      end: end || undefined,
    }) ||
    (start &&
      (start > end ||
        (!end && (start < (page - 1) * 25 + 1 || start > page * 25)))) ||
    (end &&
      (end < start ||
        (!start && (end > page * 25 || end < (page - 1) * 25 + 1))))
  ) {
    res.status(400);
    res.send({ error: "Bad request." });
    return;
  }
  const metahkgThreads = client.db("metahkg-threads");
  const conversation = metahkgThreads.collection("conversation");
  const summary = metahkgThreads.collection("summary");
  const threadsummary = await summary.findOne(
    { id: Number(req.params.id) },
    {
      projection: {
        _id: 0,
        sex: 0,
        vote: 0,
        lastModified: 0,
        createdAt: 0,
      },
    }
  );
  if (!threadsummary) {
    res.status(404);
    res.send({ error: "Not Found" });
    return;
  }
  if (
    !(await signedin(req.cookies.key)) &&
    (await hiddencats()).includes(threadsummary.category)
  ) {
    res.status(401);
    res.send({ error: "Permission denied." });
    return;
  }
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
  const result =
    type === 1
      ? threadsummary
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
                        $lte: ["$$this.id", Number(req.query.end) || page * 25],
                      },
                    ],
                  },
                },
              },
            },
          }
        );
  if (result?.conversation && !result?.conversation?.length) {
    res.send([null]);
    return;
  }
  res.send(result?.conversation || result);
});
export default router;
