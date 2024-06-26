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
import { usersCl } from "../../../../lib/common";

import { createToken } from "../../../../lib/auth/createToken";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../../lib/regex";
import User, { userSex } from "../../../../models/user";
import { updateSessionByToken } from "../../../../lib/sessions/updateSession";
import { SexSchema, UserNameSchema } from "../../../../lib/schemas";
import requireSameUser from "../../../../plugins/requireSameUser";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            name: Type.Optional(UserNameSchema),
            sex: Type.Optional(SexSchema),
        },
        { additionalProperties: false, minProperties: 1 }
    );

    const paramsSchema = Type.Object({ id: Type.RegExp(regex.integer) });

    fastify.patch(
        "/",
        {
            schema: { body: schema, params: paramsSchema },
            preParsing: [requireSameUser],
        },
        async (
            req: FastifyRequest<{
                Body: Static<typeof schema>;
                Params: Static<typeof paramsSchema>;
            }>,
            res
        ) => {
            const user = req.user;

            const { name, sex } = req.body as { name?: string; sex?: userSex };

            if (name && name !== user.name && ((await usersCl.findOne({ name })) as User))
                return res
                    .code(409)
                    .send({ statusCode: 409, error: "Name already taken" });

            if (
                !(await usersCl.updateOne({ id: user.id }, { $set: req.body }))
                    .modifiedCount
            )
                return res
                    .code(500)
                    .send({ statusCode: 500, error: "An unknown error occured" });

            const newToken = createToken(
                fastify.jwt,
                {
                    ...user,
                    ...(name && { name }),
                    ...(sex && { sex }),
                },
                req.user.exp - new Date().getTime() / 1000
            );

            await updateSessionByToken(
                user.id,
                req.headers.authorization?.slice(7),
                newToken
            );

            res.send({
                token: newToken,
            });
        }
    );
    done();
};
