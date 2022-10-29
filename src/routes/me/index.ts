import session from "./session";
import blocked from "./blocked";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import votes from "./votes";
import starred from "./starred";
import sessions from "./sessions";
import logout from "./logout";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    fastify.register(logout);
    fastify.register(session);
    fastify.register(sessions, { prefix: "/sessions" });
    fastify.register(votes, { prefix: "/votes" });
    fastify.register(blocked);
    fastify.register(starred);
    done();
}
