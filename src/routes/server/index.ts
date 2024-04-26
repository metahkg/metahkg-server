import { FastifyInstance, FastifyPluginOptions } from "fastify";
import config from "./config";
import invitecodes from "./invitecodes";
import publickey from "./publickey";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    fastify.register(config);
    fastify.register(publickey);
    fastify.register(invitecodes, { prefix: "/invitecodes" });
    done();
}
