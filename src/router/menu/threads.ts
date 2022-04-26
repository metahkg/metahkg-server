import { Router } from "express";
import Thread from "../../models/thread";
import { threadCl } from "../../common";
import { ajv } from "../../lib/ajv";
import { Type } from "@sinclair/typebox";

const router = Router();
router.get("/api/threads", async (req, res) => {
    let requestedThreads = decodeURIComponent(String(req.query.threads));
    try {
        requestedThreads = JSON.parse(requestedThreads);
        if (!Array.isArray(requestedThreads)) throw new Error("Not an array.");
    } catch {
        return res.status(400).send({ error: "Bad request." });
    }

    if (!ajv.validate(Type.Array(Type.Integer(), { maxItems: 25 }), requestedThreads))
        return res.status(400).send({ error: "Bad request." });

    const threads = (await threadCl
        .find({
            id: { $in: requestedThreads },
        })
        .project({ _id: 0, conversation: 0 })
        .toArray()) as Thread[];

    let result: Thread[] = [];

    requestedThreads.forEach((tid) => {
        const thread = threads.find((i) => i.id === tid);
        thread && result.push(thread);
    });
    !result.length && result.push(null);

    res.send(result);
});
export default router;
