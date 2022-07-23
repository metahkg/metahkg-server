import Thread from "../../models/thread";
import { threadCl } from "../../common";
import { ajv } from "../../lib/ajv";
import { Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { hiddencats } from "../../lib/hiddencats";
import verifyUser from "../../lib/auth/verify";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.get(
        "/threads",
        async (req: FastifyRequest<{ Querystring: { threads?: string } }>, res) => {
            let threads = decodeURIComponent(String(req.query.threads));
            const user = verifyUser(req.headers.authorization);

            try {
                threads = JSON.parse(threads);
                if (!Array.isArray(threads)) throw new Error("Not an array.");
            } catch {
                return res.code(400).send({ error: "Bad request." });
            }

            if (!ajv.validate(Type.Array(Type.Integer(), { maxItems: 50 }), threads))
                return res.code(400).send({ error: "Bad request." });

            const result = (await threadCl
                .find({
                    id: { $in: threads },
                    ...(!user && { category: { $nin: await hiddencats() } }),
                })
                .project({ _id: 0, conversation: 0, images: 0, pin: 0 })
                .toArray()) as Thread[];

            res.send(
                threads.map((tid) => result.find((i) => i.id === tid)).filter((i) => i)
            );
        }
    );
    done();
};
