import { FastifyInstance, FastifyPluginOptions } from "fastify";
import info from "./info";
import create from "./create";
import vote from "./vote";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    fastify.register(create);
    fastify.register(info);
    fastify.register(vote);
    done();
}
