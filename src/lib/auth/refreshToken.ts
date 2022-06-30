import { createToken } from "./createtoken";
import verifyUser from "./verify";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { jwtTokenType } from "../../types/jwt/user";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.addHook("preHandler", (req, res, done) => {
        const token = req.headers.authorization;
        const user = verifyUser(token) as jwtTokenType & { exp: number };
        if (user) {
            const { exp } = user;
            if (
                new Date(exp).getTime() - 60 * 60 * 24 * 7 <
                new Date().getTime() - 60 * 60 * 24 * 2
            )
                res.header("token", createToken(user));
        }
        done();
    });
    done();
}
