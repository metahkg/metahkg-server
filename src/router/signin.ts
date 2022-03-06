//Signin
/*Syntax: POST /api/signin 
{
  user (username OR email): string,
  pwd (password): string
}
*/
//sets a cookie "key" if success
import dotenv from "dotenv";
dotenv.config();
import express from "express";
const router = express.Router();
import body_parser from "body-parser";
import { MongoClient } from "mongodb";
import { mongouri } from "../common";
import bcrypt from "bcrypt";
router.post("/api/signin", body_parser.json(), async (req, res) => {
  const client = new MongoClient(mongouri);
  if (
    !req.body.user ||
    !req.body.pwd ||
    Object.keys(req.body)?.length > 2 ||
    !(typeof req.body.user === "string" && typeof req.body.pwd === "string")
  ) {
    res.status(400);
    res.send({ error: "Bad request" });
    return;
  }
  await client.connect();
  const users = client.db("metahkg-users").collection("users");
  const data =
    (await users.findOne({ user: req.body.user })) ||
    (await users.findOne({ email: req.body.user }));
  if (!data) {
    res.status(400);
    res.send({ error: "User not found" });
    return;
  }
  const correct = await bcrypt.compare(req.body.pwd, data.pwd);
  if (!correct) {
    res.status(401);
    res.send({ error: "Password incorrect." });
    return;
  }
  res.cookie("key", data.key, {
    domain: process.env.domain,
    secure: true,
    httpOnly: true,
    path: "/",
    expires: new Date("2038-01-19T04:14:07.000Z"),
  });
  res.send({ key: data.key, id: data.id, user: data.user });
});
export default router;
