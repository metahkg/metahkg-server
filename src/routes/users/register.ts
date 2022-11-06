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

import { RecaptchaSecret, usersCl, verificationCl, inviteCl } from "../../lib/common";
import { mg, mgDomain, verifyMsg } from "../../lib/mailgun";
import EmailValidator from "email-validator";
import { verifyCaptcha } from "../../lib/recaptcha";
import bcrypt from "bcrypt";
import { generate } from "generate-password";
import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import dotenv from "dotenv";
import { agenda } from "../../lib/agenda";
import { sha256 } from "../../lib/sha256";
import {
    EmailSchema,
    UserNameSchema,
    PasswordSchema,
    RTokenSchema,
    SexSchema,
    InviteCodeSchema,
} from "../../lib/schemas";

dotenv.config();

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            name: UserNameSchema,
            // check if password is a sha256 hash
            password: PasswordSchema,
            email: EmailSchema,
            rtoken: RTokenSchema,
            sex: SexSchema,
            inviteCode: Type.Optional(InviteCodeSchema),
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/register",
        { schema: { body: schema } },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            if (EmailValidator.validate(req.body.name))
                return res.code(400).send({ statusCode: 400, error: "Bad request." });

            const { name, password, email, rtoken, sex, inviteCode } = req.body;

            if (!(await verifyCaptcha(RecaptchaSecret, rtoken)))
                return res
                    .code(429)
                    .send({ statusCode: 429, error: "Recaptcha token invalid." });

            // register modes (process.env.register)
            const registerMode =
                {
                    normal: "normal",
                    none: "none",
                    invite: "invite",
                }[process.env.register || ""] || "normal";

            if (registerMode === "none")
                return res
                    .code(400)
                    .send({ statusCode: 400, error: "Registration disabled." });

            // TODO: WARNING: frontend not implemented !!!
            if (
                registerMode === "invite" &&
                !(await inviteCl.findOne({ code: inviteCode }))
            )
                return res
                    .code(400)
                    .send({ statusCode: 400, error: "Invalid invite code." });

            if (
                (await usersCl.findOne({
                    $or: [{ name }, { email: sha256(email) }],
                })) ||
                (await verificationCl.findOne({
                    $or: [{ name }, { email }],
                }))
            )
                return res.code(409).send({
                    statusCode: 409,
                    error: "Username or email already in use.",
                });

            const code = generate({
                length: 30,
                numbers: true,
                lowercase: true,
                uppercase: true,
                symbols: false,
                strict: true,
            });

            await mg.messages.create(mgDomain, verifyMsg({ email, code }));

            const hashedPwd = await bcrypt.hash(password, 10);
            await verificationCl.insertOne({
                createdAt: new Date(),
                code,
                email,
                password: hashedPwd,
                name,
                sex,
                type: "register",
            });

            await agenda.every(
                "1 day",
                "updateVerificationCode",
                { email },
                {
                    startDate: new Date(new Date().getTime() + 86400 * 1000),
                    skipImmediate: true,
                }
            );

            res.send({ success: true });
        }
    );
    done();
};
