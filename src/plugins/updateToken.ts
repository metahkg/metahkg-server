import { usersCl } from "../lib/common";
import User from "../models/user";
import { createToken } from "../lib/auth/createToken";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { updateSessionByToken } from "../lib/sessions/updateSession";

export default async function (
    this: FastifyInstance,
    req: FastifyRequest,
    res: FastifyReply
) {
    const user = req.user;

    if (user) {
        const userData = (await usersCl.findOne(
            { id: user.id },
            { projection: { _id: 0, id: 1, name: 1, sex: 1 } }
        )) as User;
        if (userData.name !== user.name || userData.sex !== user.sex) {
            const newToken = createToken(this.jwt, user);

            await updateSessionByToken(
                user.id,
                req.headers.authorization?.slice(7),
                newToken
            );

            req.headers.authorization = `Bearer ${newToken}`;
            res.header("token", newToken);
        }
    }
}
