import { FastifyInstance, FastifyPluginOptions } from "fastify";
import checkExist from "./thread/checkExist";
import getComment from "./thread/comment/comment";
import images from "./thread/images";
import replies from "./thread/comment/replies";
import thread from "./thread/thread";
import userVotes from "./thread/userVotes";
import addComment from "./thread/comment/create";
import create from "./thread/create";
import pin from "./thread/pin";
import unpin from "./thread/unpin";
import vote from "./thread/comment/vote";

export default (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    // get
    fastify.register(checkExist);
    fastify.register(getComment);
    fastify.register(images);
    fastify.register(replies);
    fastify.register(thread);
    fastify.register(userVotes);
    // actions
    fastify.register(addComment);
    fastify.register(create);
    fastify.register(pin);
    fastify.register(unpin);
    fastify.register(vote);
    done();
};
