import { Type } from "@sinclair/typebox";
import { threadCl } from "../../common";
import Thread from "../../models/thread";
import verifyUser from "../../lib/auth/verify";
import { ajv } from "../../lib/ajv";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.put(
        "/:id/unpin",
        async (
            req: FastifyRequest<{
                Params: { id: string };
            }>,
            res
        ) => {
            const threadId = Number(req.params.id);

            if (!ajv.validate(Type.Integer({ minimum: 1 }), threadId))
                return res.code(400).send({ error: "Bad request." });

            const user = verifyUser(req.headers.authorization);

            const thread = (await threadCl.findOne(
                { id: threadId },
                { projection: { _id: 0, op: 1 } }
            )) as Thread;

            if (!thread) return res.code(404).send({ error: "Thread not found." });

            const authorized =
                user && (thread?.op?.id === user.id || user.role === "admin");

            if (!authorized)
                return res.code(403).send({
                    error: "Permission denied.",
                });

            await threadCl.updateOne({ id: threadId }, { $unset: { pin: 1 } });

            return res.send({
                response: "Comment unpinned.",
            });
        }
    );
    done();
};
