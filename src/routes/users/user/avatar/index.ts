import { FastifyInstance, FastifyPluginOptions } from "fastify";
import avatar from "./avatar";
import upload from "./upload";
import deleteAvatar from "./delete";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.register(avatar);
    fastify.register(upload);
    fastify.register(deleteAvatar);
    done();
}
