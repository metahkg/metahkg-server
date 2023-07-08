import { FastifyInstance, FastifyPluginOptions } from "fastify";
import guess from "./guess";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.register(guess, { prefix: "/guess" });
    done();
}
