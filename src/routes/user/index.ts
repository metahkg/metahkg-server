import { FastifyInstance, FastifyPluginOptions } from "fastify";
import avatar from "./avatar";
import threads from "./threads";
import name from "./name";
import profile from "./profile";
import block from "./actions/block";
import unblock from "./actions/unblock";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.register(profile);
    fastify.register(name);
    fastify.register(avatar);
    fastify.register(threads);
    fastify.register(block);
    fastify.register(unblock);
    done();
}
