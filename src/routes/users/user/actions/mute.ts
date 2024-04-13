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
import { usersCl } from "../../../../lib/common";
import { agenda } from "../../../../lib/agenda";

import regex from "../../../../lib/regex";
import User from "../../../../models/user";
import RequireAdmin from "../../../../plugins/requireAdmin";
import { ReasonSchemaAdmin, DateSchema } from "../../../../lib/schemas";
import { objectFilter } from "../../../../lib/objectFilter";

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
            reason: ReasonSchemaAdmin,
            exp: Type.Optional(DateSchema),
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/mute",
        { schema: { params: paramsSchema, body: schema }, preParsing: [RequireAdmin] },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id);
            const admin = objectFilter(req.user, (key: string) =>
                ["id", "name", "sex", "role"].includes(key)
            );
            const { reason, exp } = req.body;

            const reqUser = (await usersCl.findOne({ id })) as User;

            if (!reqUser)
                return res.code(404).send({ statusCode: 404, error: "User not found" });

            if (reqUser.role === "admin")
                return res
                    .code(409)
                    .send({ statusCode: 409, error: "Cannot mute an admin" });

            await usersCl.updateOne(
                { id },
                {
                    $set: {
                        mute: {
                            admin,
                            reason,
                            ...(exp && { exp: new Date(exp) }),
                        },
                    },
                }
            );

            await agenda.cancel({ name: "unmuteUser", data: { userId: id } });
            if (exp) await agenda.schedule(new Date(exp), "unmuteUser", { userId: id });

            return res.code(204).send();
        }
    );
    done();
}
