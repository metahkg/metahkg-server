//verify email
/*Syntax: POST /api/verify
  {
    email (email used in sign up): string,
    code (verification code sent to user's email address): string
  }
*/
//if successfully verified, sets a cookie "key" of user's key which is randomly generated
import dotenv from "dotenv";
import express from "express";
import { MongoClient } from "mongodb";
import body_parser from "body-parser";
import { mongouri } from "../../common";
import { generate } from "wcyat-rg";
import EmailValidator from "email-validator";
dotenv.config();
const router = express.Router();
router.post("/api/verify", body_parser.json(), async (req, res) => {
  const client = new MongoClient(mongouri);
  if (
    !req.body.email ||
    !req.body.code ||
    !(
      typeof req.body.email === "string" && typeof req.body.code === "string"
    ) ||
    !EmailValidator.validate(req.body.email) ||
    Object.keys(req.body)?.length > 2
  ) {
    res.status(400);
    res.send({ error: "Bad request." });
    return;
  }
  if (req.body.code?.length !== 30) {
    res.status(400);
    res.send({error: "Code must be of 30 digits."});
    return;
  }
  await client.connect();
  const verification = client.db("metahkg-users").collection("verification");
  const users = client.db("metahkg-users").collection("users");
  const data = await verification.findOne({ email: req.body.email });
  if (!data) {
    res.status(404);
    res.send({ error: "Not found. Your code night have expired." });
  } else if (data.code !== req.body.code) {
    res.status(401);
    res.send({ error: "Code incorrect." });
  } else {
    delete data._id;
    delete data.code;
    data.key = generate({
      include: { numbers: true, upper: true, lower: true, special: false },
      digits: 40,
    });
    while (await users.countDocuments({ key: data.key })) {
      data.key = generate({
        include: { numbers: true, upper: true, lower: true, special: false },
        digits: 40,
      });
    }
    data.id =
      (
        await users
          .find()
          .project({ id: 1, _id: 0 })
          .sort({ id: -1 })
          .limit(1)
          .toArray()
      )[0]?.id + 1 || 1;
    await users.insertOne(data);
    res.cookie("key", data.key, {
      domain: process.env.domain,
      secure: true,
      httpOnly: true,
      path: "/",
      expires: new Date("2038-01-19T04:14:07.000Z"),
    });
    res.send({ id: data.id, user: data.user, success: true });
    await verification.deleteOne({ email: req.body.email });
  }
});
export default router;
