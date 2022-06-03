import register from "./users/register";
import login from "./users/login";
import status from "./users/status";
import verify from "./users/verify";
import resend from "./users/resend";
import editProfile from "./users/editprofile";
import block from "./users/block";
import unblock from "./users/unblock";
import reset from "./users/reset";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default (
    router: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    router.register(register);
    router.register(login);
    router.register(verify);
    router.register(resend);
    router.register(editProfile);
    router.register(block);
    router.register(unblock);
    router.register(status);
    router.register(reset);
    done();
};
