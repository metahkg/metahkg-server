import User from "../../models/user";
import { threadCl, usersCl } from "../../common";
import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../lib/regex";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    const paramsSchema = Type.Object({ id: Type.RegEx(regex.integer) });
    const querySchema = Type.Object({
        nameonly: Type.Optional(
            Type.Union(["1", "0"].map((item) => Type.Literal(item)))
        ),
    });

    fastify.get(
        "/profile/:id",
        {
            schema: {
                params: paramsSchema,
                querystring: querySchema,
            },
        },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Querystring: Static<typeof querySchema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id);

            const requestedUser = (await usersCl.findOne(
                { id },
                {
                    projection: req.query.nameonly
                        ? { name: 1, _id: 0 }
                        : {
                              id: 1,
                              name: 1,
                              createdAt: 1,
                              sex: 1,
                              role: 1,
                              _id: 0,
                          },
                }
            )) as User;

            if (!requestedUser) return res.code(404).send({ error: "User not found" });

            let count: number;

            if (!req.query.nameonly)
                count = await threadCl.countDocuments({
                    "op.id": requestedUser.id,
                });

            res.send({ ...requestedUser, count });
        }
    );
    done();
}
