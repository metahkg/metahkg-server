import { FastifyInstance, FastifyPluginOptions } from "fastify";
import deleteEmotion from "./delete";
import set from "./set";
import users from "./users";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.register(deleteEmotion);
    fastify.register(set);
    fastify.register(users);
    done();
}
