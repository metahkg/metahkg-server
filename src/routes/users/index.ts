import register from "./register";
import login from "./login";
import verify from "./verify";
import resend from "./resend";
import reset from "./reset";
import forgot from "./forgot";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import avatars from "./avatars";
import profile from "./profile";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.register(register);
    fastify.register(login);
    fastify.register(verify);
    fastify.register(resend);
    fastify.register(reset);
    fastify.register(forgot);
    fastify.register(avatars);
    fastify.register(profile);
    done();
};
