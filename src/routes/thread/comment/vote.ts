import { threadCl, votesCl } from "../../../common";
import { Type, Static } from "@sinclair/typebox";
import verifyUser from "../../../lib/auth/verify";
import Thread from "../../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../lib/regex";
import Votes from "../../../models/votes";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            vote: Type.Union([Type.Literal("U"), Type.Literal("D")]),
        },
        { additionalProperties: false }
    );

    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
        cid: Type.RegEx(regex.integer),
    });

    fastify.post(
        "/:cid/vote",
        { schema: { body: schema, params: paramsSchema } },
        async (
            req: FastifyRequest<{
                Body: Static<typeof schema>;
                Params: Static<typeof paramsSchema>;
            }>,
            res
        ) => {
            const threadId = Number(req.params.id);
            const commentId = Number(req.params.cid);
            const { vote } = req.body;

            const user = verifyUser(req.headers.authorization);
            if (!user) return res.code(401).send({ error: "Unauthorized." });

            const thread = (await threadCl.findOne(
                { id: threadId, conversation: { $elemMatch: { id: commentId } } },
                {
                    projection: {
                        _id: 0,
                        conversation: {
                            $elemMatch: { id: commentId },
                        },
                    },
                }
            )) as Thread;

            if (!thread)
                return res.code(404).send({ error: "Thread or comment not found." });

            const index = commentId - 1;
            const votes = (await votesCl.findOne({ id: user.id })) as Votes;

            if (!votes) {
                await votesCl.insertOne({ id: user.id });
            } else if (votes?.[threadId]?.find((i) => i.cid === commentId)) {
                return res.code(429).send({ error: "You have already voted." });
            }

            await votesCl.updateOne(
                { id: user.id },
                { $push: { [`${threadId}`]: { cid: commentId, vote } } }
            );

            if (!thread.conversation[0]?.[vote]) {
                await threadCl.updateOne(
                    { id: threadId },
                    { $set: { [`conversation.${index}.${req.body.vote}`]: 0 } }
                );
            }

            await threadCl.updateOne(
                { id: threadId },
                { $inc: { [`conversation.${index}.${req.body.vote}`]: 1 } }
            );

            if (commentId === 1) {
                await threadCl.updateOne(
                    { id: threadId },
                    { $inc: { score: { U: 1, D: -1 }[req.body.vote] } }
                );
            }

            res.send({ success: true });
        }
    );
    done();
};
