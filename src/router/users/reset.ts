import { Router } from "express";
import { db, domain, limitCl, usersCl, verificationCl } from "../../common";
import bodyParser from "body-parser";
import hash from "hash.js";
import mailgun from "mailgun-js";
import { generate } from "wcyat-rg";
import { Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";

const mg = mailgun({
    apiKey: process.env.mailgun_key,
    domain: process.env.mailgun_domain || "metahkg.org",
});
const router = Router();
router.post("/api/users/reset", bodyParser.json(), async (req, res) => {
    const schema = Type.Object(
        {
            email: Type.String({ format: "email" }),
        },
        { additionalProperties: false }
    );
    if (!ajv.validate(schema, req.body))
        return res.status(400).send({ error: "Bad request." });

    const hashedemail = hash.sha256().update(req.body.email).digest("hex");

    const userData = await usersCl.findOne({ email: hashedemail });
    if (!userData) return res.status(404).send({ error: "User not found." });

    if ((await limitCl.countDocuments({ type: "reset", email: hashedemail })) >= 2)
        return res
            .status(429)
            .send({ error: "You can only request reset password 2 times a day." });

    const verificationCode = generate({
        include: { numbers: true, upper: true, lower: true, special: false },
        digits: 30,
    });

    const reset = {
        from: `Metahkg support <support@${process.env.mailgun_domain || "metahkg.org"}>`,
        to: req.body.email,
        subject: "Metahkg - Reset Password",
        text: `Reset your password with the following link:
    https://${domain}/users/reset?code=${encodeURIComponent(
            verificationCode
        )}&email=${encodeURIComponent(req.body.email)}
    
    Alternatively, use this code at https://${domain}/reset : 
    ${verificationCode}`,
    };
    await mg.messages().send(reset);
    await verificationCl.insertOne({
        type: "reset",
        code: verificationCode,
        email: userData.email,
    });
    await limitCl.insertOne({
        type: "reset",
        email: userData.email,
        createdAt: new Date(),
    });
    res.send({ response: "ok" });
});