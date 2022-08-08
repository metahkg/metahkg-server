import { FastifyInstance, FastifyPluginOptions } from "fastify";
import category from "./category";
import threads from "./threads";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.register(category);
    fastify.register(threads);
    done();
}
