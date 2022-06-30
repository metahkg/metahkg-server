import profile from "./profile/profile";
import avatars from "./profile/avatars";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default function (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    fastify.register(profile);
    fastify.register(avatars);
    done();
}
