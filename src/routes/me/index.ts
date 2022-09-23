import status from "./status";
import blocked from "./blocked";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import votes from "./votes";
import starred from "./starred";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    fastify.register(status);
    fastify.register(blocked);
    fastify.register(starred);
    fastify.register(votes, { prefix: "/votes" });
    done();
}
