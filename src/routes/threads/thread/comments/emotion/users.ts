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
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { threadCl, usersCl } from "../../../../../lib/common";
import regex from "../../../../../lib/regex";
import { Emotion } from "../../../../../models/thread";
import User from "../../../../../models/user";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
        cid: Type.RegEx(regex.integer),
        emotion: Type.RegEx(regex.emoji),
    });

    fastify.get(
        "/:emotion/users",
        { schema: { params: paramsSchema } },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const id = Number(req.params.id);
            const cid = Number(req.params.cid);
            const { emotion } = req.params;

            const emotions = (
                await threadCl
                    .aggregate([
                        { $match: { id, conversation: { $elemMatch: { id: cid } } } },
                        {
                            $project: {
                                _id: 0,
                                conversation: {
                                    $filter: {
                                        input: "$conversation",
                                        cond: { $eq: ["$$this.id", cid] },
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
                        { $set: { emotions: "$conversation.emotions" } },
                        {
                            $project: {
                                emotions: {
                                    $filter: {
                                        input: "$emotions",
                                        cond: { $eq: ["$$this.emotion", emotion] },
                                    },
                                },
                            },
                        },
                    ])
                    .toArray()
            )[0]?.emotions as Emotion[];

            if (!emotions?.length) return res.send([]);

            const users = (await usersCl
                .find({
                    id: { $in: emotions.map((x) => x.user) },
                })
                .project({
                    _id: 0,
                    id: 1,
                    name: 1,
                    sex: 1,
                    role: 1,
                })
                .toArray()) as User[];

            res.send(users);
        }
    );
    done();
}
