import status from "./status";
import rename from "./rename";
import blocked from "./blocked";
import avatar from "./avatar";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import votes from "./votes";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    fastify.register(status);
    fastify.register(rename);
    fastify.register(blocked);
    fastify.register(avatar);
    fastify.register(votes);
    done();
}
