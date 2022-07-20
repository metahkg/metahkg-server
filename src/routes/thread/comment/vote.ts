import { threadCl, votesCl } from "../../../common";
import { Type, Static } from "@sinclair/typebox";
import verifyUser from "../../../lib/auth/verify";
import Thread from "../../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../lib/regex";

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
        "/:id/comment/:cid/vote",
        { schema: { body: schema, params: paramsSchema } },
        async (
            req: FastifyRequest<{
                Body: Static<typeof schema>;
                Params: { id: string; cid: string };
            }>,
            res
        ) => {
            const id = Number(req.params.id);
            const cid = Number(req.params.cid);

            const user = verifyUser(req.headers.authorization);
            if (!user) return res.code(401).send({ error: "Unauthorized." });

            const thread = (await threadCl.findOne(
                { id, conversation: { $elemMatch: { id: cid } } },
                {
                    projection: {
                        _id: 0,
                        conversation: {
                            $elemMatch: { id: cid },
                        },
                    },
                }
            )) as Thread;

            if (!thread)
                return res.code(404).send({ error: "Thread or comment not found." });

            if (thread.conversation[0].removed)
                return res.code(410).send({ error: "Comment removed." });

            const index = cid - 1;
            const userVotes = await votesCl.findOne({ id: user.id });

            if (!userVotes) {
                await votesCl.insertOne({ id: user.id });
            } else if (userVotes?.[id]?.[cid]) {
                return res.code(429).send({ error: "You have already voted." });
            }

            await votesCl.updateOne(
                { id: user.id },
                { $set: { [`${id}.${cid}`]: req.body.vote } }
            );

            if (!thread.conversation[0]?.[req.body.vote]) {
                await threadCl.updateOne(
                    { id },
                    { $set: { [`conversation.${index}.${req.body.vote}`]: 0 } }
                );
            }

            await threadCl.updateOne(
                { id },
                { $inc: { [`conversation.${index}.${req.body.vote}`]: 1 } }
            );

            if (cid === 1) {
                await threadCl.updateOne(
                    { id },
                    { $inc: { score: req.body.vote === "U" ? 1 : -1 } }
                );
            }

            res.send({ response: "ok" });
        }
    );
    done();
};
