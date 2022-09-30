import { FastifyInstance, FastifyPluginOptions } from "fastify";
import create from "./create";
import threads from "./threads";
import search from "./search";
import thread from "./thread";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.register(threads);
    fastify.register(search);
    fastify.register(create);
    fastify.register(thread, { prefix: "/:id" });
    done();
};
