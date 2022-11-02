import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { removedCl, threadCl } from "../../../../lib/common";
import verifyUser from "../../../../lib/auth/verify";
import regex from "../../../../lib/regex";
import RequireAdmin from "../../../../plugins/requireAdmin";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    const schema = Type.Object({
        reason: Type.String(),
    });

    fastify.delete(
        "/",
        { schema: { params: paramsSchema, body: schema }, preHandler: [RequireAdmin] },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id);
            const { reason } = req.body;
            const admin = await verifyUser(req.headers.authorization, req.ip);

            const thread = await threadCl.findOne({ id }, { projection: { _id: 0 } });
            if (!thread)
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Thread not found." });

            await removedCl.insertOne({ thread, type: "thread", admin, reason });

            await threadCl.replaceOne({ id }, { id, removed: true });

            return res.send({ success: true });
        }
    );
    done();
}
