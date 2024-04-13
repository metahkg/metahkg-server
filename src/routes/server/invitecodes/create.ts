import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { inviteCl } from "../../../lib/common";
import { InviteCodeSchema } from "../../../lib/schemas";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const schema = Type.Object(
        {
            code: InviteCodeSchema,
            description: Type.Optional(Type.String()),
        },
        { additionalProperties: false }
    );
    fastify.post(
        "/",
        { schema: { body: schema } },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const { code, description } = req.body;
            if (await inviteCl.findOne({ code })) {
                return res.status(409).send({
                    statusCode: 409,
                    error: "code already exists",
                });
            }
            await inviteCl.insertOne({
                code,
                description,
                createdAt: new Date(),
            });
            res.code(204).send();
        }
    );
    done();
}
