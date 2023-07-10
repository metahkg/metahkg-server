import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import RequireAuth from "../../../plugins/requireAuth";
import { gamesCl } from "../../../lib/common";
import { Game } from "../../../models/games";
import { objectFilter } from "../../../lib/objectFilter";
import { randomBytes } from "crypto";
import { publicUserType } from "../../../models/thread";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const schema = Type.Object(
        {
            title: Type.String({ maxLength: 1000 }),
            options: Type.Array(Type.String({ maxLength: 1000 }), {
                maxItems: 6,
                minItems: 2,
            }),
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/",
        { schema: { body: schema }, preParsing: [RequireAuth] },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const user = req.user;
            const { title, options } = req.body;

            let id = randomBytes(30).toString("hex");
            while (await gamesCl.findOne({ id })) {
                id = randomBytes(30).toString("hex");
            }

            await gamesCl.insertOne(<Game>{
                id,
                type: "guess",
                host: objectFilter(user, (key: string) =>
                    ["id", "name", "sex", "role"].includes(key)
                ) as publicUserType,
                title,
                options: options.map((option) => ({ text: option, odds: 1, tokens: 0 })),
                createdAt: new Date(),
                lastModified: new Date(),
            });

            return res.send({ id });
        }
    );
    done();
}
