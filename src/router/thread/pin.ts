import { Static, Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import { threadCl } from "../../common";
import verifyUser from "../../lib/auth/verify";
import Thread from "../../models/thread";
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
            const { cid: commentId } = req.body;
            const threadId = Number(req.params.id);

            if (
                !(
                    ajv.validate(schema, req.body) &&
                    ajv.validate(Type.Integer({ minimum: 1 }), threadId)
                )
            )
                return res.status(400).send({ error: "Bad request." });

            const user = verifyUser(req.headers.authorization);
            if (!user) return res.status(401).send({ error: "Unauthorized." });

            const thread = (await threadCl.findOne(
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
            )) as Thread;

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
    done();
}
