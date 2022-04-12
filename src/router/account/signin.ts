//Signin
/*Syntax: POST /api/signin
{
  user (username OR email): string,
  pwd (password): string
}
*/
import dotenv from "dotenv";
import express from "express";
const router = express.Router();
import body_parser from "body-parser";
import { db } from "../../common";
import bcrypt from "bcrypt";
import hash from "hash.js";
import { Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import { createToken } from "../auth/createtoken";

dotenv.config();

router.post("/api/users/signin", body_parser.json(), async (req, res) => {
    const schema = Type.Object(
        {
            user: Type.String(),
            pwd: Type.String(),
        },
        { additionalProperties: false }
    );
    if (!ajv.validate(schema, req.body))
        return res.status(400).send({ error: "Bad request." });

    const users = db.collection("users");
    const verification = db.collection("verification");

    const user =
        (await users.findOne({ user: req.body.user })) ||
        (await users.findOne({
            email: hash.sha256().update(req.body.user).digest("hex"),
        }));

    if (!user) {
        const verifyUser =
            (await verification.findOne({ user: req.body.user })) ||
            (await verification.findOne({ email: req.body.user }));
        if (verifyUser && (await bcrypt.compare(req.body.pwd, verifyUser.pwd))) {
            return res.send({ unverified: true });
        }
        return res.status(400).send({ error: "User not found." });
    }

    const pwdMatch = await bcrypt.compare(req.body.pwd, user.pwd);
    if (!pwdMatch) return res.status(401).send({ error: "Password incorrect." });

    res.send({
        id: user.id,
        user: user.user,
        token: createToken(user.id, user.user, user.sex, user.role),
    });
});
export default router;
