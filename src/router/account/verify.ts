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
import { generate } from "wcyat-rg";
import hash from "hash.js";
import { Type } from "@sinclair/typebox";
import { ajv } from "../lib/ajv";

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
    if (!ajv.validate(schema, req.body)) {
        res.status(400);
        res.send({ error: "Bad request." });
        return;
    }
    if (req.body.code?.length !== 30) {
        res.status(400);
        res.send({ error: "Code must be of 30 digits." });
        return;
    }
    const verification = db.collection("verification");
    const users = db.collection("users");
    const data = await verification.findOne({
        type: "register",
        email: req.body.email,
    });
    if (!data) {
        res.status(404);
        res.send({ error: "Not found. Your code night have expired." });
    } else if (data.code !== req.body.code) {
        res.status(401);
        res.send({ error: "Code incorrect." });
    } else {
        delete data._id;
        delete data.code;
        data.key = generate({
            include: { numbers: true, upper: true, lower: true, special: false },
            digits: 40,
        });
        while (await users.countDocuments({ key: data.key })) {
            data.key = generate({
                include: { numbers: true, upper: true, lower: true, special: false },
                digits: 40,
            });
        }
        data.id = (await users.find().project({ id: 1, _id: 0 }).sort({ id: -1 }).limit(1).toArray())[0]?.id + 1 || 1;
        data.email = hash.sha256().update(data.email).digest("hex");
        await users.insertOne(data);
        res.cookie("key", data.key, {
            secure: true,
            httpOnly: true,
            path: "/",
            expires: new Date("2038-01-19T04:14:07.000Z"),
            sameSite: true,
        });
        res.send({ id: data.id, user: data.user, success: true });
        await verification.deleteOne({ email: req.body.email });
    }
});
export default router;
