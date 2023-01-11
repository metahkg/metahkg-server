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

import { usersCl, verificationCl, inviteCl } from "../../lib/common";
import { mg, verifyMsg } from "../../lib/mailgun";
import EmailValidator from "email-validator";
import bcrypt from "bcrypt";
import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import dotenv from "dotenv";
import { sha256 } from "../../lib/sha256";
import {
    EmailSchema,
    UserNameSchema,
    PasswordSchema,
    RTokenSchema,
    SexSchema,
    InviteCodeSchema,
} from "../../lib/schemas";
import { randomBytes } from "crypto";
import { Verification } from "../../models/verification";
import User from "../../models/user";
import { RateLimitOptions } from "@fastify/rate-limit";
import RequireReCAPTCHA from "../../plugins/requireRecaptcha";
import { config } from "../../lib/config";

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
        {
            schema: { body: schema },
            config: {
                rateLimit: <RateLimitOptions>{
                    max: 5,
                    ban: 5,
                    // 1 day
                    timeWindow: 1000 * 60 * 60 * 24,
                },
            },
            preHandler: [RequireReCAPTCHA],
        },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            if (EmailValidator.validate(req.body.name))
                return res
                    .code(400)
                    .send({ statusCode: 400, error: "Name must not be a email." });

            const { name, password, email, sex, inviteCode } = req.body;
            const hashedEmail = sha256(email);

            const registerMode = config.REGISTER_MODE;

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
                ((await usersCl.findOne({
                    $or: [{ name }, { email: hashedEmail }],
                })) as User) ||
                ((await verificationCl.findOne({
                    type: "register",
                    $or: [{ name }, { email: hashedEmail }],
                })) as Verification)
            )
                return res.code(409).send({
                    statusCode: 409,
                    error: "Username or email already in use.",
                });

            const code = randomBytes(15).toString("hex");

            try {
                await mg.messages.create(
                    config.MAILGUN_DOMAIN,
                    verifyMsg({ email, code })
                );
            } catch {
                return res.code(500).send({
                    statusCode: 500,
                    error: "An error occurred while sending the email.",
                });
            }

            const hashedPwd = await bcrypt.hash(password, 10);
            await verificationCl.insertOne(<Verification>{
                createdAt: new Date(),
                code,
                email: hashedEmail,
                password: hashedPwd,
                name,
                sex,
                type: "register",
            });

            res.send({ success: true });
        }
    );
    done();
};
