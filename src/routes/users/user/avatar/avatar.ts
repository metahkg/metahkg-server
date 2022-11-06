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

import fs from "fs";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import dotenv from "dotenv";
import { Static, Type } from "@sinclair/typebox";
import regex from "../../../../lib/regex";

dotenv.config();

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: () => void
) {
    const paramsSchema = Type.Object({ id: Type.RegEx(regex.integer) });

    fastify.get(
        "/",
        { schema: { params: paramsSchema } },
        (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const filename = `images/avatars/${req.params.id}.png`;

            fs.stat(filename, (err) => {
                if (err)
                    return res
                        .code(404)
                        .send({ statusCode: 404, error: "User or avatar not found." });

                const path = `${filename}`;
                res.header("Content-Type", "image/png").send(fs.readFileSync(path));
            });
        }
    );
    done();
}
