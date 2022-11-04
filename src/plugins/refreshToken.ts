import { createToken } from "../lib/auth/createToken";
import { updateSessionByToken } from "../lib/sessions/updateSession";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export default async function (
    this: FastifyInstance,
    req: FastifyRequest,
    res: FastifyReply
) {
    const user = req.user;
    if (user) {
        const { exp } = user;
        if (
            // jwt expiration is in seconds
            new Date(exp * 1000).getTime() - 60 * 60 * 24 * 7 <
            new Date().getTime() - 60 * 60 * 24 * 2
        ) {
            const newToken = createToken(this.jwt, user);

            await updateSessionByToken(
                user.id,
                req.headers.authorization?.slice(7),
                newToken
            );

            res.header("token", newToken);
        }
    }
}
