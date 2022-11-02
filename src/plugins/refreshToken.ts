import { createToken } from "../lib/auth/createToken";
import verifyUser from "../lib/auth/verify";
import { jwtTokenType } from "../types/jwt/user";
import { updateSessionByToken } from "../lib/sessions/updateSession";
import { FastifyReply, FastifyRequest } from "fastify";

export default async function (req: FastifyRequest, res: FastifyReply) {
    const token = req.headers.authorization;
    const user = (await verifyUser(token, req.ip)) as jwtTokenType & { exp: number };
    if (user) {
        const { exp } = user;
        if (
            // jwt expiration is in seconds
            new Date(exp * 1000).getTime() - 60 * 60 * 24 * 7 <
            new Date().getTime() - 60 * 60 * 24 * 2
        ) {
            const newToken = createToken(user);

            await updateSessionByToken(
                user.id,
                req.headers.authorization?.slice(7),
                newToken
            );

            res.header("token", newToken);
        }
    }
}
