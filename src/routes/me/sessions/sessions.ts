import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { usersCl } from "../../../lib/common";

import User from "../../../models/user";

export default function sessions(
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.get("/", async (req: FastifyRequest, res) => {
        const user = req.user;
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
