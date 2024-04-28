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
import { categoryCl, threadCl } from "../../../../lib/common";

import regex from "../../../../lib/regex";
import checkThread from "../../../../plugins/checkThread";
import RequireAdmin from "../../../../plugins/requireAdmin";
import { IntegerSchema, ReasonSchemaAdmin, TitleSchema } from "../../../../lib/schemas";
import Category from "../../../../models/category";
import { objectFilter } from "../../../../lib/objectFilter";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    const paramsSchema = Type.Object({
        id: Type.RegExp(regex.integer),
    });

    const schema = Type.Object(
        {
            title: Type.Optional(TitleSchema),
            category: Type.Optional(IntegerSchema),
            reason: ReasonSchemaAdmin,
        },
        { additionalProperties: false, minProperties: 2 },
    );

    fastify.patch(
        "/",
        {
            schema: { params: paramsSchema, body: schema },
            preHandler: [RequireAdmin, checkThread],
        },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res,
        ) => {
            const id = Number(req.params.id);

            const user = req.user;

            const { category, title, reason } = req.body;

            if (category && !((await categoryCl.findOne({ id: category })) as Category))
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Category not found" });

            await threadCl.updateOne(
                { id },
                {
                    $set: {
                        ...(category && { category }),
                        ...(title && { title }),
                    },
                    $push: {
                        "admin.edits": {
                            admin: objectFilter(user, (key: string) =>
                                ["id", "name", "sex", "role"].includes(key),
                            ),
                            reason,
                            date: new Date(),
                        } as never,
                    },
                },
            );

            return res.code(204).send();
        },
    );
    done();
}
