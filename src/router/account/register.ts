//Signup for an account
//humans only
/*Syntax: POST /api/register
{
  user (username): string,
  pwd (password, sha256 hashed): string,
  email: string,
  rtoken (recaptcha token): string,
  sex: string
}
*/
import dotenv from "dotenv";
import express from "express";
import { MongoClient } from "mongodb";
import body_parser from "body-parser";
import { client, domain, secret } from "../../common";
import EmailValidator from "email-validator";
import { verify } from "../lib/recaptcha";
import bcrypt from "bcrypt";
import mailgun from "mailgun-js";
import { generate } from "wcyat-rg";
import { Type } from "@sinclair/typebox";
import { ajv } from "../lib/ajv";
dotenv.config();
const mg = mailgun({
  apiKey: process.env.mailgun_key,
  domain: process.env.mailgun_domain || "metahkg.org",
});
const router = express.Router();
const signupMode =
  {
    normal: "normal",
    none: "none",
    invite: "invite",
  }[process.env.signup] || "normal";
/**
 * It checks if the request body is valid
 * @param {any} req - the request object
 * @param {any} res - the response object
 * @returns a boolean.
 */
async function valid(req: any, res: any) {
  const schema = Type.Object(
    {
      user: Type.String({ maxLength: 15 }),
      pwd: Type.String({ minLength: 8 }),
      email: Type.String({ format: "email" }),
      rtoken: Type.String(),
      sex: Type.Union([Type.Literal("M"), Type.Literal("F")]),
      invitecode:
        signupMode === "invite"
          ? Type.String()
          : Type.Optional(Type.Number({ minimum: 0, maximum: 0 })),
    },
    { additionalProperties: false }
  );
  if (signupMode === "none") {
    res.status(429);
    res.send({ error: "No signup allowed." });
    return false;
  } else if (
    signupMode === "invite" &&
    !(await client
      .db("metahkg-users")
      .collection("invite")
      .findOne({ code: req.body.invitecode }))
  ) {
    res.status(409);
    res.send({ error: "Invalid invite code." });
    return false;
  }
  if (
    !ajv.validate(schema, req.body) ||
    !req.body.user?.match(/\S{1,15}/i) ||
    EmailValidator.validate(req.body.user)
  ) {
    res.status(400);
    res.send({ error: "Bad request." });
    return false;
  }
  if (!(await verify(secret, req.body.rtoken))) {
    res.status(400);
    res.send({ error: "recaptcha token invalid." });
    return false;
  }
  return true;
}
/**
 * If the user is banned, return a 403. If the user or email already exists, return a 409
 * @param {any} req - the request object
 * @param {any} res - The response object.
 * @param {MongoClient} client - MongoClient
 * @returns a boolean.
 */
async function exceptions(req: any, res: any, client: MongoClient) {
  const banned = client.db("metahkg-users").collection("banned");
  if (await banned.findOne({ ip: req.ip })) {
    res.status(403);
    res.send({ error: "You are banned from creating accounts." });
    console.log(`Banned ${req.ip}`);
    return false;
  }
  const verification = client.db("metahkg-users").collection("verification");
  const users = client.db("metahkg-users").collection("users");
  if (
    (await users.findOne({ user: req.body.user })) ||
    (await verification.findOne({ user: req.body.user }))
  ) {
    res.status(409);
    res.send({ error: "Username exists." });
    return false;
  } else if (
    (await users.findOne({ email: req.body.email })) ||
    (await verification.findOne({ email: req.body.email }))
  ) {
    res.status(409);
    res.send({ error: "Email exists." });
    return false;
  }
  return true;
}
router.post("/api/users/register", body_parser.json(), async (req, res) => {
  if (!(await valid(req, res))) return;
  if (!(await exceptions(req, res, client))) return;
  const verification = client.db("metahkg-users").collection("verification");
  const code = generate({
    include: { numbers: true, upper: true, lower: true, special: false },
    digits: 30,
  });
  const verify = {
    from: `Metahkg support <support@${
      process.env.mailgun_domain || "metahkg.org"
    }>`,
    to: req.body.email,
    subject: "Metahkg - verify your email",
    text: `Verify your email with the following link:
https://${domain}/users/verify?code=${encodeURIComponent(
      code
    )}&email=${encodeURIComponent(req.body.email)}

Alternatively, use this code at https://${domain}/users/verify : 
${code}`,
  };
  await mg.messages().send(verify);
  const hashed = await bcrypt.hash(req.body.pwd, 10);
  await verification.insertOne({
    createdAt: new Date(),
    code: code,
    email: req.body.email,
    pwd: hashed,
    user: req.body.user,
    sex: req.body.sex,
    type: "register",
  });
  res.send({ response: "ok" });
});
export default router;
