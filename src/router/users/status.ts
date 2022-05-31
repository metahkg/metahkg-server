import { createToken } from "../../lib/auth/createtoken";
import verifyUser from "../../lib/auth/verify";

import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.get("/status", async (req, res) => {
        if (!req.headers.authorization) return res.send({ active: false });

        const user = verifyUser(req.headers.authorization);
        if (!user) return res.send({ active: false });

        res.send({
            active: true,
            id: user.id,
            name: user.name,
            token: createToken(user.id, user.name, user.sex, user.role),
        });
    });
    done();
};
