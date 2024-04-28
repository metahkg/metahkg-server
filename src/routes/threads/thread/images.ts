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

import isInteger from "is-sn-integer";
import { threadCl } from "../../../lib/common";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import regex from "../../../lib/regex";
import Thread from "../../../models/thread";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void,
) => {
    const paramsSchema = Type.Object({
        id: Type.RegExp(regex.integer),
    });

    fastify.get(
        "/images",
        { schema: { params: paramsSchema } },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
            }>,
            res,
        ) => {
            if (!isInteger(req.params.id))
                return res.code(400).send({ statusCode: 400, error: "Bad request" });

            const id = Number(req.params.id);

            const result = (await threadCl.findOne(
                { id },
                { projection: { _id: 0, images: 1 } },
            )) as Thread;

            if (!result)
                return res.code(404).send({ statusCode: 404, error: "Thread not found" });
            if ("removed" in result) return;

            res.send(result.images);
        },
    );
    done();
};
