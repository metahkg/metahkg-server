import { FastifyInstance, FastifyPluginOptions } from "fastify";
import notifications from "./notifications";
import subscribe from "./subscribe";
import unsubscribe from "./unsubscribe";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.register(subscribe);
    fastify.register(unsubscribe);
    fastify.register(notifications);
    done();
}
