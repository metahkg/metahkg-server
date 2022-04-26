import { Router } from "express";
import Thread from "../../models/thread";
import { threadCl } from "../../common";
import { ajv } from "../../lib/ajv";
import { Type } from "@sinclair/typebox";

const router = Router();
router.get("/api/threads", async (req, res) => {
    let threads = decodeURIComponent(String(req.query.threads));
    try {
        threads = JSON.parse(threads);
        if (!Array.isArray(threads)) throw new Error("Not an array.");
    } catch {
        return res.status(400).send({ error: "Bad request." });
    }

    if (!ajv.validate(Type.Array(Type.Integer(), { maxItems: 25 }), threads))
        return res.status(400).send({ error: "Bad request." });

    const r = (await threadCl
        .find({
            id: { $in: threads },
        })
        .project({ _id: 0, conversation: 0 })
        .toArray()) as Thread[];

    let result: Thread[] = [];

    threads.forEach((tid) => {
        const index = r.findIndex((i) => i.id === tid);
        index !== -1 && result.push(r[index]);
    });
    !result.length && result.push(null);

    res.send(result);
});
export default router;
