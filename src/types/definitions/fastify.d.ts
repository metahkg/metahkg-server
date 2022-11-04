import "fastify";
import "@fastify/jwt";
import { jwtTokenType } from "../jwt";

declare module "@fastify/jwt" {
    interface FastifyJWT {
        user: null | jwtTokenType;
    }
}

declare module "fastify" {
    export interface FastifyInstance {
        authenticate: (req: FastifyRequest, res: FastifyReply) => void;
    }
    export interface FastifyRequest {
        user: null | jwtTokenType;
    }
}
