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
import { Router } from "express";
import body_parser from "body-parser";
import { domain, secret, usersCl, verificationCl, inviteCl } from "../../common";
import EmailValidator from "email-validator";
import { verifyCaptcha } from "../../lib/recaptcha";
import bcrypt from "bcrypt";
import mailgun from "mailgun-js";
import { generate } from "wcyat-rg";
import { Static, Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";

const mg = mailgun({
    apiKey: process.env.mailgun_key || "",
    domain: process.env.domain || "metahkg.org",
});
const router = Router();

const schema = Type.Object(
    {
        name: Type.RegEx(/^\S{1,15}$/),
        pwd: Type.String({ minLength: 8 }),
        email: Type.String({ format: "email" }),
        rtoken: Type.String(),
        sex: Type.Union([Type.Literal("M"), Type.Literal("F")]),
        invitecode: Type.Optional(Type.String()),
    },
    { additionalProperties: false }
);

router.post(
    "/api/users/register",
    body_parser.json(),
    async (req: { body: Static<typeof schema> }, res) => {
        if (!ajv.validate(schema, req.body) || EmailValidator.validate(req.body.name))
            return res.status(400).send({ error: "Bad request." });

        if (!(await verifyCaptcha(secret, req.body.rtoken)))
            return res.status(400).send({ error: "recaptcha token invalid." });

        // signup modes (process.env.signupMode)
        const signupMode =
            {
                normal: "normal",
                none: "none",
                invite: "invite",
            }[process.env.signupMode || ""] || "normal";

        if (signupMode === "none")
            return res.status(429).send({ error: "No signup allowed." });

        // TODO: WARNING: frontend not implemented !!!
        if (
            signupMode === "invite" &&
            !(await inviteCl.findOne({ code: req.body.invitecode }))
        )
            return res.status(409).send({ error: "Invalid invite code." });

        if (
            (await usersCl.findOne({
                $or: [{ user: req.body.name }, { email: req.body.email }],
            })) ||
            (await verificationCl.findOne({
                $or: [{ user: req.body.name }, { email: req.body.email }],
            }))
        )
            return res.status(409).send({ error: "Username or email exists." });

        const code = generate({
            include: { numbers: true, upper: true, lower: true, special: false },
            digits: 30,
        });

        const verify = {
            from: `Metahkg support <support@${process.env.domain || "metahkg.org"}>`,
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

        const hashedPwd = await bcrypt.hash(req.body.pwd, 10);

        await verificationCl.insertOne({
            createdAt: new Date(),
            code: code,
            email: req.body.email,
            pwd: hashedPwd,
            name: req.body.name,
            sex: req.body.sex,
            type: "register",
        });
        res.send({ response: "ok" });
    }
);
export default router;
