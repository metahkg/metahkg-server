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

import { Static, Type } from "@sinclair/typebox";
import { usersCl } from "../../../../lib/common";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../../lib/regex";
import User from "../../../../models/user";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const paramsSchema = Type.Object({
        id: Type.RegExp(regex.integer),
    });

    fastify.post(
        "/follow",
        {
            schema: {
                params: paramsSchema,
            },
        },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
            }>,
            res
        ) => {
            const user = req.user;
            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized" });

            const userId = Number(req.params.id);

            if (!((await usersCl.findOne({ id: userId })) as User))
                return res.code(404).send({ statusCode: 404, error: "User not found" });

            if (
                !(
                    await usersCl.updateOne(
                        {
                            id: user.id,
                            following: {
                                $not: {
                                    $elemMatch: { id: userId },
                                },
                            },
                        },
                        {
                            $push: {
                                following: { id: userId, date: new Date() },
                            } as never,
                        }
                    )
                ).matchedCount
            )
                return res
                    .code(409)
                    .send({ statusCode: 409, error: "User already followed" });

            return res.code(204).send();
        }
    );
    done();
};
