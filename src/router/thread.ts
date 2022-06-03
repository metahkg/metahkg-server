import { FastifyInstance, FastifyPluginOptions } from "fastify";
import checkExist from "./thread/get/checkExist";
import getComment from "./thread/get/comment/comment";
import images from "./thread/get/images";
import replies from "./thread/get/comment/replies";
import thread from "./thread/get/thread";
import userVotes from "./thread/get/userVotes";
import addComment from "./thread/actions/comment";
import create from "./thread/actions/create";
import pin from "./thread/actions/pin";
import unpin from "./thread/actions/unpin";
import vote from "./thread/actions/vote";

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
