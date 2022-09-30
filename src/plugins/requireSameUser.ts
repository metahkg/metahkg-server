import { FastifyReply, FastifyRequest } from "fastify";
import verifyUser from "../lib/auth/verify";

export default async function RequireSameUser(
    req: FastifyRequest<{ Params: { id: string } }>,
    res: FastifyReply
) {
    const userId = Number(req.params.id);
    const user = verifyUser(req.headers.authorization);

    if (!user) return res.code(401).send({ error: "Unauthorized." });
    if (user.id !== userId) return res.code(403).send({ error: "Forbidden." });

    return;
}
