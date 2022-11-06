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

import { usersCl, verificationCl } from "../../lib/common";
import { Static, Type } from "@sinclair/typebox";
import User from "../../models/user";
import bcrypt from "bcrypt";
import { createToken } from "../../lib/auth/createToken";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { createSession } from "../../lib/sessions/createSession";
import { CodeSchema, EmailSchema, PasswordSchema } from "../../lib/schemas";
import { sha256 } from "../../lib/sha256";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            email: EmailSchema,
            code: CodeSchema,
            password: PasswordSchema,
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/reset",
        { schema: { body: schema } },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const { email, code, password } = req.body;

            const hashedEmail = sha256(email);

            if (
                !(await verificationCl.findOne({
                    type: "reset",
                    email: hashedEmail,
                    code,
                }))
            )
                return res.code(401).send({
                    statusCode: 401,
                    error: "Token incorrect, or expired, or you have not requested reset password.",
                });

            const user = (await usersCl.findOne({ email: hashedEmail })) as User;
            if (!user)
                return res.code(404).send({ statusCode: 404, error: "User not found." });

            await usersCl.updateOne(
                { email: hashedEmail },
                { $set: { password: bcrypt.hashSync(password, 10) } }
            );

            await verificationCl.deleteOne({
                type: "reset",
                email: hashedEmail,
                code: code,
            });

            const token = createToken(fastify.jwt, user);

            await createSession(user.id, token, req.headers["user-agent"], req.ip);

            return res.send({ token });
        }
    );
    done();
};
