import { FastifyInstance, FastifyPluginOptions } from "fastify";
import images from "./images";
import thread from "./thread";
import comments from "./comments";
import category from "./category";
import deleteThread from "./actions/delete";
import star from "./actions/star";
import unstar from "./actions/unstar";
import checkHidden from "../../../plugins/checkHidden";
import edit from "./actions/edit";
import checkThread from "../../../plugins/checkThread";
import pin from "./pin";
import unpin from "./unpin";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.register(comments, { prefix: "/:id/comments" });
    fastify.addHook("preHandler", checkHidden);
    fastify.addHook("preHandler", checkThread);
    fastify.register(thread);
    fastify.register(images);
    fastify.register(category);
    fastify.register(star);
    fastify.register(unstar);
    fastify.register(deleteThread);
    fastify.register(edit);
    fastify.register(pin);
    fastify.register(unpin);
    done();
};
