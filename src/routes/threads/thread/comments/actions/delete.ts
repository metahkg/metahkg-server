import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { removedCl, threadCl } from "../../../../../lib/common";
import verifyUser from "../../../../../lib/auth/verify";
import regex from "../../../../../lib/regex";
import Thread from "../../../../../models/thread";
import RequireAdmin from "../../../../../plugins/requireAdmin";
import { ReasonSchemaAdmin } from "../../../../../lib/schemas";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
        cid: Type.RegEx(regex.integer),
    });

    const schema = Type.Object(
        {
            reason: ReasonSchemaAdmin,
        },
        { additionalProperties: false }
    );

    fastify.delete(
        "/:cid",
        { schema: { params: paramsSchema, body: schema }, preHandler: [RequireAdmin] },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id);
            const cid = Number(req.params.cid);
            const { reason } = req.body;
            const admin = await verifyUser(req.headers.authorization, req.ip);

            const thread = (await threadCl.findOne(
                { id, conversation: { $elemMatch: { id: cid } } },
                {
                    projection: {
                        _id: 0,
                        conversation: { $elemMatch: { id: cid } },
                        index: { $indexOfArray: ["$conversation.id", cid] },
                    },
                }
            )) as Thread & { index: number };

            const index = thread?.index;

            // index can be 0
            if (index === undefined || index === -1)
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Thread or comment not found." });

            if ("removed" in thread) return;

            await removedCl.insertOne({
                comment: thread.conversation[0],
                thread_id: id,
                admin,
                reason,
            });

            await threadCl.updateOne(
                { id },
                { $set: { [`conversation.${index}`]: { id: cid, removed: true } } }
            );

            return res.send({ success: true });
        }
    );
    done();
}
