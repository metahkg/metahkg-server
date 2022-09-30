import User from "../../../models/user";
import { usersCl } from "../../../common";
import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../lib/regex";

/** get username */
export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    const paramsSchema = Type.Object({ id: Type.RegEx(regex.integer) });

    fastify.get(
        "/name",
        {
            schema: {
                params: paramsSchema,
            },
        },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id);

            const requestedUser = (await usersCl.findOne(
                { id },
                { projection: { name: 1, _id: 0 } }
            )) as User;

            if (!requestedUser) return res.code(404).send({ error: "User not found" });

            res.send(requestedUser);
        }
    );
    done();
}
