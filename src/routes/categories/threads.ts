/*
 Copyright (C) 2022-present Wong Chun Yat (wcyat)

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { categoryCl, threadCl } from "../../lib/common";
import { hiddencats as gethiddencats } from "../../lib/hiddencats";
import { Static, Type } from "@sinclair/typebox";
import Thread from "../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../lib/regex";
import Category from "../../models/category";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const querySchema = Type.Object(
        {
            sort: Type.Optional(
                Type.Union(["latest", "viral"].map((s) => Type.Literal(s)))
            ),
            page: Type.Optional(Type.RegEx(regex.integer)),
            limit: Type.Optional(Type.RegEx(regex.oneTo50)),
        },
        { additionalProperties: false }
    );

    const paramsSchema = Type.Object(
        {
            id: Type.RegEx(regex.integer),
        },
        { additionalProperties: false }
    );

    fastify.get(
        "/:id/threads",
        { schema: { querystring: querySchema, params: paramsSchema } },
        async (
            req: FastifyRequest<{
                Querystring: Static<typeof querySchema>;
                Params: Static<typeof paramsSchema>;
            }>,
            res
        ) => {
            const sort = req.query.sort || "latest";
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 25;
            const category = Number(req.params.id);

            const hiddenCats = await gethiddencats();

            if (!req.user && hiddenCats.includes(category))
                return res.code(403).send({ statusCode: 403, error: "Forbidden" });

            if (!((await categoryCl.findOne({ id: category })) as Category))
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Category not found" });

            const viralLimit = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

            const threads = (await threadCl
                .aggregate(
                    [
                        {
                            $match: {
                                category:
                                    category === 1 ? { $nin: hiddenCats } : category,
                                ...(sort === "viral" && {
                                    lastModified: { $gte: viralLimit },
                                }),
                                ...(!req.user && { visibility: { $ne: "internal" } }),
                                removed: { $ne: true },
                            },
                        },
                        sort === "viral" && {
                            $addFields: {
                                newComments: {
                                    $reduce: {
                                        input: "$conversation",
                                        initialValue: 0,
                                        in: {
                                            $add: [
                                                "$$value",
                                                {
                                                    $toInt: {
                                                        $gte: [
                                                            "$$this.createdAt",
                                                            viralLimit,
                                                        ],
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                        {
                            $sort: {
                                ...(sort === "viral" && { newComments: -1 }),
                                lastModified: -1,
                            },
                        },
                        { $skip: limit * (page - 1) },
                        { $limit: limit },
                        {
                            $project: {
                                _id: 0,
                                conversation: 0,
                                newComments: 0,
                                images: 0,
                                pin: 0,
                            },
                        },
                    ].filter((x) => x)
                )
                .toArray()) as Thread[];

            res.send(threads);
        }
    );
    done();
};
