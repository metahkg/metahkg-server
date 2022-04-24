import express from "express";
import isInteger from "is-sn-integer";
import User from "../../models/user";
import { threadCl, usersCl } from "../../common";
import verifyUser from "../../lib/auth/verify";

const router = express.Router();

router.get("/api/profile/:id", async (req, res) => {
    if (!isInteger(req.params.id) && req.params.id !== "self")
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

    if (!req.query.nameonly) {
        count = await threadCl.countDocuments({
            "op.id": requestedUser.id,
        });
    }

    res.send(Object.assign(requestedUser, { count }));
});

export default router;
