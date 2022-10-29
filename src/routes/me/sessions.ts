import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { usersCl } from "../../common";
import verifyUser from "../../lib/auth/verify";
import User from "../../models/user";

export default function sessions(
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.get("/sessions", async (req: FastifyRequest, res) => {
        const user = await verifyUser(req.headers.authorization, req.ip);
        if (!user) return res.code(401).send({ statusCode: 401, error: "Unauthorized" });

        const sessions = (
            (await usersCl.findOne(
                { id: user.id },
                {
                    projection: {
                        _id: 0,
                        sessions: {
                            id: 1,
                            createdAt: 1,
                            exp: 1,
                            sameIp: 1,
                            userAgent: 1,
                        },
                    },
                }
            )) as User
        )?.sessions;

        return res.send(sessions);
    });
    done();
}
