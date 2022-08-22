import { FastifyReply, FastifyRequest } from "fastify";
import { usersCl } from "../common";
import verifyUser from "../lib/auth/verify";
import User from "../models/user";

export default async function checkMuted(req: FastifyRequest, res: FastifyReply) {
    const user = verifyUser(req.headers.authorization);
    if (!user) return;

    const muted = (
        (await usersCl.findOne(
            { id: user.id },
            { projection: { _id: 0, muted: 1 } }
        )) as User
    ).muted;

    if (muted) return res.code(403).send({ error: "Forbidden. You are muted by an admin." });

    return;
}
