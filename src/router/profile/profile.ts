import express from "express";
import User from "../../models/user";
import { threadCl, usersCl } from "../../common";
import verifyUser from "../../lib/auth/verify";
import { ajv } from "../../lib/ajv";
import { Type } from "@sinclair/typebox";

const router = express.Router();

router.get("/api/profile/:id", async (req, res) => {
    const id = req.params.id === "self" ? req.params.id : Number(req.params.id);

    if (
        !ajv.validate(
            Type.Union([Type.Integer({ minimum: 1 }), Type.Literal("self")]),
            id
        )
    )
        return res.status(400).send({ error: "Bad request." });

    const user = verifyUser(req.headers.authorization);

    const requestedUser = (await usersCl.findOne(
        {
            id: req.params.id === "self" && user ? user.id : Number(req.params.id),
        },
        {
            projection: req.query.nameonly
                ? { name: 1, _id: 0 }
                : {
                      id: 1,
                      name: 1,
                      createdAt: 1,
                      sex: 1,
                      role: 1,
                      _id: 0,
                  },
        }
    )) as User;

    if (!requestedUser) return res.status(400).send({ error: "User not found" });

    let count: number;

    if (!req.query.nameonly)
        count = await threadCl.countDocuments({
            "op.id": requestedUser.id,
        });

    res.send(Object.assign(requestedUser, { count }));
});

export default router;
