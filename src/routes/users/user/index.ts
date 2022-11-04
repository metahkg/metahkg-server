import { FastifyInstance, FastifyPluginOptions } from "fastify";
import avatar from "./avatar";
import threads from "./threads";
import name from "./name";
import profile from "./profile";
import block from "./actions/block";
import unblock from "./actions/unblock";
import mute from "./actions/mute";
import unmute from "./actions/unmute";
import edit from "./actions/edit";
import ban from "./actions/ban";
import unban from "./actions/unban";
import follow from "./actions/follow";
import unfollow from "./actions/unfollow";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.register(avatar, { prefix: "/avatar" });
    fastify.register(profile);
    fastify.register(name);
    fastify.register(threads);
    fastify.register(block);
    fastify.register(unblock);
    fastify.register(follow);
    fastify.register(unfollow);
    fastify.register(mute);
    fastify.register(unmute);
    fastify.register(ban);
    fastify.register(unban);
    fastify.register(edit);
    done();
}
