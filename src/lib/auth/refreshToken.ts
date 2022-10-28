import { createToken } from "./createtoken";
import verifyUser from "./verify";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { jwtTokenType } from "../../types/jwt/user";
import { updateSessionByToken } from "../sessions/updateSession";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.addHook("preHandler", async (req, res) => {
        const token = req.headers.authorization;
        const user = (await verifyUser(token, req.ip)) as jwtTokenType & { exp: number };
        if (user) {
            const { exp } = user;
            if (
                new Date(exp).getTime() - 60 * 60 * 24 * 7 <
                new Date().getTime() - 60 * 60 * 24 * 2
            ) {
                const newToken = createToken(user);

                await updateSessionByToken(user.id, req.headers.authorization?.slice(7), newToken);

                res.header("token", newToken);
            }
        }
    });
    done();
}
