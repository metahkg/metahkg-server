import express from "express";
import isInteger from "is-sn-integer";
import User from "../../models/user";
import { threadCl, usersCl } from "../../common";
import verifyUser from "../../lib/auth/verify";
import Thread from "../../models/thread";
const router = express.Router();
/**
 * get threads created by a user
 * syntax: GET /api/history/<user-id | "self">
 * returns an array of objects
 * sort:
 * 0: by creation time //default
 * 1: by last modification time
 */
router.get("/api/history/:id", async (req, res) => {
    if (
        (!isInteger(req.params.id) && req.params.id !== "self") ||
        (req.query.sort && ![0, 1].includes(Number(req.query.sort))) ||
        (req.query.page &&
            (!isInteger(Number(req.query.page)) || Number(req.query.page) < 1))
    ) {
        return res.status(400).send({ error: "Bad request." });
    }
    const page = Number(req.query.page) || 1;
    const user =
        req.params.id === "self"
            ? verifyUser(req.headers.authorization)
            : ((await usersCl.findOne({ id: Number(req.params.id) })) as User);

    if (!user) return res.status(400).send({ error: "User not found." });

    const sort: any = {
        0: { createdAt: -1 },
        1: { lastModified: -1 },
    }[Number(req.query.sort ?? 0)];

    const history = (await threadCl
        .find({ "op.id": user.id })
        .sort(sort)
        .skip(25 * (page - 1))
        .limit(25)
        .project({ _id: 0, conversation: 0 })
        .toArray()) as Thread[];

    if (!history.length) return res.send([null]);
    res.send(history);
});
export default router;
