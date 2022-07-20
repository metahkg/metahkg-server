import { FastifyReply, FastifyRequest } from "fastify";
import verifyUser from "../lib/auth/verify";

export default async function RequireAuth(req: FastifyRequest, res: FastifyReply) {
    const user = verifyUser(req.headers.authorization);
    if (!user) return res.code(401).send({ error: "Unauthorized" });
    return;
}
