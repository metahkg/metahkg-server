import verifyUser from "../../lib/auth/verify";

import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.get("/status", async (req, res) => {
        if (!req.headers.authorization) return res.send({ active: false });

        const user = verifyUser(req.headers.authorization);

        res.send({ /** whether the token is valid */ active: Boolean(user) });
    });
    done();
};
