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

import { FastifyReply, FastifyRequest } from "fastify";
import { categoryCl, threadCl } from "../lib/common";
import Category from "../models/category";
import Thread from "../models/thread";

export default async function (
    req: FastifyRequest<{ Params: { id?: string } }>,
    res: FastifyReply
) {
    if (req.params.id) {
        const id = Number(req.params.id);
        if (!(Number.isInteger(id) && id > 0)) return;

        const category = (
            (await threadCl.findOne(
                { id },
                { projection: { _id: 0, category: 1 } }
            )) as Thread & { removed: undefined }
        )?.category;

        if (!category) return;

        const hidden = (
            (await categoryCl.findOne({
                id: category,
            })) as Category
        )?.hidden;

        if (hidden && !req.user)
            return res.code(403).send({ statusCode: 403, error: "Forbidden" });
    }
    return;
}
