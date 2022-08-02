import { threadCl } from "../../common";
import { Type } from "@sinclair/typebox";
import Thread from "../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../lib/regex";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const querySchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    fastify.get(
        "/check",
        {
            schema: {
                querystring: querySchema,
            },
        },
        async (req: FastifyRequest<{ Querystring: { id?: string } }>, res) => {
            const id = Number(req.query.id);

            if (!((await threadCl.findOne({ id })) as Thread))
                return res.code(404).send({ error: "Thread not found." });

            res.send({ success: true });
        }
    );
    done();
};
