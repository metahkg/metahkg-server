import { Router } from "express";
import body_parser from "body-parser";
import { Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import { db } from "../../common";
import verifyUser from "../auth/verify";
import { createToken } from "../auth/createtoken";
const router = Router();
router.post("/api/users/editprofile", body_parser.json(), async (req, res) => {
    const schema = Type.Object(
        {
            user: Type.Optional(Type.String()),
            sex: Type.Optional(Type.Union([Type.Literal("M"), Type.Literal("F")])),
        },
        { additionalProperties: false }
    );
    if (!ajv.validate(schema, req.body) || !Object.keys(req.body).length)
        return res.status(400).send({ error: "Bad request." });
    const user = verifyUser(req.headers.authorization);
    if (!user) return res.status(404).send({ error: "User not found." });

    const users = db.collection("users");
    const summary = db.collection("summary");
    const threadusers = db.collection("threadusers");
    await summary.updateMany(
        { op: user.user },
        { $set: { op: req.body.user, sex: req.body.sex } }
    );
    await threadusers.updateMany(
        {
            [user.id]: {
                name: user.user,
                sex: user.sex,
            },
        },
        {
            $set: {
                [user.id]: {
                    name: req.body.user || user.user,
                    sex: req.body.sex || user.sex,
                },
            },
        }
    );
    await users.updateOne({ id: user.id }, { $set: req.body });
    res.send({
        response: "ok",
        token: createToken(user.id, user.user, user.sex, user.role),
    });
});
export default router;
