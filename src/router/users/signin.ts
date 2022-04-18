//Signin
/*Syntax: POST /api/signin
{
  name (username OR email): string,
  pwd (password): string
}
*/
import dotenv from "dotenv";
import express from "express";
const router = express.Router();
import body_parser from "body-parser";
import { usersCl, verificationCl } from "../../common";
import bcrypt from "bcrypt";
import hash from "hash.js";
import { Static, Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import { createToken } from "../../lib/auth/createtoken";

dotenv.config();
const schema = Type.Object(
    {
        name: Type.String(),
        pwd: Type.String(),
    },
    { additionalProperties: false }
);

router.post(
    "/api/users/signin",
    body_parser.json(),
    async (req: { body: Static<typeof schema> }, res) => {
        if (!ajv.validate(schema, req.body))
            return res.status(400).send({ error: "Bad request." });

        const user =
            (await usersCl.findOne({ name: req.body.name })) ||
            (await usersCl.findOne({
                email: hash.sha256().update(req.body.name).digest("hex"),
            }));

        if (!user) {
            const verifyUser =
                (await verificationCl.findOne({ name: req.body.name })) ||
                (await verificationCl.findOne({ email: req.body.name }));

            if (verifyUser && (await bcrypt.compare(req.body.pwd, verifyUser.pwd)))
                return res.send({ unverified: true });

            return res.status(400).send({ error: "User not found." });
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