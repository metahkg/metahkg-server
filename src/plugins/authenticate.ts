import { FastifyRequest } from "fastify";

export default async function (req: FastifyRequest) {
    try {
        await req.jwtVerify();
    } catch {}
}
