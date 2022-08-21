import comment from "./comment";
import replies from "./replies";
import create from "./create";
import pin from "./pin";
import unpin from "./unpin";
import vote from "./vote";
import images from "./images";
import emotion from "./emotion";
import emotions from "./emotions";
import votes from "./votes";
import checkRemoved from "../../../plugins/checkComment";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    fastify.addHook("preHandler", checkRemoved);
    fastify.register(comment);
    fastify.register(replies);
    fastify.register(create);
    fastify.register(pin);
    fastify.register(unpin);
    fastify.register(vote);
    fastify.register(images);
    fastify.register(emotions);
    fastify.register(votes);
    fastify.register(emotion, { prefix: "/:cid/emotion" });
    done();
}
