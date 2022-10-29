import { notificationsCl } from "../../common";
import verifyUser from "../../lib/auth/verify";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.get(
        "/",
        async (
            req: FastifyRequest<{
                Querystring: {
                    limit: string;
                    page: string;
                    unread: string;
                    read: string;
                };
            }>,
            res
        ) => {
            const user = await verifyUser(req.headers.authorization, req.ip);
            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

            const limit = Number(req.query.limit);
            const page = Number(req.query.page) || 1;
            const unread = Boolean(req.query.unread);
            const read = Boolean(req.query.read);

            const notifications = await notificationsCl.findOne(
                { user: user.id },
                {
                    projection: {
                        _id: 0,
                        notifications: {
                            $filter: {
                                input: "$notifications",
                                cond: {
                                    $and: [
                                        {
                                            ...(read && {
                                                $eq: ["$$this.read", true],
                                            }),
                                            ...(unread && {
                                                $eq: ["$$this.read", false],
                                            }),
                                        },
                                        limit
                                            ? {
                                                  $and: [
                                                      {
                                                          $gte: [
                                                              "$$this.id",
                                                              limit * (page - 1) + 1,
                                                          ],
                                                      },
                                                      {
                                                          $lte: [
                                                              "$$this.id",
                                                              limit * page,
                                                          ],
                                                      },
                                                  ],
                                              }
                                            : undefined,
                                    ],
                                },
                            },
                        },
                    },
                }
            );
            res.send(notifications);
        }
    );
    done();
};
