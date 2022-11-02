import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { threadCl } from "../../../../../lib/common";
import verifyUser from "../../../../../lib/auth/verify";
import regex from "../../../../../lib/regex";
import Thread from "../../../../../models/thread";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
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
            const user = await verifyUser(req.headers.authorization, req.ip);

            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

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
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Comment not found." });

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
                return res
                    .code(409)
                    .send({ statusCode: 409, error: "Emotion doesn't exist." });

            return res.send({ success: true });
        }
    );
    done();
}
