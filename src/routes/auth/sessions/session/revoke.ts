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

import { SessionIdSchema } from "../../../../lib/schemas";
import { getSessionById, getSessionByToken } from "../../../../lib/sessions/getSession";
import { revokeSessionById } from "../../../../lib/sessions/revokeSession";
import RequireAuth from "../../../../plugins/requireAuth";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: SessionIdSchema,
    });

    fastify.delete(
        "/",
        { schema: { params: paramsSchema }, preParsing: [RequireAuth] },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const user = req.user;

            const { id: sessionId } = req.params;

            const currentSession = await getSessionByToken(
                user.id,
                req.headers.authorization?.slice(7)
            );
            const sessionToRevoke = await getSessionById(user.id, sessionId);

            if (!currentSession || !sessionToRevoke) {
                return res.code(404).send({
                    statusCode: 404,
                    error: "Session not found.",
                });
            }

            if (sessionToRevoke.createdAt < currentSession.createdAt) {
                return res.code(409).send({
                    statusCode: 409,
                    error: "Failed to revoke an older session.",
                });
            }

            await revokeSessionById(user.id, sessionId);
            return res.code(204).send();
        }
    );
    done();
}
