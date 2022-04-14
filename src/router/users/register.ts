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
import express, { Response } from "express";
import body_parser from "body-parser";
import { domain, secret, db, usersCl, verificationCl } from "../../common";
import EmailValidator from "email-validator";
import { verify } from "../../lib/recaptcha";
import bcrypt from "bcrypt";
import mailgun from "mailgun-js";
import { generate } from "wcyat-rg";
import { Static, Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";

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
const schema = Type.Object(
    {
        name: Type.String({ maxLength: 15 }),
        pwd: Type.String({ minLength: 8 }),
        email: Type.String({ format: "email" }),
        rtoken: Type.String(),
        sex: Type.Union([Type.Literal("M"), Type.Literal("F")]),
        invitecode: Type.Optional(Type.String()),
    },
    { additionalProperties: false }
);
async function valid(req: { body: Static<typeof schema> }, res: Response) {
    if (signupMode === "none") {
        res.status(429).send({ error: "No signup allowed." });
        return false;
    }

    // WARNING: frontend not implemented !!!
    if (
        signupMode === "invite" &&
        !(await db.collection("invite").findOne({ code: req.body.invitecode }))
    ) {
        res.status(409).send({ error: "Invalid invite code." });
        return false;
    }

    if (
        !ajv.validate(schema, req.body) ||
        !req.body.name?.match(/\S{1,15}/i) ||
        EmailValidator.validate(req.body.name)
    ) {
        res.status(400).send({ error: "Bad request." });
        return false;
    }
    if (!(await verify(secret, req.body.rtoken))) {
        res.status(400).send({ error: "recaptcha token invalid." });
        return false;
    }
    return true;
}

/**
 * @param {any} req - the request object
 * @param {any} res - The response object.
 * @returns a boolean.
 */
async function exceptions(req: { body: Static<typeof schema> }, res: Response) {
    if (
        (await usersCl.findOne({ user: req.body.name })) ||
        (await verificationCl.findOne({ user: req.body.name }))
    ) {
        res.status(409).send({ error: "Username exists." });
        return false;
    }
    if (
        (await usersCl.findOne({ email: req.body.email })) ||
        (await verificationCl.findOne({ email: req.body.email }))
    ) {
        res.status(409).send({ error: "Email exists." });
        return false;
    }
    return true;
}

router.post(
    "/api/users/register",
    body_parser.json(),
    async (req: { body: Static<typeof schema> }, res) => {
        if (!(await valid(req, res))) return;
        if (!(await exceptions(req, res))) return;

        const verification = db.collection("verification");
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
            name: req.body.name,
            sex: req.body.sex,
            type: "register",
        });
        res.send({ response: "ok" });
    }
);
export default router;
