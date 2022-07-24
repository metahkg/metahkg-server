import isInteger from "is-sn-integer";
import { threadCl } from "../../common";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import regex from "../../lib/regex";
import Thread from "../../models/thread";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    fastify.get(
        "/:id/images",
        { schema: { params: paramsSchema } },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
            }>,
            res
        ) => {
            if (!isInteger(req.params.id))
                return res.code(400).send({ error: "Bad request." });

            const id = Number(req.params.id);

            const result = (await threadCl.findOne(
                { id },
                { projection: { _id: 0, images: 1 } }
            )) as Thread;

            if (!result) return res.code(404).send({ error: "Thread not found." });

            res.send(result.images);
        }
    );
    done();
};
