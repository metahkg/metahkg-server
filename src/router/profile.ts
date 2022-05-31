import profile from "./profile/profile";
import getavatars from "./profile/avatars";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default function (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    fastify.register(profile);
    fastify.register(getavatars);
    done();
}
