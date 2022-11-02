import { domain, threadCl, votesCl } from "../../../../lib/common";
import { Type, Static } from "@sinclair/typebox";
import verifyUser from "../../../../lib/auth/verify";
import Thread from "../../../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../../lib/regex";
import Votes from "../../../../models/votes";
import { sendNotification } from "../../../../lib/notifications/sendNotification";

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

            const user = await verifyUser(req.headers.authorization, req.ip);
            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

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
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Thread or comment not found." });

            const votes = (await votesCl.findOne({ id: user.id })) as Votes;

            if (!votes) {
                await votesCl.insertOne({ id: user.id });
            } else if (votes?.[threadId]?.find((i) => i.cid === commentId)) {
                return res
                    .code(429)
                    .send({ statusCode: 429, error: "You have already voted." });
            }

            await votesCl.updateOne(
                { id: user.id },
                { $push: { [`${threadId}`]: { cid: commentId, vote } } }
            );

            if ("removed" in thread || "removed" in thread.conversation[0]) return;

            if (!thread.conversation[0]?.[vote]) {
                await threadCl.updateOne(
                    { id: threadId, conversation: { $elemMatch: { id: commentId } } },
                    { $set: { [`conversation.$.${req.body.vote}`]: 0 } }
                );
            }

            await threadCl.updateOne(
                { id: threadId, conversation: { $elemMatch: { id: commentId } } },
                { $inc: { [`conversation.$.${req.body.vote}`]: 1 } }
            );

            if (commentId === 1) {
                await threadCl.updateOne(
                    { id: threadId },
                    { $inc: { score: { U: 1, D: -1 }[req.body.vote] } }
                );
            }

            if (
                vote === "U" &&
                [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000].includes(
                    thread.conversation[0]?.[vote] + 1
                )
            ) {
                sendNotification(thread.conversation[0]?.user?.id, {
                    title: `${thread.conversation[0]?.[vote] + 1} upvotes!`,
                    createdAt: new Date(),
                    options: {
                        body: `Your ${
                            commentId === 1 ? "thread" : "comment"
                        } has received ${thread.conversation[0]?.[vote] + 1} upvotes: ${
                            thread.conversation[0]?.text?.length < 200
                                ? thread.conversation[0]?.text
                                : `${thread.conversation[0]?.text?.slice(0, 200)}...`
                        }`,
                        data: {
                            type: "votes",
                            threadId,
                            commentId,
                            url: `https://${domain}/thread/${threadId}?c=${commentId}`,
                        },
                    },
                });
            }

            res.send({ success: true });
        }
    );
    done();
};
