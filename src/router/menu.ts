import { FastifyInstance, FastifyPluginOptions } from "fastify";
import history from "./menu/history";
import menu from "./menu/menu";
import search from "./menu/search";
import threads from "./menu/threads";

export default function (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    fastify.register(history);
    fastify.register(menu);
    fastify.register(search);
    fastify.register(threads);
    done();
}
