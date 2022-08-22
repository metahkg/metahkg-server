import { FastifyInstance, FastifyPluginOptions } from "fastify";
import category from "./category";
import threads from "./threads";
import create from "./create";
import modify from "./actions/modify";
import deleteCategory from "./actions/delete";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.register(category);
    fastify.register(threads);
    fastify.register(create);
    fastify.register(modify);
    fastify.register(deleteCategory);
    done();
}
