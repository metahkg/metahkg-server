import { FastifyInstance, FastifyPluginOptions } from "fastify";
import create from "./create";
import guess from "./guess";
import answer from "./answer";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    fastify.register(create);
    fastify.register(guess);
    fastify.register(answer);
    done();
}
