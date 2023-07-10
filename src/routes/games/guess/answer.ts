import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { gamesCl, usersCl } from "../../../lib/common";
import { Game } from "../../../models/games";
import RequireAuth from "../../../plugins/requireAuth";
import { checkGame } from "../../../plugins/checkGame";
import { GameIdSchema } from "../../../lib/schemas";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    const schema = Type.Object(
        {
            answer: Type.Union([
                Type.Integer({ minimum: 0, maximum: 5 }),
                Type.Array(Type.Integer({ minimum: 0, maximum: 5 })),
            ]),
        },
        { additionalProperties: false },
    );

    const paramsSchema = Type.Object({
        id: GameIdSchema,
    });

    fastify.post(
        "/:id/answer",
        {
            schema: { body: schema, params: paramsSchema },
            preParsing: [RequireAuth],
            preHandler: [checkGame],
        },
        async (
            req: FastifyRequest<{
                Body: Static<typeof schema>;
                Params: Static<typeof paramsSchema>;
            }>,
            res,
        ) => {
            const answer = [req.body.answer].flat();
            const { id } = req.params;

            const game = (await gamesCl.findOne({
                id,
                type: "guess",
            })) as Game;

            if (game.endedAt) {
                return res.code(410).send({
                    statusCode: 410,
                    error: "Game ended",
                });
            }

            if (game.host.id !== req.user.id) {
                return res
                    .code(403)
                    .send({ statusCode: 403, error: "Permission denied" });
            }

            await gamesCl.updateOne(
                { id },
                {
                    $set: {
                        answer,
                    },
                    $currentDate: { lastModified: 1, endedAt: 1 },
                },
            );

            const odds =
                game.tokens /
                game.options
                    .filter((_opt, index) => answer.includes(index))
                    .reduce((prev, curr) => {
                        return prev + (curr.tokens || 0);
                    }, 0);

            game.guesses.forEach(async (guess) => {
                if (answer.includes(guess.option)) {
                    const payout = guess.tokens * odds;
                    await usersCl.updateOne(
                        { id: guess.user.id },
                        {
                            $inc: {
                                "games.tokens": payout,
                            },
                        },
                    );
                }
            });

            if (game.tokens >= 100000) {
                // award the host
                await usersCl.updateOne(
                    { id: game.host.id },
                    {
                        $inc: {
                            "games.tokens": game.tokens * 0.1,
                        },
                    },
                );
            }

            return res.code(204).send();
        },
    );
    done();
}
