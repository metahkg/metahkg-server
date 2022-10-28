import { Static, Type } from "@sinclair/typebox";
import { threadCl } from "../../../common";
import Thread from "../../../models/thread";
import verifyUser from "../../../lib/auth/verify";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../lib/regex";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    fastify.delete(
        "/pin",
        { schema: { params: paramsSchema } },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
            }>,
            res
        ) => {
            const threadId = Number(req.params.id);

            const user = await verifyUser(req.headers.authorization, req.ip);

            const thread = (await threadCl.findOne(
                { id: threadId },
                { projection: { _id: 0, op: 1, pin: 1 } }
            )) as Thread;

            if (!thread) return res.code(404).send({ error: "Thread not found." });
            if ("removed" in thread) return;

            const authorized = user && thread?.op?.id === user.id;
            if (!authorized) return res.code(403).send({ error: "Forbidden." });

            if (!thread.pin)
                return res.code(409).send({ error: "No comment is pinned." });

            await threadCl.updateOne({ id: threadId }, { $unset: { pin: 1 } });

            return res.send({ success: true });
        }
    );
    done();
};
