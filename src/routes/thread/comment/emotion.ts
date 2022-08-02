import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { threadCl } from "../../../common";
import verifyUser from "../../../lib/auth/verify";
import regex from "../../../lib/regex";
import Thread, { EmotionSchema } from "../../../models/thread";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
        cid: Type.RegEx(regex.integer),
    });

    const schema = Type.Object({ emotion: EmotionSchema });

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
                                conversation: { $elemMatch: { id: cid } },
                                index: { $indexOfArray: ["$conversation", { id: cid }] },
                            },
                        },
                    ])
                    .toArray()
            )[0] as Thread & { index: number };

            const index = thread?.index;
            const comment = thread?.conversation?.[0];

            if (!comment || !index)
                return res.code(404).send({ error: "Comment not found." });

            await threadCl.updateOne(
                { id },
                {
                    $push: {
                        [`conversation.${index}.emotions`]: { user: user.id, emotion },
                    },
                }
            );

            return res.send({ success: true });
        }
    );
    done();
}
