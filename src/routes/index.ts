import users from "./users";
import menu from "./";
import thread from "./";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import me from "./me";
import categories from "./categories";
import category from "./category";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.register(users, { prefix: "/users" });
    fastify.register(me, { prefix: "/me" });
    fastify.register(categories, { prefix: "/categories" });
    fastify.register(category, { prefix: "/category" });
    fastify.register(menu, { prefix: "/menu" });
    fastify.register(thread, { prefix: "/thread" });
    done();
};
