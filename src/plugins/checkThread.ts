import { FastifyReply, FastifyRequest } from "fastify";
import { threadCl } from "../lib/common";
import Thread from "../models/thread";

export default async function (
    req: FastifyRequest<{ Params: { id: string } }>,
    res: FastifyReply
) {
    const id = Number(req.params.id);

    if (!id) return;

    const thread = (await threadCl.findOne(
        { id },
        { projection: { _id: 0, id: 1, removed: 1 } }
    )) as Thread;

    if (!thread)
        return res.code(404).send({ statusCode: 404, error: "Thread not found." });

    if ("removed" in thread)
        return res.code(410).send({ statusCode: 410, error: "Thread removed." });

    return;
}
