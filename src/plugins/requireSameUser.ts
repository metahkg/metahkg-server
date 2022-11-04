import { FastifyReply, FastifyRequest } from "fastify";

export default async function RequireSameUser(
    req: FastifyRequest<{ Params: { id: string } }>,
    res: FastifyReply
) {
    const userId = Number(req.params.id);
    const user = req.user;

    if (!user) return res.code(401).send({ statusCode: 401, error: "Unauthorized." });
    if (user.id !== userId)
        return res.code(403).send({ statusCode: 403, error: "Forbidden." });

    return;
}
