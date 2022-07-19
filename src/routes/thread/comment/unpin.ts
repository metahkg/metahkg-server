import { Static, Type } from "@sinclair/typebox";
import { threadCl } from "../../../common";
import Thread from "../../../models/thread";
import verifyUser from "../../../lib/auth/verify";
import { ajv } from "../../../lib/ajv";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../lib/regex";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
        cid: Type.RegEx(regex.integer),
    });

    fastify.put(
        "/:id/comment/:cid/unpin",
        { schema: { params: paramsSchema } },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
            }>,
            res
        ) => {
            const threadId = Number(req.params.id);
            const commentId = Number(req.params.cid);

            if (!ajv.validate(Type.Integer({ minimum: 1 }), threadId))
                return res.code(400).send({ error: "Bad request." });

            const user = verifyUser(req.headers.authorization);

            const thread = (await threadCl.findOne(
                { id: threadId },
                { projection: { _id: 0, op: 1, pin: 1 } }
            )) as Thread;

            if (!thread) return res.code(404).send({ error: "Thread not found." });

            const authorized = user && thread?.op?.id === user.id;
            if (!authorized) return res.code(403).send({ error: "Permission denied." });

            if (thread?.pin?.id !== commentId)
                return res.code(409).send({ error: "Comment is not pinned." });

            await threadCl.updateOne({ id: threadId }, { $unset: { pin: 1 } });

            return res.send({ response: "ok" });
        }
    );
    done();
};
