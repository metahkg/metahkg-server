import { FastifyInstance, FastifyPluginOptions } from "fastify";
import avatar from "./avatar";
import threads from "./threads";
import name from "./name";
import profile from "./profile";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.register(profile);
    fastify.register(name);
    fastify.register(avatar);
    fastify.register(threads);
    done();
}
