//check whether a thread exist
//syntax: POST /api/check {id : number}
import { threadCl } from "../../common";
import { Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import Thread from "../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.get(
        "/check",
        async (req: FastifyRequest<{ Querystring: { id?: string } }>, res) => {
            const id = Number(req.query.id);

            if (!ajv.validate(Type.Integer(), id))
                return res.code(400).send({ error: "Bad request." });

            if (!((await threadCl.findOne({ id })) as Thread))
                return res.code(404).send({ error: "Thread not found." });

            res.send({ response: "ok" });
        }
    );
    done();
};
