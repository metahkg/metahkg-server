import { FastifyInstance, FastifyPluginOptions } from "fastify";
import checkExist from "./checkExist";
import images from "./images";
import thread from "./thread";
import create from "./create";
import comment from "./comment";
import category from "./category";
import deleteThread from "./actions/delete";
import star from "./actions/star";
import unstar from "./actions/unstar";
import checkHidden from "../../plugins/checkHidden";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.addHook("preHandler", checkHidden);
    fastify.register(thread);
    fastify.register(checkExist);
    fastify.register(images);
    fastify.register(create);
    fastify.register(category);
    fastify.register(star);
    fastify.register(unstar);
    fastify.register(deleteThread);
    fastify.register(comment, { prefix: "/:id/comment" });
    done();
};
