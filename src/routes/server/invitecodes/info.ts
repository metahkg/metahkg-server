import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { inviteCl } from "../../../lib/common";
import { InviteCodeSchema } from "../../../lib/schemas";
import { Invite } from "../../../models/invite";

export default function (
    fastify: FastifyInstance,
    _opt: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object(
        {
            code: InviteCodeSchema,
        },
        { additionalProperties: false }
    );
    fastify.get(
        "/:code",
        { schema: { params: paramsSchema } },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const { code } = req.params;

            const invite = (await inviteCl.findOne(
                { code },
                { projection: { _id: 0 } }
            )) as Invite;
            if (!invite) {
                return res.status(404).send({ statusCode: 404, error: "Not found" });
            }

            return res.status(200).send(invite);
        }
    );
    done();
}
