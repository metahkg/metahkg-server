import { Static, Type } from "@sinclair/typebox";
import { threadCl } from "../../../common";
import verifyUser from "../../../lib/auth/verify";
import Thread, { commentType } from "../../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../lib/regex";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
        cid: Type.RegEx(regex.integer),
    });

    fastify.put(
        "/:id/comment/:cid/pin",
        {
            schema: {
                params: paramsSchema,
            },
        },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const threadId = Number(req.params.id);
            const commentId = Number(req.params.cid);

            const user = verifyUser(req.headers.authorization);
            if (!user) return res.code(401).send({ error: "Unauthorized." });

            const thread = (await threadCl.findOne(
                {
                    id: threadId,
                    conversation: {
                        $elemMatch: {
                            id: commentId,
                        },
                    },
                },
                {
                    projection: {
                        _id: 0,
                        conversation: {
                            $elemMatch: {
                                id: commentId,
                            },
                        },
                    },
                }
            )) as Thread;

            if (!thread) return res.code(404).send({ error: "Thread not found." });

            if (thread.op.id !== user.id)
                return res.code(403).send({ error: "Forbidden." });

            const comment = Object.fromEntries(
                Object.entries(thread.conversation?.[0]).filter(
                    (i) => !["replies", "U", "D"].includes(i[0])
                )
            )[0] as commentType;

            if (!comment) return res.code(404).send({ error: "Comment not found." });
            if (comment.removed) return res.code(410).send({ error: "Comment removed." });

            await threadCl.updateOne({ id: threadId }, { $set: { pin: comment } });

            res.send({ response: "ok" });
        }
    );
    done();
}
