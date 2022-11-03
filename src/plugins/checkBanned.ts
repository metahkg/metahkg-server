import { FastifyReply, FastifyRequest } from "fastify";
import { usersCl } from "../lib/common";
import verifyUser from "../lib/auth/verify";
import User from "../models/user";

export default async function checkBanned(req: FastifyRequest, res: FastifyReply) {
    const user = await verifyUser(req.headers.authorization, req.ip);
    if (!user) return;

    const ban = (
        (await usersCl.findOne(
            { id: user.id, ban: { $exists: true } },
            { projection: { _id: 0, ban: 1 } }
        )) as User
    )?.ban;

    if (ban)
        return res.code(403).send({
            statusCode: 403,
            error: "Forbidden. You are banned by an admin.",
            ...(ban.exp && { exp: ban.exp }),
        });

    return;
}
