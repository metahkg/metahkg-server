import body_parser from "body-parser";
import express from "express";
import { client } from "../../common";
import isInteger from "is-sn-integer";
const router = express.Router();
router.post("/api/vote", body_parser.json(), async (req, res) => {
  if (
    !req.body.id ||
    !req.body.cid ||
    !req.body.vote ||
    Object.keys(req.body)?.length > 3 ||
    !(
      typeof req.body.cid === "number" &&
      typeof req.body.id === "number" &&
      isInteger(req.body.cid) &&
      req.body.cid > 0 &&
      req.body.id > 0 &&
      ["U", "D"].includes(req.body.vote)
    )
  ) {
    res.status(400);
    res.send({ error: "Bad request." });
    return;
  }

  const conversation = client.db("metahkg-threads").collection("conversation");
  const summary = client.db("metahkg-threads").collection("summary");
  const users = client.db("metahkg-users").collection("users");
  const votes = client.db("metahkg-users").collection("votes");
  const user = await users.findOne({ key: req.cookies.key });
  if (!user) {
    res.status(400);
    res.send({ error: "User not found." });
    return;
  }
  const thread = await conversation.findOne(
    { id: req.body.id },
    {
      projection: {
        conversation: {
          $filter: {
            input: "$conversation",
            cond: {
              $and: [
                {
                  $gte: ["$$this.id", req.body.cid],
                },
                { $lte: ["$$this.id", req.body.cid] },
              ],
            },
          },
        },
      },
    }
  );
  if (!thread) {
    res.status(404);
    res.send({ error: "Thread not found." });
    return;
  }
  const index = req.body.cid - 1;
  const uservotes = await votes.findOne({ id: user.id });
  if (!uservotes) {
    await votes.insertOne({ id: user.id });
  } else if (uservotes?.[req.body.id]?.[req.body.cid]) {
    res.status(403);
    res.send({ error: "You have already voted." });
    return;
  }
  await votes.updateOne(
    { id: user.id },
    { $set: { [`${req.body.id}.${req.body.cid}`]: req.body.vote } }
  );
  if (!thread.conversation[index]?.[req.body.vote]) {
    await conversation.updateOne(
      { id: req.body.id },
      { $set: { [`conversation.${index}.${req.body.vote}`]: 0 } }
    );
  }
  await conversation.updateOne(
    { id: req.body.id },
    { $inc: { [`conversation.${index}.${req.body.vote}`]: 1 } }
  );
  if (req.body.cid === 1) {
    await summary.updateOne(
      { id: req.body.id },
      { $inc: { vote: req.body.vote === "U" ? 1 : -1 } }
    );
  }
  res.send({ response: "ok" });
});
export default router;
