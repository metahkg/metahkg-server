import { FastifyInstance, FastifyPluginOptions } from "fastify";
import info from "./category/info";
import categories from "./category/categories";

export default function (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    fastify.register(info);
    fastify.register(categories);
    done();
}
