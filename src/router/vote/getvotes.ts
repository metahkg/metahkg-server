import express from "express";
import { votesCl } from "../../common";
import isInteger from "is-sn-integer";
import verifyUser from "../auth/verify";

const router = express.Router();
router.get("/api/getvotes", async (req, res) => {
    if (!req.query.id || !isInteger(String(req.query.id))) {
        res.status(400);
        res.send({ error: "Bad request." });
        return;
    }
    const id = Number(req.query.id);

    const user = verifyUser(req.headers.authorization);

    if (!user) return res.status(400).send({ error: "User not found" });

    const uservotes = await votesCl.findOne(
        { id: user.id },
        { projection: { [id]: 1, _id: 0 } }
    );
    res.send(uservotes?.[id] || [null]);
});
export default router;
