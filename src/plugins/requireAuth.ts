import { FastifyReply, FastifyRequest } from "fastify";
import verifyUser from "../lib/auth/verify";

export default async function RequireAuth(req: FastifyRequest, res: FastifyReply) {
    const user = await verifyUser(req.headers.authorization, req.ip);
    if (!user) return res.code(401).send({ statusCode: 401, error: "Unauthorized." });
    return;
}
