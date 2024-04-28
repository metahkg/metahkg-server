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
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { threadCl, usersCl } from "../../../../lib/common";

import regex from "../../../../lib/regex";
import Thread from "../../../../models/thread";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegExp(regex.integer),
    });

    fastify.post(
        "/star",
        { schema: { params: paramsSchema } },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const user = req.user;
            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized" });

            const threadId = Number(req.params.id);

            if (!((await threadCl.findOne({ id: threadId })) as Thread))
                return res.code(404).send({ statusCode: 404, error: "Thread not found" });

            if (
                !(
                    await usersCl.updateOne(
                        {
                            id: user.id,
                            starred: {
                                $not: {
                                    $elemMatch: { id: threadId },
                                },
                            },
                        },
                        {
                            $push: {
                                starred: {
                                    $each: [{ id: threadId, date: new Date() }],
                                    $position: 0,
                                } as never,
                            },
                        }
                    )
                ).matchedCount
            )
                return res
                    .code(409)
                    .send({ statusCode: 409, error: "Thread already starred" });

            return res.code(204).send();
        }
    );
    done();
}
