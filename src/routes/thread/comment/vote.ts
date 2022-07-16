import { threadCl, votesCl } from "../../../common";
import { Type, Static } from "@sinclair/typebox";
import { ajv } from "../../../lib/ajv";
import verifyUser from "../../../lib/auth/verify";
import Thread from "../../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

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

    fastify.post(
        "/:id/comment/:cid/vote",
        async (
            req: FastifyRequest<{
                Body: Static<typeof schema>;
                Params: { id: string; cid: string };
            }>,
            res
        ) => {
            const id = Number(req.params.id);
            const cid = Number(req.params.cid);

            if (
                !(
                    ajv.validate(schema, req.body) &&
                    ajv.validate(
                        Type.Object({
                            id: Type.Integer({ minimum: 1 }),
                            cid: Type.Integer({ minimum: 1 }),
                        }),
                        {
                            id,
                            cid,
                        }
                    )
                )
            )
                return res.code(400).send({ error: "Bad request." });

            const user = verifyUser(req.headers.authorization);
            if (!user) return res.code(404).send({ error: "Unauthorized." });

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
                return res.code(410).send({ error: "Comment has been removed." });

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
                    { $inc: { vote: req.body.vote === "U" ? 1 : -1 } }
                );
            }

            res.send({ response: "ok" });
        }
    );
    done();
};
