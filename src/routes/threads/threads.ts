import Thread from "../../models/thread";
import { threadCl } from "../../lib/common";
import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { hiddencats } from "../../lib/hiddencats";
import verifyUser from "../../lib/auth/verify";
import regex from "../../lib/regex";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const querySchema = Type.Object(
        {
            id: Type.Optional(
                Type.Union([
                    Type.Array(Type.RegEx(regex.integer), { maxItems: 50 }),
                    Type.RegEx(regex.integer),
                ])
            ),
        },
        { additionalProperties: false }
    );

    fastify.get(
        "/",
        { schema: { querystring: querySchema } },
        async (req: FastifyRequest<{ Querystring: Static<typeof querySchema> }>, res) => {
            if (!req.query.id) return res.send([]);

            const threads = [req.query.id].flat(Infinity).map((id) => Number(id));
            const user = await verifyUser(req.headers.authorization, req.ip);

            const result = (await threadCl
                .find({
                    id: { $in: threads },
                    ...(!user && { category: { $nin: await hiddencats() } }),
                    removed: { $ne: true },
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
