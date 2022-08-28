import { FastifyReply, FastifyRequest } from "fastify";
import { threadCl } from "../common";
import Thread from "../models/thread";

export default async function (
    req: FastifyRequest<{ Params: { id: string; cid: string } }>,
    res: FastifyReply
) {
    const id = Number(req.params.id);
    const cid = Number(req.params.cid);

    if (!id || !cid) return;

    const thread = (await threadCl.findOne(
        {
            id,
            conversation: { $elemMatch: { id: cid } },
        },
        { projection: { _id: 0, conversation: { $elemMatch: { id: cid } } } }
    )) as Thread | null;

    if (!thread) return res.code(404).send({ error: "Thread or comment not found." });

    if ("removed" in thread) return res.code(410).send({ error: "Thread removed." });

    const comment = thread?.conversation?.[0];

    if ("removed" in comment) return res.code(410).send({ error: "Comment removed." });

    return;
}
