import User from "../../models/user";
import { threadCl, usersCl } from "../../common";
import verifyUser from "../../lib/auth/verify";
import Thread from "../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { ajv } from "../../lib/ajv";
import { Type } from "@sinclair/typebox";

export default (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    /**
     * get threads created by a user
     * syntax: GET /api/history/<user-id | "self">
     * returns an array of objects
     * sort:
     * 0: by creation time //default
     * 1: by last modification time
     */
    fastify.get(
        "/history/:id",
        async (
            req: FastifyRequest<{
                Querystring: { sort?: string; page?: string };
                Params: { id: string };
            }>,
            res
        ) => {
            const id = Number(req.params.id) || req.params.id;
            const page = Number(req.query.page) || 1;
            const sort = Number(req.query.sort || 0);

            if (
                !ajv.validate(
                    Type.Object({
                        id: Type.Union([
                            Type.Integer({ minimum: 1 }),
                            Type.Literal("self"),
                        ]),
                        page: Type.Integer({ minimum: 1 }),
                        sort: Type.Integer({ minimum: 0, maximum: 1 }),
                    }),
                    { id, page, sort }
                )
            )
                return res.status(400).send({ error: "Bad request." });

            const requestedUser =
                req.params.id === "self"
                    ? verifyUser(req.headers.authorization)
                    : ((await usersCl.findOne({ id: Number(req.params.id) })) as User);

            if (!requestedUser) return res.status(400).send({ error: "User not found." });

            const history = (await threadCl
                .find({ "op.id": requestedUser.id })
                .sort({
                    ...(sort === 0 && { createdAt: -1 }),
                    ...(sort === 1 && { lastModified: -1 }),
                })
                .skip(25 * (page - 1))
                .limit(25)
                .project({ _id: 0, conversation: 0 })
                .toArray()) as Thread[];

            res.send(history);
        }
    );
    done();
};
