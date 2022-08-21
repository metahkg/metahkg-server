import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { threadCl } from "../../../../common";
import verifyUser from "../../../../lib/auth/verify";
import regex from "../../../../lib/regex";
import Thread from "../../../../models/thread";

export default function (fastify: FastifyInstance, _opts: FastifyPluginOptions, done: (err?: Error) => void) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
        cid: Type.RegEx(regex.integer),
    });

    fastify.delete(
        "/",
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
