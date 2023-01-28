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
import { categoryCl, removedCl } from "../../../lib/common";
import regex from "../../../lib/regex";
import { CategoryNameSchema, CategoryTagsSchema } from "../../../lib/schemas";
import Category from "../../../models/category";
import RequireAdmin from "../../../plugins/requireAdmin";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    const schema = Type.Object(
        {
            name: Type.Optional(CategoryNameSchema),
            tags: Type.Optional(CategoryTagsSchema),
        },
        { additionalProperties: false }
    );

    fastify.delete(
        "/:id",
        { schema: { params: paramsSchema, body: schema }, preHandler: [RequireAdmin] },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id);

            const category = (await categoryCl.findOne(
                { id },
                { projection: { _id: 0 } }
            )) as Category;

            if (!category)
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Category not found." });

            await removedCl.insertOne({ type: "category", category });

            await categoryCl.deleteOne({ id });

            return res.code(204).send();
        }
    );
    done();
}
