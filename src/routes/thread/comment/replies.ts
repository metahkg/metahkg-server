import { Type } from "@sinclair/typebox";
import { threadCl } from "../../../common";
import { ajv } from "../../../lib/ajv";
import Thread from "../../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.get(
        "/:id/comment/:cid/replies",
        async (req: FastifyRequest<{ Params: { id: string; cid: string } }>, res) => {
            const id = Number(req.params.id);
            const cid = Number(req.params.cid);

            const schema = Type.Object({
                id: Type.Integer({ minimum: 1 }),
                cid: Type.Integer({ minimum: 1 }),
            });

            if (!ajv.validate(schema, { id, cid }))
                return res.code(400).send({ error: "Bad request." });

            const thread = (await threadCl.findOne(
                {
                    id,
                    conversation: { $elemMatch: { id: cid } },
                },
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
            )) as Thread;

            const targetComment = thread?.conversation?.[0];

            if (!targetComment)
                return res.code(404).send({ error: "Thread or comment not found." });

            console.log(targetComment.replies);

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
                                        $in: ["$$this.id", targetComment.replies],
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
