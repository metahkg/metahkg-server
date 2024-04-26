import { FastifyInstance, FastifyPluginOptions } from "fastify";
import RequireAdmin from "../../../plugins/requireAdmin";
import all from "./all";
import create from "./create";
import _delete from "./delete";
import generate from "./generate";
import info from "./info";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    fastify.addHook("preParsing", RequireAdmin);
    fastify.register(all);
    fastify.register(info);
    fastify.register(generate);
    fastify.register(create);
    fastify.register(_delete);
    done();
}
