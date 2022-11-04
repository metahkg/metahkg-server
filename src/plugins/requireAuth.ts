import { FastifyReply, FastifyRequest } from "fastify";

export default async function RequireAuth(req: FastifyRequest, res: FastifyReply) {
    const user = req.user;
    if (!user) return res.code(401).send({ statusCode: 401, error: "Unauthorized." });
    return;
}
