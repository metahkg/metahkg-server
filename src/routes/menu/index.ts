import { FastifyInstance, FastifyPluginOptions } from "fastify";
import history from "./history";
import menu from "./menu";
import search from "./search";
import threads from "./threads";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    fastify.register(history);
    fastify.register(menu);
    fastify.register(search);
    fastify.register(threads);
    done();
}
