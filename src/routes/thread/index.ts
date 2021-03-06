import { FastifyInstance, FastifyPluginOptions } from "fastify";
import checkExist from "./checkExist";
import images from "./images";
import thread from "./thread";
import create from "./create";
import comment from "./comment";
import hidden from "../../plugins/hidden";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.addHook("preHandler", hidden);
    fastify.register(thread);
    fastify.register(checkExist);
    fastify.register(images);
    fastify.register(create);
    fastify.register(comment);
    done();
};
