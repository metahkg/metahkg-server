import { Router } from "express";
import body_parser from "body-parser";
import { Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import { usersCl } from "../../common";
import verifyUser from "../auth/verify";
import { createToken } from "../auth/createtoken";
const router = Router();
router.post("/api/users/editprofile", body_parser.json(), async (req, res) => {
    const schema = Type.Object(
        {
            name: Type.Optional(Type.String()),
            sex: Type.Optional(Type.Union([Type.Literal("M"), Type.Literal("F")])),
        },
        { additionalProperties: false }
    );
    if (!ajv.validate(schema, req.body) || !Object.keys(req.body).length)
        return res.status(400).send({ error: "Bad request." });
        
    const user = verifyUser(req.headers.authorization);
    if (!user) return res.status(404).send({ error: "User not found." });

    await usersCl.updateOne({ id: user.id }, { $set: req.body });

    res.send({
        response: "ok",
        token: createToken(user.id, req.body.name, req.body.sex, user.role),
    });
});
export default router;
