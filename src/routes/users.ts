import register from "./users/register";
import login from "./users/login";
import status from "./users/status";
import verify from "./users/verify";
import resend from "./users/resend";
import rename from "./users/rename";
import block from "./users/block";
import unblock from "./users/unblock";
import reset from "./users/reset";
import forgot from "./users/forgot";
import avatar from "./users/avatar";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.register(register);
    fastify.register(login);
    fastify.register(verify);
    fastify.register(resend);
    fastify.register(rename);
    fastify.register(block);
    fastify.register(unblock);
    fastify.register(status);
    fastify.register(reset);
    fastify.register(forgot);
    fastify.register(avatar);
    done();
};
