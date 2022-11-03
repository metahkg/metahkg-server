import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import verifyUser from "../../../lib/auth/verify";
import { SessionIdSchema } from "../../../lib/schemas";
import { getSessionById, getSessionByToken } from "../../../lib/sessions/getSession";
import { revokeSessionById } from "../../../lib/sessions/revokeSession";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: SessionIdSchema,
    });

    fastify.delete(
        "/:id",
        { schema: { params: paramsSchema } },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const user = await verifyUser(req.headers.authorization, req.ip);
            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

            const { id: sessionId } = req.params;

            const currentSession = await getSessionByToken(
                user.id,
                req.headers.authorization?.slice(7)
            );
            const sessionToRevoke = await getSessionById(user.id, sessionId);

            if (!currentSession || !sessionToRevoke) {
                return res.code(404).send({
                    statusCode: 404,
                    error: "Session not found.",
                });
            }

            if (sessionToRevoke.createdAt < currentSession.createdAt) {
                return res.code(409).send({
                    statusCode: 409,
                    error: "Failed to revoke an older session.",
                });
            }

            await revokeSessionById(user.id, sessionId);
            return res.send({ success: true });
        }
    );
    done();
}
