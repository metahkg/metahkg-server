import { FastifyInstance, FastifyPluginOptions } from "fastify";
import publickey from "./publickey";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.register(publickey);
    done();
}
