/*
 Copyright (C) 2022-present Metahkg Contributors

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

import { Static, Type } from "@sinclair/typebox";
import { threadCl } from "../../lib/common";
import Thread from "../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../lib/regex";
import { hiddencats } from "../../lib/hiddencats";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void,
) => {
    const querySchema = Type.Object(
        {
            page: Type.Optional(Type.RegEx(regex.integer)),
            q: Type.String({ maxLength: 200, minLength: 1 }),
            sort: Type.Optional(
                Type.Union(
                    ["relevance", "created", "lastcomment"].map((x) => Type.Literal(x)),
                ),
            ),
            mode: Type.Optional(Type.Union(["title", "op"].map((x) => Type.Literal(x)))),
            limit: Type.Optional(Type.RegEx(regex.oneTo50)),
        },
        { additionalProperties: false },
    );

    fastify.get(
        "/search",
        {
            schema: {
                querystring: querySchema,
            },
        },
        async (
            req: FastifyRequest<{
                Querystring: Static<typeof querySchema>;
            }>,
            res,
        ) => {
            const page = Number(req.query.page) || 1;
            let query: string;
            try {
                query = decodeURIComponent(String(req.query.q));
            } catch {
                return res.code(400).send({ statusCode: 400, error: "Bad request" });
            }
            const sort = req.query.sort || "relevance";
            const mode = req.query.mode || "title";
            const limit = Number(req.query.limit) || 25;
            const user = req.user;

            const regex = new RegExp(
                query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
                "i",
            );

            const data = (await threadCl
                .aggregate(
                    [
                        {
                            $match: {
                                ...(mode === "op"
                                    ? { "op.name": regex }
                                    : { title: regex }),
                                ...(!user && { category: { $nin: await hiddencats() } }),
                                ...(!user && { visibility: { $ne: "internal" } }),
                                removed: { $ne: true },
                            },
                        },
                        mode === "title" && {
                            $unionWith: {
                                coll: "thread",
                                pipeline: [
                                    {
                                        $match: {
                                            $text: {
                                                $search: query,
                                            },
                                            ...(!user && {
                                                category: { $nin: await hiddencats() },
                                            }),
                                            ...(!user && {
                                                visibility: { $ne: "internal" },
                                            }),
                                            removed: { $ne: true },
                                        },
                                    },
                                    {
                                        $sort: {
                                            title: { $meta: "textScore" },
                                        },
                                    },
                                ],
                            },
                        },
                        { $group: { _id: "$_id", doc: { $first: "$$ROOT" } } },
                        {
                            $replaceRoot: {
                                newRoot: "$doc",
                            },
                        },
                        {
                            created: { $sort: { createdAt: -1 } },
                            lastcomment: { $sort: { lastModified: -1 } },
                        }[sort],
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        {
                            $project: {
                                _id: 0,
                                conversation: 0,
                                images: 0,
                                links: 0,
                                pin: 0,
                            },
                        },
                    ].filter((x) => x),
                )
                .toArray()) as Thread[];

            res.send(data);
        },
    );
    done();
};
