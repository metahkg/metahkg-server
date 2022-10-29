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
    });

    const schema = Type.Object({
        cid: Type.Integer({ minimum: 1 }),
    });

    fastify.put(
        "/pin",
        {
            schema: {
                params: paramsSchema,
                body: schema,
            },
        },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res
        ) => {
            const threadId = Number(req.params.id);
            const { cid: commentId } = req.body;

            const user = await verifyUser(req.headers.authorization, req.ip);
            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

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
                        op: 1,
                        conversation: {
                            $elemMatch: {
                                id: commentId,
                            },
                        },
                    },
                }
            )) as Thread;

            if (!thread)
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Thread not found." });

            if ("removed" in thread) return;

            if (thread?.op?.id !== user.id)
                return res.code(403).send({ statusCode: 403, error: "Forbidden." });

            const comment = Object.fromEntries(
                Object.entries(thread.conversation?.[0]).filter(
                    (i) => !["replies", "U", "D", "admin"].includes(i[0])
                )
            ) as commentType;

            if (!comment)
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Comment not found." });

            await threadCl.updateOne({ id: threadId }, { $set: { pin: comment } });

            res.send({ success: true });
        }
    );
    done();
}
