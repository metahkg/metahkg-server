//Sign in
/*Syntax: POST /api/signin
{
  name (username OR email): string,
  pwd (password): string
}
*/
import dotenv from "dotenv";
import express from "express";
import body_parser from "body-parser";
import { usersCl, verificationCl } from "../../common";
import bcrypt from "bcrypt";
import { Static, Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import { createToken } from "../../lib/auth/createtoken";
import User from "../../models/user";
import hash from "hash.js";

dotenv.config();
const router = express.Router();

const schema = Type.Object(
    {
        name: Type.Union([Type.RegEx(/^\S{1,15}$/), Type.String({ format: "email" })]),
        // check if password is a sha256 hash
        pwd: Type.RegEx(/^[a-f0-9]{64}$/i),
    },
    { additionalProperties: false }
);

router.post(
    "/api/users/signin",
    body_parser.json(),
    async (req: { body: Static<typeof schema> }, res) => {
        if (!ajv.validate(schema, req.body))
            return res.status(400).send({ error: "Bad request." });

        const user = (await usersCl.findOne({
            $or: [
                { name: req.body.name },
                { email: hash.sha256().update(req.body.name).digest("hex") },
            ],
        })) as User;

        if (!user) {
            const verifyUser = await verificationCl.findOne({
                $or: [
                    { name: req.body.name },
                    { email: hash.sha256().update(req.body.name).digest("hex") },
                ],
            });

            if (verifyUser && (await bcrypt.compare(req.body.pwd, verifyUser.pwd)))
                return res.send({ unverified: true });

            return res.status(404).send({ error: "User not found." });
        }

        const pwdMatch = await bcrypt.compare(req.body.pwd, user.pwd);
        if (!pwdMatch) return res.status(401).send({ error: "Password incorrect." });

        res.send({
            id: user.id,
            name: user.name,
            token: createToken(user.id, user.name, user.sex, user.role),
        });
    }
);
export default router;
