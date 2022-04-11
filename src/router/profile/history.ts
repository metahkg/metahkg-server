import express from "express";
import isInteger from "is-sn-integer";
import { db } from "../../common";
const router = express.Router();
/**
 * get summary of threads created by a user
 * syntax: GET /api/history/<user-id | "self">
 * returns an array of objects
 * sort:
 * 0: by creation time //default
 * 1: by last modification time
 */
router.get("/api/history/:id", async (req, res) => {
    if ((!isInteger(req.params.id) && req.params.id !== "self") || (req.query.sort && ![0, 1].includes(Number(req.query.sort))) || (req.query.page && (!isInteger(Number(req.query.page)) || Number(req.query.page) < 1))) {
        res.status(400);
        res.send({ error: "Bad request." });
        return;
    }
    const page = Number(req.query.page) || 1;
    const users = db.collection("users");
    const summary = db.collection("summary");
    const key = req.cookies.key;
    const user = await users.findOne(req.params.id === "self" ? { key: key } : { id: Number(req.params.id) });
    if (!user) {
        res.status(400);
        res.send({ error: "User not found." });
        return;
    }
    const sort: any = {
        0: { createdAt: -1 },
        1: { lastModified: -1 },
    }[Number(req.query.sort ?? 0)];
    const history = await summary
        .find({ op: user.user })
        .sort(sort)
        .skip(25 * (page - 1))
        .limit(25)
        .project({ _id: 0 })
        .toArray();
    if (!history.length) {
        res.send([null]);
        return;
    }
    res.send(history);
});
export default router;
