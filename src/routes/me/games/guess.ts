import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { GameIdSchema } from "../../../lib/schemas";
import { checkGame } from "../../../plugins/checkGame";
import { gamesCl } from "../../../lib/common";
import { Game } from "../../../models/games";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: GameIdSchema,
    });
    fastify.get(
        "/guess/:id",
        { schema: { params: paramsSchema }, preParsing: [checkGame] },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const { id } = req.params;
            const game = (await gamesCl.findOne(
                {
                    id,
                    guesses: {
                        $elemMatch: {
                            "user.id": req.user.id,
                        },
                    },
                },
                {
                    projection: {
                        guesses: {
                            $elemMatch: {
                                "user.id": req.user.id,
                            },
                        },
                    },
                }
            )) as Game | null;

            const guesses = game?.guesses;

            if (!guesses?.length) {
                return res.code(404).send({
                    statusCode: 404,
                    error: "No bets found",
                });
            }

            return res.send(guesses);
        }
    );
    done();
}
