import { FastifyInstance, FastifyPluginOptions } from "fastify";
import category from "./category";
import threads from "./threads";
import create from "./create";
import edit from "./actions/edit";
import deleteCategory from "./actions/delete";
import categories from "./categories";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.register(categories);
    fastify.register(category);
    fastify.register(threads);
    fastify.register(create);
    fastify.register(edit);
    fastify.register(deleteCategory);
    done();
}
