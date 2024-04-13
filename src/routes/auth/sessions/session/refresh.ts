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

import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import { RefreshTokenSchema, SessionIdSchema } from "../../../../lib/schemas";
import { getSessionByIdOnly } from "../../../../lib/sessions/getSession";
import { sha256 } from "../../../../lib/sha256";
import { refreshSession } from "../../../../lib/sessions/refreshSession";
import { RateLimitOptions } from "@fastify/rate-limit";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: SessionIdSchema,
    });

    const schema = Type.Object(
        {
            refreshToken: RefreshTokenSchema,
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/refresh",
        {
            schema: {
                params: paramsSchema,
                body: schema,
            },
            config: {
                rateLimit: <RateLimitOptions>{
                    max: 5,
                    ban: 5,
                    timeWindow: 1000 * 60 * 60 * 24,
                },
            },
        },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res
        ) => {
            const { refreshToken } = req.body;
            const { id: sessionId } = req.params;

            const session = await getSessionByIdOnly(sessionId, true);

            if (!session) {
                return res.code(404).send({
                    statusCode: 404,
                    error: "Session not found",
                });
            }

            if (sha256(refreshToken) !== session.refreshToken) {
                return res.code(401).send({
                    statusCode: 401,
                    error: "Invalid refresh token",
                });
            }

            if (session.sameIp && sha256(req.ip) !== session.ip) {
                return res.code(403).send({
                    statusCode: 403,
                    error: "Refreshing with another ip address is not allowed",
                });
            }

            const refresh = await refreshSession(fastify.jwt, session.user, session.id);
            if (!refresh) {
                return res.code(500).send({
                    statusCode: 500,
                    error: "An error occurred",
                });
            }

            return res.send(refresh);
        }
    );
    done();
}
