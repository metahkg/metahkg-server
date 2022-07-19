import User from "../../models/user";
import { threadCl, usersCl } from "../../common";
import { ajv } from "../../lib/ajv";
import { Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    fastify.get(
        "/profile/:id",
        async (
            req: FastifyRequest<{
                Params: { id: string };
                Querystring: { nameonly?: string };
            }>,
            res
        ) => {
            const id = Number(req.params.id);

            if (!ajv.validate(Type.Integer({ minimum: 1 }), id))
                return res.code(400).send({ error: "Bad request." });

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
