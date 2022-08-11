import users from "./users";
import thread from "./thread";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import me from "./me";
import categories from "./categories";
import category from "./category";
import notifications from "./notifications/notifications";
import threads from "./threads";
import user from "./user";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.register(users, { prefix: "/users" });
    fastify.register(user, { prefix: "/user" });
    fastify.register(me, { prefix: "/me" });
    fastify.register(categories, { prefix: "/categories" });
    fastify.register(category, { prefix: "/category" });
    fastify.register(thread, { prefix: "/thread" });
    fastify.register(threads, { prefix: "/threads" });
    fastify.register(notifications, { prefix: "/notifications" });
    done();
};
