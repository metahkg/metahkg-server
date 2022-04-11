import express from "express";
import { db } from "../../common";
import isInteger from "is-sn-integer";

const router = express.Router();
router.get("/api/getvotes", async (req, res) => {
    if (!req.query.id || !isInteger(String(req.query.id))) {
        res.status(400);
        res.send({ error: "Bad request." });
        return;
    }
    const id = Number(req.query.id);

    const votes = db.collection("votes");
    const users = db.collection("users");
    const user = await users.findOne({ key: req.cookies.key });
    if (!user) {
        res.status(400);
        res.send({ error: "User not found" });
        return;
    }
    const uservotes = await votes.findOne({ id: user.id }, { projection: { [id]: 1, _id: 0 } });
    res.send(uservotes?.[id] || [null]);
});
export default router;
