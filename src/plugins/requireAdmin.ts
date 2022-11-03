import { FastifyReply, FastifyRequest } from "fastify";
import verifyUser from "../lib/auth/verify";

export default async function RequireAdmin(req: FastifyRequest, res: FastifyReply) {
    const user = await verifyUser(req.headers.authorization, req.ip);
    if (!user || user?.role !== "admin")
        return res.code(403).send({ statusCode: 403, error: "Forbidden." });
    return;
}
