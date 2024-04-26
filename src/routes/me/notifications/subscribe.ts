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
import { FastifyPluginOptions, FastifyInstance, FastifyRequest } from "fastify";

import { subscribeByToken } from "../../../lib/notifications/subscribe";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const schema = Type.Object(
        {
            endpoint: Type.String({ format: "uri", maxLength: 1000 }),
            keys: Type.Object(
                {
                    auth: Type.String({ minLength: 22, maxLength: 22 }),
                    p256dh: Type.String({ minLength: 87, maxLength: 87 }),
                },
                { additionalProperties: false }
            ),
        },
        { additionalProperties: false }
    );
    fastify.post(
        "/subscribe",
        { schema: { body: schema } },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const user = req.user;

            await subscribeByToken(
                user.id,
                req.headers.authorization?.slice(7),
                req.body
            );

            return res.code(204).send();
        }
    );
    done();
}
