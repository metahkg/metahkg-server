import { FastifyPluginOptions, FastifyInstance } from "fastify";
import verifyUser from "../../../lib/auth/verify";
import { unSubscribeByToken } from "../../../lib/notifications/unsubscribe";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.post("/unsubscribe", async (req, res) => {
        const user = await verifyUser(req.headers.authorization, req.ip);
        if (!user) return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

        await unSubscribeByToken(user.id, req.headers.authorization?.slice(7));

        return res.send({ success: true });
    });
    done();
}
