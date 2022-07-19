import status from "./status";
import rename from "./rename";
import block from "./block";
import unblock from "./unblock";
import blocklist from "./blocklist";
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
    fastify.register(block);
    fastify.register(unblock);
    fastify.register(blocklist);
    fastify.register(avatar);
    fastify.register(votes);
    done();
}
