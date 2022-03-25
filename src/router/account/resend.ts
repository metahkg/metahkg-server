import dotenv from "dotenv";
import { Router } from "express";
import EmailValidator from "email-validator";
import { allequal, secret, domain, client } from "../../common";
import { verify } from "../lib/recaptcha";
import mailgun from "mailgun-js";
import bodyParser from "body-parser";
dotenv.config();
const mg = mailgun({
  apiKey: process.env.mailgun_key,
  domain: process.env.mailgun_domain || "metahkg.org",
});
const router = Router();
router.post("/api/resend", bodyParser.json(), async (req, res) => {
  if (
    !req.body.email ||
    !req.body.rtoken ||
    !allequal([typeof req.body.email, typeof req.body.rtoken, "string"]) ||
    !EmailValidator.validate(req.body.email)
  ) {
    res.status(400);
    res.send({ error: "Bad request." });
    return;
  }
  if (!(await verify(secret, req.body.rtoken))) {
    res.status(400);
    res.send({ error: "recaptcha token invalid." });
    return;
  }
  const metahkgUsers = client.db("metahkg-users");
  const limit = metahkgUsers.collection("limit");
  const verification = metahkgUsers.collection("verification");
  const vuser = await verification.findOne({ email: req.body.email });
  if (!vuser) {
    res.status(404);
    res.send({
      error: "Email not found.",
    });
    return;
  }
  if (
    (await limit.countDocuments({ type: "resend", email: req.body.email })) >= 5
  ) {
    res.status(429);
    res.send({ error: "You can only resend 5 times a day." });
    return;
  }
  const verifymsg = {
    from: `Metahkg support <support@${
      process.env.mailgun_domain || "metahkg.org"
    }>`,
    to: req.body.email,
    subject: "Metahkg - verify your email",
    text: `Verify your email with the following link:
https://${domain}/verify?code=${encodeURIComponent(
      vuser.code
    )}&email=${encodeURIComponent(req.body.email)}

Alternatively, use this code at https://${domain}/verify :
${vuser.code}`,
  };
  await mg.messages().send(verifymsg);
  await limit.insertOne({ type: "resend", email: req.body.email });
  res.send({ success: true });
});
export default router;
