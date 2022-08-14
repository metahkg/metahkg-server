import { FastifyInstance, FastifyPluginOptions } from "fastify";
import thread from "./thread";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    fastify.register(thread);
    done();
}
