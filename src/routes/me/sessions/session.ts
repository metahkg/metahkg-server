import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import verifyUser from "../../../lib/auth/verify";
import { objectFilter } from "../../../lib/objectFilter";
import { getSessionById } from "../../../lib/sessions/getSession";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.String({ minLength: 30, maxLength: 30 }),
    });

    fastify.get(
        "/:id",
        { schema: { params: paramsSchema } },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const user = await verifyUser(req.headers.authorization, req.ip);
            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

            const { id: sessionId } = req.params;

            const session = await getSessionById(user.id, sessionId);
            if (!session)
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Session not found." });

            return res.send(
                objectFilter(session, (key) =>
                    ["id", "createdAt", "exp", "sameIp", "userAgent"].includes(key)
                )
            );
        }
    );
    done();
}
