import dotenv from "dotenv";
import { Router } from "express";
import { secret, domain, verificationCl, limitCl } from "../../common";
import { verifyCaptcha } from "../../lib/recaptcha";
import mailgun from "mailgun-js";
import bodyParser from "body-parser";
import { Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import Limit from "../../models/limit";

dotenv.config();
const mg = mailgun({
    apiKey: process.env.mailgun_key || "",
    domain: process.env.domain || "metahkg.org",
});
const router = Router();
router.post("/api/users/resend", bodyParser.json(), async (req, res) => {
    const schema = Type.Object(
        { email: Type.String({ format: "email" }), rtoken: Type.String() },
        { additionalProperties: false }
    );
    if (!ajv.validate(schema, req.body))
        return res.status(400).send({ error: "Bad request." });

    if (!(await verifyCaptcha(secret, req.body.rtoken)))
        return res.status(400).send({ error: "recaptcha token invalid." });

    const verificationUserData = await verificationCl.findOne({ email: req.body.email });
    if (!verificationUserData) {
        return res.status(404).send({
            error: "Email not found.",
        });
    }
    if ((await limitCl.countDocuments({ type: "resend", email: req.body.email })) >= 5)
        return res.status(429).send({ error: "You can only resend 5 times a day." });

    const verifyMsg = {
        from: `Metahkg support <support@${process.env.domain || "metahkg.org"}>`,
        to: req.body.email,
        subject: "Metahkg - verify your email",
        text: `Verify your email with the following link:
https://${domain}/users/verify?code=${encodeURIComponent(
            verificationUserData.code
        )}&email=${encodeURIComponent(req.body.email)}

Alternatively, use this code at https://${domain}/verify :
${verificationUserData.code}`,
    };
    await mg.messages().send(verifyMsg);
    await limitCl.insertOne({
        type: "resend",
        email: req.body.email,
        createdAt: new Date(),
    } as Limit);
    res.send({ success: true });
});
export default router;
