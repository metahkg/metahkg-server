import { FastifyInstance, FastifyPluginOptions } from "fastify";
import search from "./search";
import threads from "./threads";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.register(threads);
    fastify.register(search);
    done();
}
