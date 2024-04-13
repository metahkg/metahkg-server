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
            let start = Number(req.query.start);
            let end = Number(req.query.end);
            const sort = (req.query.sort || "time") as "score" | "time" | "latest";

            if (sort === "time") {
                start = start || (page - 1) * limit + 1;
                end = end || page * limit;
            }

            if (end < start)
                return res.code(400).send({ statusCode: 400, error: "Bad request" });

            if (!((await threadCl.findOne({ id })) as Thread))
                return res.code(404).send({ statusCode: 404, error: "Thread not found" });

            // filter the conversation array to only include messages
            // that are within the start and end range
            const thread = (
                await threadCl
                    .aggregate(
                        [
                            { $match: { id } },
                            // unwind the conversation array so we can sort it
                            {
                                $unwind: {
                                    path: "$conversation",
                                    preserveNullAndEmptyArrays: true,
                                },
                            },
                            start &&
                                end && {
                                    $match: {
                                        "conversation.id": { $gte: start, $lte: end },
                                    },
                                },
                            // add a score field to each message
                            {
                                $set: {
                                    "conversation.score": {
                                        $subtract: [
                                            { $ifNull: ["$conversation.U", 0] },
                                            { $ifNull: ["$conversation.D", 0] },
                                        ],
                                    },
                                },
                            },
                            // sort the conversation array
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
                                $match: {
                                    ...(!req.user && {
                                        "conversation.visibility": { $ne: "internal" },
                                    }),
                                },
                            },
                            !(start && end) && {
                                $skip: limit * (page - 1),
                            },
                            !(start && end) && {
                                $limit: limit,
                            },
                            // group the conversation array back into the thread
                            {
                                $group: {
                                    _id: "$_id",
                                    doc: { $first: "$$ROOT" },
                                    conversation: { $push: "$conversation" },
                                },
                            },
                            // replace the root with the thread
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
                            // remove the _id field
                            { $project: { _id: 0 } },
                        ].filter(Boolean)
                    )
                    .toArray()
            )[0] as Thread;

            res.send(
                thread ||
                    (
                        await threadCl
                            .aggregate([
                                { $match: { id } },
                                { $set: { conversation: [] } },
                                { $project: { _id: 0 } },
                            ])
                            .toArray()
                    )[0]
            );
        }
    );
    done();
};
