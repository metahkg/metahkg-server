import profile from "./profile/profile";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default function (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    fastify.register(profile);
    done();
}
