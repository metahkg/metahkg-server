import { FastifyInstance, FastifyPluginOptions } from "fastify";
import checkExist from "./checkExist";
import images from "./images";
import thread from "./thread";
import create from "./create";
import comment from ".";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.register(checkExist);
    fastify.register(images);
    fastify.register(thread);
    fastify.register(create);
    fastify.register(comment);
    done();
};
