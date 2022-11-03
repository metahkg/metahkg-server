import users from "./users";
import thread from "./threads";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import me from "./me";
import categories from "./categories";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.register(users, { prefix: "/users" });
    fastify.register(me, { prefix: "/me" });
    fastify.register(categories, { prefix: "/categories" });
    fastify.register(thread, { prefix: "/threads" });
    done();
};
