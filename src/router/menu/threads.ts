import { Router } from "express";
import isInteger from "is-sn-integer";
import { threadCl } from "../../common";

const router = Router();
router.get("/api/threads", async (req, res) => {
    let threads = decodeURIComponent(String(req.query.threads));
    try {
        threads = JSON.parse(threads);
        if (!Array.isArray(threads)) throw new Error("Not an array.");
    } catch {
        res.status(400);
        res.send({ error: "Bad request." });
        return;
    }
    if (
        !threads.every(function (element) {
            return typeof element === "number" && isInteger(element);
        }) ||
        threads.length > 25
    ) {
        res.status(400);
        res.send({ error: "Bad request." });
        return;
    }

    const r = await threadCl
        .find({
            $where: function () {
                return threads.includes(this.id);
            },
        })
        .project({ _id: 0, conversation: 0 })
        .toArray();
    let result: any[] = [];
    threads.forEach((tid) => {
        const index = r.findIndex((i) => i.id === tid);
        index !== -1 && result.push(r[index]);
    });
    !result.length && result.push(null);
    res.send(result);
});
export default router;
