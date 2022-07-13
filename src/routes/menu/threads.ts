import Thread from "../../models/thread";
import { threadCl } from "../../common";
import { ajv } from "../../lib/ajv";
import { Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.get(
        "/threads",
        async (req: FastifyRequest<{ Querystring: { threads?: string } }>, res) => {
            let requestedThreads = decodeURIComponent(String(req.query.threads));
            try {
                requestedThreads = JSON.parse(requestedThreads);
                if (!Array.isArray(requestedThreads)) throw new Error("Not an array.");
            } catch {
                return res.code(400).send({ error: "Bad request." });
            }

            if (
                !ajv.validate(
                    Type.Array(Type.Integer(), { maxItems: 50 }),
                    requestedThreads
                )
            )
                return res.code(400).send({ error: "Bad request." });

            const threads = (await threadCl
                .find({
                    id: { $in: requestedThreads },
                })
                .project({ _id: 0, conversation: 0 })
                .toArray()) as Thread[];

            const result: Thread[] = [];

            requestedThreads.forEach((tid) => {
                const thread = threads.find((i) => i.id === tid);
                thread && result.push(thread);
            });

            res.send(result);
        }
    );
    done();
};
