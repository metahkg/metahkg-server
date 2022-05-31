import users from "./router/users";
import category from "./router/category";
import menu from "./router/menu";
import thread from "./router/thread";
import profile from "./router/profile";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.register(users, { prefix: "/users" });
    fastify.register(category, { prefix: "/category" });
    fastify.register(menu, { prefix: "/menu" });
    fastify.register(thread, { prefix: "/thread" });
    fastify.register(profile, { prefix: "/profile" });
    done();
};
