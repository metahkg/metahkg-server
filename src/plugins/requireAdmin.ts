import { FastifyReply, FastifyRequest } from "fastify";

export default async function RequireAdmin(req: FastifyRequest, res: FastifyReply) {
    const user = req.user;
    if (!user || user?.role !== "admin")
        return res.code(403).send({ statusCode: 403, error: "Forbidden." });
    return;
}
