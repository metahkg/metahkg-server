import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { domain, threadCl } from "../../../../../common";
import verifyUser from "../../../../../lib/auth/verify";
import { sendNotification } from "../../../../../lib/notifications/sendNotification";
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
            const user = await verifyUser(req.headers.authorization, req.ip);
            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

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
                        conversation: { $elemMatch: { id: cid } },
                    },
                }
            )) as Thread & { index: number };

            const index = thread?.index;

            // index can be 0
            if (index === undefined || index === -1)
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Comment not found." });

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

            if (
                !("removed" in thread) &&
                !("removed" in thread.conversation?.[0]) &&
                thread.conversation[0]?.user.id !== user.id
            )
                sendNotification(thread?.conversation[0].user.id, {
                    title: "New reaction",
                    createdAt: new Date(),
                    options: {
                        body: `${user.name} reacted to your comment in thread #${thread.id}: ${emotion}`,
                        data: {
                            type: "emotion",
                            url: `https://${domain}/thread/${thread.id}?c=${thread.conversation[0].id}`,
                        },
                    },
                });

            return res.send({ success: true });
        }
    );

    done();
}
