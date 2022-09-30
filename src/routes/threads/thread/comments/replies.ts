import { Static, Type } from "@sinclair/typebox";
import { threadCl } from "../../../../common";
import Thread from "../../../../models/thread";
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
        "/:cid/replies",
        { schema: { params: paramsSchema } },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const id = Number(req.params.id);
            const cid = Number(req.params.cid);

            const thread = (await threadCl.findOne(
                {
                    id,
                    conversation: { $elemMatch: { id: cid } },
                },
                {
                    projection: {
                        _id: 0,
                        conversation: { $elemMatch: { id: cid } },
                    },
                }
            )) as Thread;

            if (!thread)
                return res.code(404).send({ error: "Thread or comment not found." });

            if ("removed" in thread) return;

            const comment = thread?.conversation?.[0];

            if ("removed" in comment) return;

            const replies = (
                await threadCl.findOne(
                    { id },
                    {
                        projection: {
                            _id: 0,
                            conversation: {
                                $filter: {
                                    input: "$conversation",
                                    cond: {
                                        $and: [
                                            {
                                                $in: [
                                                    "$$this.id",
                                                    comment?.replies || [],
                                                ],
                                            },
                                            { $not: { $eq: ["$$this.removed", true] } },
                                        ],
                                    },
                                },
                            },
                        },
                    }
                )
            )?.conversation;

            res.send(replies);
        }
    );
    done();
};
