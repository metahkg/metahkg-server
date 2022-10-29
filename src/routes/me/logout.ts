import { FastifyInstance, FastifyPluginOptions } from "fastify";
import verifyUser from "../../lib/auth/verify";
import { revokeSessionByToken } from "../../lib/sessions/revokeSession";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.post("/logout", async (req, res) => {
        const user = await verifyUser(req.headers.authorization, req.ip);
        if (!user) return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

        const token = req.headers.authorization?.slice(7);
        await revokeSessionByToken(user.id, token);

        return res.send({ success: true });
    });
    done();
}
