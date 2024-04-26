import { FastifyInstance, FastifyPluginOptions } from "fastify";
import guess from "./guess";
import info from "./info";
import games from "./games";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    fastify.register(guess, { prefix: "/guess" });
    fastify.register(info);
    fastify.register(games);
    done();
}
