import Thread from "../../../../models/thread";
import { threadCl } from "../../../../common";
import { Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../../lib/regex";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
        cid: Type.RegEx(regex.integer),
    });

    fastify.get(
        "/:cid",
        { schema: paramsSchema },
        async (req: FastifyRequest<{ Params: { id: string; cid: string } }>, res) => {
            const id = Number(req.params.id);
            const cid = Number(req.params.cid);

            const thread = (await threadCl.findOne(
                { id, conversation: { $elemMatch: { id: cid } } },
                {
                    projection: {
                        _id: 0,
                        conversation: {
                            $elemMatch: {
                                id: cid,
                            },
                        },
                    },
                }
            )) as Thread | null;

            if (!thread)
                return res.code(404).send({ error: "Thread or comment not found." });

            if ("removed" in thread) return;

            const comment = thread?.conversation?.[0];

            res.send(comment);
        }
    );
    done();
};
