import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { threadCl } from "../../../common";
import { ajv } from "../../../lib/ajv";
import Thread from "../../../models/thread";

const router = Router();

router.get("/api/posts/thread/:id/replies/:cid", async (req, res) => {
    const id = Number(req.params.id);
    const cid = Number(req.params.cid);

    const schema = Type.Object({
        id: Type.Integer({ minimum: 1 }),
        cid: Type.Integer({ minimum: 1 }),
    });

    if (!ajv.validate(schema, { id, cid }))
        return res.status(400).send({ error: "Bad request." });

    const thread = (await threadCl.findOne({ id: id })) as Thread;

    const targetComment = thread.conversation.find((comment) => comment.id === cid);

    if (!targetComment) return res.status(404).send({ error: "Not found." });

    const replies = thread.conversation.filter((comment) =>
        targetComment.replies?.includes(comment.id)
    );

    res.send(replies);
});

export default router;
