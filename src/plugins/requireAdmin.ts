import { FastifyReply, FastifyRequest } from "fastify";
import verifyUser from "../lib/auth/verify";

export default async function requireAdmin(req: FastifyRequest, res: FastifyReply) {
    const user = verifyUser(req.headers.authorization);
    if (!user || user?.role !== "admin") return res.code(403).send({ error: "Forbidden." });
    return;
}
