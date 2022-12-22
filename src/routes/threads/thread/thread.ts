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

import { threadCl } from "../../../lib/common";
import { Static, Type } from "@sinclair/typebox";
import Thread from "../../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../lib/regex";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const querySchema = Type.Object(
        {
            page: Type.Optional(Type.RegEx(regex.integer)),
            start: Type.Optional(Type.RegEx(regex.integer)),
            end: Type.Optional(Type.RegEx(regex.integer)),
            sort: Type.Optional(Type.RegEx(/^(score|time|latest)$/)),
            limit: Type.Optional(Type.RegEx(regex.oneTo50)),
        },
        { additionalProperties: false }
    );

    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    fastify.get(
        "/",
        { schema: { params: paramsSchema, querystring: querySchema } },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Querystring: Static<typeof querySchema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id);
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 25;
            const start = Number(req.query.start) || (page - 1) * limit + 1;
            const end = Number(req.query.end) || page * limit;
            const sort = (req.query.sort || "time") as "score" | "time" | "latest";

            if (end < start)
                return res.code(400).send({ statusCode: 400, error: "Bad request." });

            if (!((await threadCl.findOne({ id })) as Thread))
                return res.code(404).send({ statusCode: 404, error: "Thread not found" });

            const thread = (
                await threadCl
                    .aggregate([
                        { $match: { id } },
                        {
                            $set: {
                                conversation: {
                                    $filter: {
                                        input: "$conversation",
                                        cond: {
                                            $and: [
                                                { $gte: ["$$this.id", start] },
                                                { $lte: ["$$this.id", end] },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                        {
                            $set: {
                                conversation: {
                                    $map: {
                                        input: "$conversation",
                                        in: {
                                            $mergeObjects: [
                                                "$$this",
                                                {
                                                    score: {
                                                        $subtract: [
                                                            { $ifNull: ["$$this.U", 0] },
                                                            { $ifNull: ["$$this.D", 0] },
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
                            $unwind: {
                                path: "$conversation",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                        {
                            $sort: {
                                score: {
                                    "conversation.score": -1,
                                    "conversation.createdAt": 1,
                                },
                                time: { "conversation.createdAt": 1 },
                                latest: { "conversation.createdAt": -1 },
                            }[sort],
                        },
                        {
                            $group: {
                                _id: "$_id",
                                doc: { $first: "$$ROOT" },
                                conversation: { $push: "$conversation" },
                            },
                        },
                        {
                            $replaceRoot: {
                                newRoot: {
                                    $mergeObjects: [
                                        "$doc",
                                        {
                                            conversation: {
                                                $ifNull: ["$conversation", []],
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                        { $project: { _id: 0 } },
                    ])
                    .toArray()
            )[0] as Thread;

            res.send(thread);
        }
    );
    done();
};
