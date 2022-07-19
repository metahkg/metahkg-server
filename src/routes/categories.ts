import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { categoryCl } from "../common";

export default function (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    fastify.get("/", async (req, res) => {
        res.send(await categoryCl.find().project({ _id: 0 }).sort({ id: 1 }).toArray());
    });
    done();
}
