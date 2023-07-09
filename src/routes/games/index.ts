import { FastifyInstance, FastifyPluginOptions } from "fastify";
import guess from "./guess";
import info from "./info";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    fastify.register(guess, { prefix: "/guess" });
    fastify.register(info);
    done();
}
