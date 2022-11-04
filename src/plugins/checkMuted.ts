import { FastifyReply, FastifyRequest } from "fastify";
import { usersCl } from "../lib/common";
import User from "../models/user";

export default async function checkMuted(req: FastifyRequest, res: FastifyReply) {
    const user = req.user;
    if (!user) return;

    const mute = (
        (await usersCl.findOne(
            { id: user.id, mute: { $exists: true } },
            {
                projection: {
                    _id: 0,
                    mute: 1,
                },
            }
        )) as User
    )?.mute;

    if (mute)
        return res.code(403).send({
            statusCode: 403,
            error: "Forbidden. You are muted by an admin.",
            ...(mute.exp && { exp: mute.exp }),
        });

    return;
}
