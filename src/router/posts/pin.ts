import { Static, Type } from "@sinclair/typebox";
import { Router } from "express";
import { ajv } from "../../lib/ajv";
import { threadCl } from "../../common";
import verifyUser from "../../lib/auth/verify";
import bodyParser from "body-parser";
import Thread from "../../models/thread";

const router = Router();

const schema = Type.Object({
    id: Type.Integer({ minimum: 1 }),
    cid: Type.Integer({ minimum: 1 }),
});

router.post(
    "/api/posts/pin",
    bodyParser.json(),
    async (
        req: { body: Static<typeof schema>; headers: { authorization?: string } },
        res
    ) => {
        const { id: threadId, cid: commentId } = req.body;

        if (!ajv.validate(schema, req.body))
            return res.status(400).send({ error: "Bad request." });

        const user = verifyUser(req.headers.authorization);
        if (!user) return res.status(401).send({ error: "Unauthorized." });

        const thread = await threadCl.findOne(
            {
                "op.id": user.id,
                id: threadId,
            },
            {
                projection: {
                    _id: 0,
                    conversation: {
                        $filter: {
                            input: "$conversation",
                            cond: { $eq: ["$$this.id", commentId] },
                        },
                    },
                },
            }
        ) as Thread;

        if (!thread)
            return res.status(403).send({
                error: "Thread not found, or you are not the op.",
            });

        const comment = thread.conversation?.[0];

        if (!comment) return res.status(404).send({ error: "Comment not found." });
        if (comment.removed)
            return res.status(403).send({ error: "Comment has been removed." });

        await threadCl.updateOne({ id: threadId }, { $set: { pin: comment } });

        res.send({ response: "ok" });
    }
);

export default router;
