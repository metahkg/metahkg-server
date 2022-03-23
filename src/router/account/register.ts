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
dotenv.config();
const mg = mailgun({
  apiKey: process.env.mailgun_key,
  domain: "metahkg.org",
});
const router = express.Router();
/**
 * It checks if the request body is valid
 * @param {any} req - the request object
 * @param {any} res - the response object
 * @returns a boolean.
 */
async function valid(req: any, res: any) {
  if (
    !req.body.user ||
    !req.body.pwd ||
    !req.body.rtoken ||
    !req.body.email ||
    !req.body.sex ||
    req.body.user?.split(" ")[1] ||
    req.body.user?.length > 15 ||
    !(
      typeof req.body.user === "string" &&
      typeof req.body.pwd === "string" &&
      typeof req.body.email === "string" &&
      typeof req.body.rtoken === "string" &&
      (req.body.sex === "M" || req.body.sex === "F")
    ) ||
    Object.keys(req.body).length > 5 ||
    !EmailValidator.validate(req.body.email) ||
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
    (await users.countDocuments({ user: req.body.user })) ||
    (await verification.countDocuments({ user: req.body.user }))
  ) {
    res.status(409);
    res.send({ error: "Username exists." });
    return false;
  } else if (
    (await users.countDocuments({ email: req.body.email })) ||
    (await verification.countDocuments({ email: req.body.email }))
  ) {
    res.status(409);
    res.send({ error: "Email exists." });
    return false;
  }
  return true;
}
router.post("/api/register", body_parser.json(), async (req, res) => {
  if (!(await valid(req, res))) return;
  if (!(await exceptions(req, res, client))) {
    return;
  }
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
https://${domain}/verify?code=${encodeURIComponent(
      code
    )}&email=${encodeURIComponent(req.body.email)}

Alternatively, use this code at https://${domain}/verify : 
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
  });
  res.send({ response: "ok" });
});
export default router;
