import users from "./routes/users";
import category from "./routes/category";
import menu from "./routes/menu";
import thread from "./routes/thread";
import profile from "./routes/profile";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.register(users, { prefix: "/users" });
    fastify.register(category, { prefix: "/category" });
    fastify.register(menu, { prefix: "/menu" });
    fastify.register(thread, { prefix: "/thread" });
    fastify.register(profile, { prefix: "/profile" });
    done();
};
