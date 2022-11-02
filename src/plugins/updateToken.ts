import verifyUser from "../lib/auth/verify";
import { usersCl } from "../lib/common";
import User from "../models/user";
import { createToken } from "../lib/auth/createToken";
import { FastifyReply, FastifyRequest } from "fastify";
import { updateSessionByToken } from "../lib/sessions/updateSession";

export default async function (req: FastifyRequest, res: FastifyReply) {
    const user = await verifyUser(req.headers.authorization, req.ip);

    if (user) {
        const userData = (await usersCl.findOne(
            { id: user.id },
            { projection: { _id: 0, id: 1, name: 1, sex: 1 } }
        )) as User;
        if (userData.name !== user.name || userData.sex !== user.sex) {
            const newToken = createToken(user);

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
