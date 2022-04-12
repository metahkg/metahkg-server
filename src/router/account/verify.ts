//verify email
/*Syntax: POST /api/verify
  {
    email (email used in sign up): string,
    code (verification code sent to user's email address): string
  }
*/
//if successfully verified, sets a cookie "key" of user's key which is randomly generated
import dotenv from "dotenv";
import express from "express";
import body_parser from "body-parser";
import { db } from "../../common";
import hash from "hash.js";
import { Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import { createToken } from "../auth/createtoken";

dotenv.config();
const router = express.Router();

router.post("/api/users/verify", body_parser.json(), async (req, res) => {
    const schema = Type.Object(
        {
            email: Type.String({ format: "email" }),
            code: Type.String(),
        },
        { additionalProperties: false }
    );
    if (!ajv.validate(schema, req.body))
        return res.status(400).send({ error: "Bad request." });

    if (req.body.code?.length !== 30)
        return res.status(400).send({ error: "Code must be of 30 digits." });

    const verification = db.collection("verification");
    const users = db.collection("users");

    const data = await verification.findOne({
        type: "register",
        email: req.body.email,
    });

    if (!data)
        return res
            .status(404)
            .send({ error: "Not found. Your code night have expired." });

    if (data.code !== req.body.code)
        return res.status(401).send({ error: "Code incorrect" });

    const newUserId =
        (await users.find().sort({ id: -1 }).limit(1).toArray())[0]?.id + 1 || 1;
    const newUser: {
        user: string;
        id: number;
        email: string;
        role: "user" | "admin";
        createdAt: Date;
        sex: "M" | "F";
    } = {
        user: data.user,
        id: newUserId,
        email: hash.sha256().update(data.email).digest("hex"),
        role: "user",
        createdAt: new Date(),
        sex: data.sex,
    };

    const token = createToken(newUser.id, newUser.user, newUser.sex, newUser.role);
    await users.insertOne(newUser);

    res.send({ id: data.id, user: data.user, token: token });
    await verification.deleteOne({ email: req.body.email });
});

export default router;
