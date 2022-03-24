import { Router } from "express";
import { client, domain } from "../../common";
import bodyParser from "body-parser";
import hash from "hash.js";
import mailgun from "mailgun-js";
import { generate } from "wcyat-rg";
const mg = mailgun({
  apiKey: process.env.mailgun_key,
  domain: process.env.mailgun_domain || "metahkg.org",
});
const router = Router();
router.post("/api/account/resetpwd", bodyParser.json(), async (req, res) => {
  if (!req.body.email || typeof req.body.email !== "string") {
    res.status(400);
    res.send({ error: "Bad request." });
    return;
  }
  const metahkgUsers = client.db("metahkg-users");
  const users = metahkgUsers.collection("users");
  const verification = metahkgUsers.collection("verification");
  const limit = metahkgUsers.collection("limit");
  const hashedemail = hash.sha256().update(req.body.email).digest("hex");
  const user = await users.findOne({ email: hashedemail });
  if (!user) {
    res.status(404);
    res.send({ error: "User not found." });
    return;
  }
  if (
    (await limit.countDocuments({ type: "reset", email: hashedemail })) >= 2
  ) {
    res.status(429);
    res.send({ error: "You can only request reset password 2 times a day." });
    return;
  }
  const code = generate({
    include: { numbers: true, upper: true, lower: true, special: false },
    digits: 30,
  });
  const reset = {
    from: `Metahkg support <support@${
      process.env.mailgun_domain || "metahkg.org"
    }>`,
    to: req.body.email,
    subject: "Metahkg - Reset Password",
    text: `Reset your password with the following link:
    https://${domain}/reset?code=${encodeURIComponent(
      code
    )}&email=${encodeURIComponent(req.body.email)}
    
    Alternatively, use this code at https://${domain}/reset : 
    ${code}`,
  };
  await mg.messages().send(reset);
  await verification.insertOne({
    type: "reset",
    code: code,
    email: user.email,
  });
  await limit.insertOne({ type: "reset", email: user.email });
  res.send({ response: "ok" });
});
