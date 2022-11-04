import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { getSessionByToken } from "../../lib/sessions/getSession";
import { objectFilter } from "../../lib/objectFilter";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.get("/session", async (req, res) => {
        const user = req.user;
        if (!user) return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

        const session = await getSessionByToken(
            user.id,
            req.headers.authorization?.slice(7)
        );

        res.send(
            objectFilter(session, (key) =>
                ["id", "createdAt", "exp", "sameIp", "userAgent"].includes(key)
            )
        );
    });
    done();
};
