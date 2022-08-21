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

    const comment = (
        (await threadCl.findOne(
            {
                id,
                conversation: { $elemMatch: { id: cid } },
            },
            { projection: { _id: 0, conversation: { $elemMatch: { id: cid } } } }
        )) as Thread
    )?.conversation?.[0];

    if (!comment) return res.code(404).send({ error: "Thread or comment not found." });

    if (comment?.removed) return res.code(410).send({ error: "Comment removed." });

    return;
}
