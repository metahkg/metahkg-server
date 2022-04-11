import express from "express";
import isInteger from "is-sn-integer";
import { db } from "../../common";
const router = express.Router();
router.get("/api/profile/:id", async (req, res) => {
    if (!isInteger(req.params.id) && req.params.id !== "self") {
        res.status(400);
        res.send({ error: "Bad request." });
        return;
    }
    const users = db.collection("users");
    const summary = db.collection("summary");
    const user = (
        await users
            .find(req.params.id === "self" ? { key: req?.cookies?.key } : { id: Number(req.params.id) })
            .project(
                req.query.nameonly
                    ? { user: 1, _id: 0 }
                    : {
                          id: 1,
                          user: 1,
                          createdAt: 1,
                          sex: 1,
                          admin: 1,
                          _id: 0,
                      }
            )
            .toArray()
    )[0];
    if (!user) {
        res.status(400);
        res.send({ error: "User not found" });
        return;
    }
    !req.query.nameonly && (user.count = await summary.countDocuments({ op: user.user }));
    res.send(user);
});
export default router;
