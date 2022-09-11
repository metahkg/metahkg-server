import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { threadCl } from "../../../../../common";
import verifyUser from "../../../../../lib/auth/verify";
import regex from "../../../../../lib/regex";
import Thread from "../../../../../models/thread";

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
        emotion: Type.RegEx(regex.emoji),
    });

    fastify.post(
        "/",
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

            const thread = (await threadCl.findOne(
                {
                    id,
                    conversation: { $elemMatch: { id: cid } },
                },
                {
                    projection: {
                        _id: 0,
                        index: {
                            $indexOfArray: ["$conversation.id", cid],
                        },
                    },
                }
            )) as Thread & { index: number };

            const index = thread?.index;

            // index can be 0
            if (index === undefined || index === -1)
                return res.code(404).send({ error: "Comment not found." });

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

    done();
}
