import { Static, Type } from "@sinclair/typebox";
import { generate } from "generate-password";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { inviteCl } from "../../../lib/common";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    const schema = Type.Object(
        {
            description: Type.Optional(Type.String()),
        },
        { additionalProperties: false },
    );

    fastify.post(
        "/generate",
        { schema: { body: schema } },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const { description } = req.body;

            let inviteCode: string;

            while (!inviteCode || (await inviteCl.findOne({ code: inviteCode }))) {
                inviteCode = generate({
                    length: 10,
                    numbers: true,
                    uppercase: true,
                    lowercase: true,
                    symbols: false,
                    excludeSimilarCharacters: true,
                    strict: true,
                });
            }

            await inviteCl.insertOne({
                code: inviteCode,
                description,
                createdAt: new Date(),
            });

            return res.send({
                code: inviteCode,
            });
        },
    );
    done();
}
