/*
 Copyright (C) 2022 -present Wong Chun Yat (wcyat)

 This program is free software: you can redistribute it and/or modify
 it under the terms of the  GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General  Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { threadCl, usersCl } from "../../lib/common";
import regex from "../../lib/regex";
import Thread from "../../models/thread";
import User from "../../models/user";
import RequireAuth from "../../plugins/requireAuth";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const querySchema = Type.Object(
        {
            page: Type.Optional(Type.RegExp(regex.integer)),
            sort: Type.Optional(
                Type.Union(["created", "lastcomment"].map((x) => Type.Literal(x)))
            ),
            limit: Type.Optional(Type.RegExp(regex.oneTo50)),
        },
        { additionalProperties: false }
    );

    fastify.get(
        "/following",
        {
            schema: {
                querystring: querySchema,
            },
            preParsing: [RequireAuth]
        },
        async (
            req: FastifyRequest<{
                Querystring: Static<typeof querySchema>;
            }>,
            res
        ) => {
            const user = req.user;

            const page = Number(req.query.page) || 1;
            const sort = req.query.sort || "created";
            const limit = Number(req.query.limit) || 25;

            const following = ((await usersCl.findOne(
                { id: user.id },
                { projection: { _id: 0, following: 1 } }
            ) as User)?.following || []).map((f) => f.id);

            if (!following?.length) {
                return []
            }

            const threads = (await threadCl
                .aggregate([
                    {
                        $match: {
                            "op.id": { $in: following },
                            removed: { $ne: true },
                        },
                    },
                    {
                        created: { $sort: { createdAt: -1 } },
                        lastcomment: { $sort: { lastModified: - 1 } },
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
                ])
                .toArray()) as Thread[];

            res.send(threads);
        }
    );
    done();
};

