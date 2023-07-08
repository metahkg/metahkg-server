import { FastifyReply, FastifyRequest } from "fastify";
import { gamesCl } from "../lib/common";
import { Game } from "../models/games";

export async function checkGame(
    req: FastifyRequest<{
        Params: { id: string };
        Body: { option?: number; answer: number | number[] };
    }>,
    res: FastifyReply
) {
    const { id } = req.params;

    const game = (await gamesCl.findOne({
        id,
        type: "guess",
    })) as Game;

    if (!game) {
        return res.code(404).send({ statusCode: 404, error: "Game not found" });
    }

    const { option, answer } = req.body || {};

    if (option && !game.options?.[option]) {
        return res.code(404).send({ statusCode: 404, error: "Option not found" });
    }

    if (answer) {
        const answer = [req.body.answer].flat();
        if (!answer.every((a) => game.options[a])) {
            return res.code(404).send({ statusCode: 404, error: "Option not found" });
        }
    }
}
