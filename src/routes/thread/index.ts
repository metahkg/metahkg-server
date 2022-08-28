import { FastifyInstance, FastifyPluginOptions } from "fastify";
import images from "./images";
import thread from "./thread";
import create from "./create";
import comment from "./comment";
import category from "./category";
import deleteThread from "./actions/delete";
import star from "./actions/star";
import unstar from "./actions/unstar";
import checkHidden from "../../plugins/checkHidden";
import edit from "./actions/edit";
import checkThread from "../../plugins/checkThread";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.register(comment, { prefix: "/:id/comment" });
    fastify.addHook("preHandler", checkHidden);
    fastify.addHook("preHandler", checkThread);
    fastify.register(thread);
    fastify.register(images);
    fastify.register(create);
    fastify.register(category);
    fastify.register(star);
    fastify.register(unstar);
    fastify.register(deleteThread);
    fastify.register(edit);
    done();
};
