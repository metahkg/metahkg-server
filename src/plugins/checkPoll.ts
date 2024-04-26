import { FastifyReply, FastifyRequest } from "fastify";
import { pollsCl } from "../lib/common";
import { Poll } from "../models/polls";

export async function checkPoll(
    req: FastifyRequest<{
        Params: { id: string };
        Body: { option?: number; answer: number | number[] };
    }>,
    res: FastifyReply,
) {
    const { id } = req.params;

    const poll = (await pollsCl.findOne({
        id,
    })) as Poll;

    if (!poll) {
        return res.code(404).send({ statusCode: 404, error: "Poll not found" });
    }

    const { option, answer } = req.body || {};

    if (option && !poll.options?.[option]) {
        return res.code(404).send({ statusCode: 404, error: "Option not found" });
    }

    if (answer) {
        const answer = [req.body.answer].flat();
        if (!answer.every((a) => poll.options[a])) {
            return res.code(404).send({ statusCode: 404, error: "Option not found" });
        }
    }
}
