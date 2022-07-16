import { Static, Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import { threadCl } from "../../common";
import verifyUser from "../../lib/auth/verify";
import Thread, { commentType } from "../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default function (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    const schema = Type.Object(
        {
            cid: Type.Integer({ minimum: 1 }),
        },
        { additionalProperties: false }
    );

    fastify.put(
        "/:id/pin",
        async (
            req: FastifyRequest<{ Body: Static<typeof schema>; Params: { id: string } }>,
            res
        ) => {
            const threadId = Number(req.params.id);
            if (
                !(
                    ajv.validate(schema, req.body) &&
                    ajv.validate(Type.Integer({ minimum: 1 }), threadId)
                )
            )
                return res.code(400).send({ error: "Bad request." });

            const { cid: commentId } = req.body;

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

            if (!thread)
                return res.code(404).send({
                    error: "Thread not found.",
                });

            if (thread.op.id !== user.id)
                return res.code(403).send({
                    error: "Permission denied.",
                });

            const comment = Object.fromEntries(
                Object.entries(thread.conversation?.[0]).filter(
                    (i) => !["replies", "U", "D"].includes(i[0])
                )
            )[0] as commentType;

            if (!comment) return res.code(404).send({ error: "Comment not found." });
            if (comment.removed)
                return res.code(410).send({ error: "Comment has been removed." });

            await threadCl.updateOne({ id: threadId }, { $set: { pin: comment } });

            res.send({ response: "ok" });
        }
    );
    done();
}
