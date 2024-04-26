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
import { categoryCl } from "../../lib/common";
import { CategoryNameSchema, CategoryTagsSchema } from "../../lib/schemas";
import Category from "../../models/category";
import RequireAdmin from "../../plugins/requireAdmin";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    const schema = Type.Object(
        {
            name: CategoryNameSchema,
            tags: Type.Optional(CategoryTagsSchema),
            pinned: Type.Optional(Type.Boolean()),
            hidden: Type.Optional(Type.Boolean()),
            nsfw: Type.Optional(Type.Boolean()),
        },
        { additionalProperties: false },
    );

    fastify.post(
        "/",
        { schema: { body: schema }, preParsing: [RequireAdmin] },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const { name } = req.body;

            if ((await categoryCl.findOne({ name })) as Category)
                return res
                    .code(409)
                    .send({ statusCode: 409, error: "Category already exists" });

            const id =
                (
                    (await categoryCl
                        .find()
                        .sort({ id: -1 })
                        .project({ _id: 0, id: 1 })
                        .limit(1)
                        .toArray()) as Category[]
                )[0]?.id + 1 || 1;

            await categoryCl.insertOne(<Category>{ id, ...req.body });

            return res.code(204).send();
        },
    );
    done();
}
