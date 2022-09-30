import isInteger from "is-sn-integer";
import { threadCl } from "../../../../common";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import regex from "../../../../lib/regex";
import Thread from "../../../../models/thread";

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
        "/:cid/images",
        { schema: { params: paramsSchema } },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
            }>,
            res
        ) => {
            if (!isInteger(req.params.id))
                return res.code(400).send({ error: "Bad request." });

            const threadId = Number(req.params.id);
            const commentId = Number(req.params.cid);

            const result = (await threadCl.findOne(
                { id: threadId, conversation: { $elemMatch: { id: commentId } } },
                {
                    projection: {
                        _id: 0,
                        conversation: { $elemMatch: { id: commentId } },
                    },
                }
            )) as Thread;

            if (!result)
                return res.code(404).send({ error: "Thread or comment not found." });

            if (!("removed" in result) && !("removed" in result?.conversation?.[0]))
                res.send(result?.conversation?.[0]?.images);
        }
    );
    done();
};
