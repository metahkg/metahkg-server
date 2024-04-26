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

import User from "../../../models/user";
import { threadCl, usersCl } from "../../../lib/common";

import Thread from "../../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import regex from "../../../lib/regex";
import { hiddencats } from "../../../lib/hiddencats";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const querySchema = Type.Object(
        {
            sort: Type.Optional(
                Type.Union([Type.Literal("created"), Type.Literal("lastcomment")])
            ),
            page: Type.Optional(Type.RegEx(regex.integer)),
            limit: Type.Optional(Type.RegEx(regex.oneTo50)),
        },
        { additionalProperties: false }
    );

    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    fastify.get(
        "/threads",
        { schema: { params: paramsSchema, querystring: querySchema } },
        async (
            req: FastifyRequest<{
                Querystring: Static<typeof querySchema>;
                Params: Static<typeof paramsSchema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id) || req.params.id;
            const page = Number(req.query.page) || 1;
            const sort = req.query.sort || "created";
            const limit = Number(req.query.limit) || 25;
            const user = req.user;

            const requestedUser = (await usersCl.findOne({ id })) as User;

            if (!requestedUser)
                return res.code(404).send({ statusCode: 404, error: "User not found" });

            const history = (await threadCl
                .find({
                    "op.id": requestedUser.id,
                    ...(!user && { category: { $nin: await hiddencats() } }),
                    ...(!user && { visibility: { $ne: "internal" } }),
                    removed: { $ne: true },
                })
                .sort({
                    ...(sort === "created" && { createdAt: -1 }),
                    ...(sort === "lastcomment" && { lastModified: -1 }),
                })
                .skip(limit * (page - 1))
                .limit(limit)
                .project({ _id: 0, conversation: 0, images: 0, pin: 0 })
                .toArray()) as Thread[];

            res.send(history);
        }
    );
    done();
};
