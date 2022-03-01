import express from "express";
import { MongoClient } from "mongodb";
import { mongouri } from "../../common";
import isInteger from "is-sn-integer";
const router = express.Router();
router.get("/api/getvotes", async (req, res) => {
  if (!req.query.id || !isInteger(String(req.query.id))) {
    res.status(400);
    res.send({ error: "Bad request." });
    return;
  }
  const client = new MongoClient(mongouri);
  const id = Number(req.query.id);
  try {
    await client.connect();
    const votes = client.db("metahkg-users").collection("votes");
    const users = client.db("metahkg-users").collection("users");
    const user = await users.findOne({ key: req.cookies.key });
    if (!user) {
      res.status(400);
      res.send({ error: "User not found" });
      return;
    }
    const uservotes = await votes.findOne(
      { id: user.id },
      { projection: { [id]: 1, _id: 0 } }
    );
    res.send(uservotes?.[id] || { none: "none" });
  } finally {
    await client.close();
  }
});
export default router;
