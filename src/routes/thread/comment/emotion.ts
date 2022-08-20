import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { threadCl } from "../../../common";
import verifyUser from "../../../lib/auth/verify";
import regex from "../../../lib/regex";
import Thread from "../../../models/thread";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
        cid: Type.RegEx(regex.integer),
    });

    const schema = Type.Object({
        emotion: Type.RegEx(
            /^\p{Emoji}|\p{Emoji_Presentation}|\p{Extended_Pictographic}$/u
        ),
    });

    fastify.post(
        "/:cid/emotion",
        { schema: { params: paramsSchema, body: schema } },
        async function (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res
        ) {
            const user = verifyUser(req.headers.authorization);
            if (!user) return res.code(401).send({ error: "Unauthorized." });

            const id = Number(req.params.id);
            const cid = Number(req.params.cid);

            const { emotion } = req.body;

            const thread = (
                await threadCl
                    .aggregate([
                        {
                            $match: {
                                id,
                                conversation: { $elemMatch: { id: cid } },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                index: {
                                    $indexOfArray: ["$conversation.id", cid],
                                },
                            },
                        },
                    ])
                    .toArray()
            )[0] as Thread & { index: number };

            const index = thread?.index;
            if (index === -1) return res.code(404).send({ error: "Comment not found." });

            // remove previous value first
            await threadCl.updateOne(
                { id },
                {
                    $pull: {
                        [`conversation.${index}.emotions`]: {
                            user: user.id,
                        },
                    },
                }
            );

            await threadCl.updateOne(
                { id },
                {
                    $push: {
                        [`conversation.${index}.emotions`]: {
                            user: user.id,
                            emotion,
                        },
                    },
                }
            );

            return res.send({ success: true });
        }
    );

    fastify.delete(
        "/:cid/emotion",
        {
            schema: {
                params: paramsSchema,
            },
        },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const id = Number(req.params.id);
            const cid = Number(req.params.cid);
            const user = verifyUser(req.headers.authorization);

            if (!user) return res.code(401).send({ error: "Unauthorized." });

            const thread = (
                await threadCl
                    .aggregate([
                        {
                            $match: {
                                id,
                                conversation: { $elemMatch: { id: cid } },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                index: {
                                    $indexOfArray: ["$conversation.id", cid],
                                },
                            },
                        },
                    ])
                    .toArray()
            )?.[0] as Thread & { index: number };

            const index = thread?.index;

            if (index === -1) return res.code(404).send({ error: "Comment not found." });

            if (
                !(
                    await threadCl.updateOne(
                        {
                            id,
                            [`conversation.${index}.emotions`]: {
                                $elemMatch: { user: user.id },
                            },
                        },
                        {
                            $pull: {
                                [`conversation.${index}.emotions`]: { user: user.id },
                            },
                        }
                    )
                ).matchedCount
            )
                return res.code(409).send({ error: "Emotion doesn't exist." });

            return res.send({ success: true });
        }
    );
    done();
}
