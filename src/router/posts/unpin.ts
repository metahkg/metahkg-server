import { Static, Type } from "@sinclair/typebox";
import bodyParser from "body-parser";
import { Router } from "express";
import { threadCl } from "../../common";
import Thread from "../../models/thread";
import verifyUser from "../../lib/auth/verify";
import { ajv } from "../../lib/ajv";

const router = Router();

const schema = Type.Object(
    { id: Type.Integer({ minimum: 1 }) },
    { additionalProperties: false },
);

router.post(
    "/api/posts/unpin",
    bodyParser.json(),
    async (
        req: { body: Static<typeof schema>; headers: { authorization?: string } },
        res,
    ) => {
        const { id: threadId } = req.body;

        if (!ajv.validate(schema, req.body))
            return res.status(400).json({ error: "Bad request." });

        const user = verifyUser(req.headers.authorization);

        const thread = (await threadCl.findOne(
            { id: threadId },
            { projection: { _id: 0, op: 1 } },
        )) as Thread;

        if (!thread) return res.status(404).json({ error: "Thread not found." });

        const authorized = user && (thread?.op?.id === user.id || user.role === "admin");

        if (!authorized)
            return res.status(401).json({
                error: "Unauthorized.",
            });

        await threadCl.updateOne({ id: threadId }, { $unset: { pin: 1 } });

        return res.json({
            response: "Comment unpinned.",
        });
    },
);

export default router;
