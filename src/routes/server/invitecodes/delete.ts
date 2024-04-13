import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { inviteCl } from "../../../lib/common";
import { InviteCodeSchema } from "../../../lib/schemas";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    const paramsSchema = Type.Object(
        {
            code: InviteCodeSchema,
        },
        { additionalProperties: false },
    );
    fastify.delete(
        "/:code",
        { schema: { params: paramsSchema } },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const { code } = req.params;

            if (!(await inviteCl.deleteOne({ code })).deletedCount) {
                return res.status(404).send({
                    statusCode: 404,
                    error: "Not found",
                });
            }

            return res.status(204).send();
        },
    );
    done();
}
