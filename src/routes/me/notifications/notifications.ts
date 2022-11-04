import { usersCl } from "../../../lib/common";

import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import User from "../../../models/user";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.get("/", async (req: FastifyRequest, res) => {
        const user = req.user;
        if (!user) return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

        const notifications = (
            (await usersCl.findOne(
                { id: user.id },
                {
                    projection: {
                        _id: 0,
                        notifications: 1,
                    },
                }
            )) as User
        )?.notifications;

        res.send(notifications || []);
    });
    done();
};
