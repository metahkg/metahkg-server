import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { gamesCl, usersCl } from "../../../lib/common";
import { Game } from "../../../models/games";
import RequireAuth from "../../../plugins/requireAuth";
import User from "../../../models/user";
import { objectFilter } from "../../../lib/objectFilter";
import { publicUserType } from "../../../models/thread";
import { checkGame } from "../../../plugins/checkGame";
import { GameIdSchema } from "../../../lib/schemas";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const schema = Type.Object(
        {
            option: Type.Integer({ minimum: 0, maximum: 5 }),
            tokens: Type.Integer({ minimum: 10 }),
        },
        { additionalProperties: false }
    );

    const paramsSchema = Type.Object({
        id: GameIdSchema,
    });

    fastify.post(
        "/:id/guess",
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
            res
        ) => {
            const { option, tokens } = req.body;
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

            const user = (await usersCl.findOne({ id: req.user.id })) as User;

            if (user.id === game.host.id) {
                return res.code(409).send({
                    statusCode: 409,
                    error: "You can't guess in your own game!",
                });
            }

            if (user.games.guess.tokens < tokens) {
                return res.code(409).send({
                    statusCode: 409,
                    error: "Insufficient tokens",
                });
            }

            await gamesCl.updateOne(
                { id },
                {
                    $push: {
                        guesses: {
                            user: objectFilter(req.user, (key: string) =>
                                ["id", "name", "sex", "role"].includes(key)
                            ) as publicUserType,
                            option,
                            tokens,
                        },
                    },
                    $inc: {
                        tokens,
                        [`options.${option}.tokens`]: tokens,
                    },
                    $set: game.options.reduce((prev, curr, index) => {
                        prev[`options.${index}.odds`] =
                            (game.tokens + tokens) /
                            (curr.tokens + (option === index ? tokens : 0));
                        return prev;
                    }, {} as { [key: string]: number }),
                }
            );

            await usersCl.updateOne(
                { id: user.id },
                {
                    $inc: {
                        "games.guess.tokens": -tokens,
                    },
                }
            );

            return res.code(204).send();
        }
    );
    done();
}
