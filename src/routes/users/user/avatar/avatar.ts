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

import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import dotenv from "dotenv";
import { Static, Type } from "@sinclair/typebox";
import regex from "../../../../lib/regex";
import { avatarBucket } from "../../../../lib/common";

dotenv.config();

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: () => void,
) {
    const paramsSchema = Type.Object({ id: Type.RegEx(regex.integer) });

    fastify.get(
        "/",
        { schema: { params: paramsSchema } },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            // pipe to a buffer
            const file: Buffer | null = await new Promise<Buffer>((resolve, reject) => {
                const buf: Buffer[] = [];
                const stream = avatarBucket.openDownloadStreamByName(
                    `${req.params.id}.png`,
                );
                stream.on("data", (chunk) => buf.push(chunk));
                stream.on("end", () => {
                    resolve(Buffer.concat(buf));
                });
                stream.on("error", reject);
            })
                .then((v) => v)
                .catch(() => null);

            if (!file)
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "User or avatar not found" });

            res.header("Content-Type", "image/png").send(file);
        },
    );
    done();
}
