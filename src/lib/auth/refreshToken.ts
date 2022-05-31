import { createToken } from "./createtoken";
import verifyUser from "./verify";
import { decode } from "jsonwebtoken";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default function (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.use((req, res, next) => {
        const token = req.headers.authorization;
        const user = verifyUser(token);
        if (user) {
            const { exp } = decode(token) as {
                exp: number;
            };
            if (
                new Date(exp).getTime() - 60 * 60 * 24 * 7 <
                new Date().getTime() - 60 * 60
            )
                res.setHeader(
                    "token",
                    createToken(user.id, user.name, user.sex, user.role)
                );
        }
        next();
    });
    done();
}
