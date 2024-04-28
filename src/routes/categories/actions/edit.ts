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
import { categoryCl } from "../../../lib/common";
import regex from "../../../lib/regex";
import { CategoryNameSchema, CategoryTagsSchema } from "../../../lib/schemas";
import RequireAdmin from "../../../plugins/requireAdmin";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegExp(regex.integer),
    });

    const schema = Type.Object(
        {
            name: Type.Optional(CategoryNameSchema),
            tags: Type.Optional(CategoryTagsSchema),
            pinned: Type.Optional(Type.Boolean()),
            hidden: Type.Optional(Type.Boolean()),
            nsfw: Type.Optional(Type.Boolean()),
        },
        { additionalProperties: false, minProperties: 1 }
    );

    fastify.patch(
        "/:id",
        { schema: { params: paramsSchema, body: schema }, preParsing: [RequireAdmin] },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id);

            if (!(await categoryCl.updateOne({ id }, { $set: req.body })).matchedCount)
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Category not found" });

            return res.code(204).send();
        }
    );
    done();
}
