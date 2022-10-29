import { FastifyInstance, FastifyPluginOptions } from "fastify";
import revoke from "./revoke";
import session from "./session";
import sessions from "./sessions";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.register(sessions);
    fastify.register(session);
    fastify.register(revoke);
    done();
}
