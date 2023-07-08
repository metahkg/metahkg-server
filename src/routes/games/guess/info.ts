import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { checkGame } from "../../../plugins/checkGame";
import { Type } from "@sinclair/typebox";
import { GameIdSchema } from "../../../lib/schemas";
import { gamesCl } from "../../../lib/common";
import { Game } from "../../../models/games";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    const paramsSchema = Type.Object({
        id: GameIdSchema,
    });
    fastify.get(
        "/:id",
        { schema: { params: paramsSchema }, preHandler: [checkGame] },
        async (req, res) => {
            const { id } = req.params;
            const game = (await gamesCl.findOne(
                { id, type: "guess" },
                {
                    projection: {
                        _id: 0,
                        id: 1,
                        host: 1,
                        createdAt: 1,
                        endedAt: 1,
                        type: 1,
                        title: 1,
                        options: 1,
                        tokens: 1,
                        answer: 1,
                    },
                },
            )) as Game;

            if (!game) {
                return res.code(404).send({ statusCode: 404, error: "Game not found" });
            }

            return res.send(game);
        },
    );
    done();
}
