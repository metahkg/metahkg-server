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
import { client } from "../../common";
import bcrypt from "bcrypt";
router.post("/api/signin", body_parser.json(), async (req, res) => {
  if (
    !req.body.user ||
    !req.body.pwd ||
    Object.keys(req.body)?.length > 2 ||
    !(typeof req.body.user === "string" && typeof req.body.pwd === "string")
  ) {
    res.status(400);
    res.send({ error: "Bad request." });
    return;
  }
  const users = client.db("metahkg-users").collection("users");
  const verification = client.db("metahkg-users").collection("verification");
  const data =
    (await users.findOne({ user: req.body.user })) ||
    (await users.findOne({ email: req.body.user }));
  if (!data) {
    const vdata =
      (await verification.findOne({ user: req.body.user })) ||
      (await verification.findOne({ email: req.body.user }));
    if (vdata && (await bcrypt.compare(req.body.pwd, vdata.pwd))) {
      res.send({ unverified: true });
      return;
    }
    res.status(400);
    res.send({ error: "User not found." });
    return;
  }
  const correct = await bcrypt.compare(req.body.pwd, data.pwd);
  if (!correct) {
    res.status(401);
    res.send({ error: "Password incorrect." });
    return;
  }
  res.cookie("key", data.key, {
    secure: true,
    httpOnly: true,
    path: "/",
    expires: new Date("2038-01-19T04:14:07.000Z"),
    sameSite: true,
  });
  res.send({ id: data.id, user: data.user });
});
export default router;
