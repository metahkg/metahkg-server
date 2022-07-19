import comment from "./comment";
import replies from "./replies";
import create from "./create";
import pin from "./pin";
import unpin from "./unpin";
import vote from "./vote";
import images from "./images";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    fastify.register(comment);
    fastify.register(replies);
    fastify.register(create);
    fastify.register(pin);
    fastify.register(unpin);
    fastify.register(vote);
    fastify.register(images);
    done();
}
