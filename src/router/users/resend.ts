import { Router } from "express";
import { secret, domain, verificationCl, limitCl, mg, mgDomain } from "../../common";
import { verifyCaptcha } from "../../lib/recaptcha";
import bodyParser from "body-parser";
import { Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import Limit from "../../models/limit";

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
        from: `Metahkg support <support@${mgDomain}>`,
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
