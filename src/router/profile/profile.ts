import express from "express";
import isInteger from "is-sn-integer";
import { summaryCl, usersCl } from "../../common";
import verifyUser from "../auth/verify";

const router = express.Router();

router.get("/api/profile/:id", async (req, res) => {
    if (!isInteger(req.params.id) && req.params.id !== "self")
        return res.status(400).send({ error: "Bad request." });

    const user = verifyUser(req.headers.authorization);

    const requestedUser = await usersCl.findOne(
        {
            id: req.params.id === "self" && user ? user.id : Number(req.params.id),
        },
        {
            projection: req.query.nameonly
                ? { user: 1, _id: 0 }
                : {
                      id: 1,
                      user: 1,
                      createdAt: 1,
                      sex: 1,
                      admin: 1,
                      _id: 0,
                  },
        }
    );

    if (!requestedUser) return res.status(400).send({ error: "User not found" });

    !req.query.nameonly &&
        (requestedUser.count = await summaryCl.countDocuments({
            op: requestedUser.user,
        }));

    res.send(user);
});

export default router;
