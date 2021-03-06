import Thread from "../../../models/thread";
import { threadCl } from "../../../common";
import { Type } from "@sinclair/typebox";
import { ajv } from "../../../lib/ajv";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.get(
        "/:id/comment/:cid",
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
            )) as Thread;

            const comment = thread?.conversation?.[0];

            if (!comment)
                return res.code(404).send({ error: "Thread or comment not found." });

            if (comment.removed) return res.code(410).send({ error: "Comment removed." });

            res.send(comment);
        }
    );
    done();
};
