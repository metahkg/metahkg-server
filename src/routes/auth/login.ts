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

import dotenv from "dotenv";
import { usersCl, verificationCl } from "../../lib/common";
import bcrypt from "bcrypt";
import { Static, Type } from "@sinclair/typebox";
import { createToken } from "../../lib/auth/createToken";
import User from "../../models/user";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { createSession } from "../../lib/sessions/createSession";
import {
    EmailSchema,
    PasswordSchema,
    CaptchaTokenSchema,
    UserNameSchema,
} from "../../lib/schemas";
import { sha256 } from "../../lib/sha256";
import { Verification } from "../../models/verification";
import { RateLimitOptions } from "@fastify/rate-limit";
import RequireCAPTCHA from "../../plugins/requireCaptcha";
import { formatDate } from "../../lib/formatDate";

dotenv.config();

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            name: Type.Union([UserNameSchema, EmailSchema]),
            // check if password is a sha256 hash
            password: PasswordSchema,
            sameIp: Type.Optional(Type.Boolean()),
            captchaToken: CaptchaTokenSchema,
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/login",
        {
            config: {
                rateLimit: <RateLimitOptions>{
                    max: 5,
                    ban: 5,
                    timeWindow: 1000 * 60 * 5,
                },
            },
            schema: { body: schema },
            preHandler: [RequireCAPTCHA],
        },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const { name, password, sameIp } = req.body;

            const user = (await usersCl.findOne({
                $or: [{ name }, { email: sha256(name) }],
            })) as User;

            if (!user) {
                const verifyUser = (await verificationCl.findOne({
                    type: "register",
                    $or: [{ name }, { email: sha256(name) }],
                })) as Verification & { type: "register" };

                if (verifyUser && (await bcrypt.compare(password, verifyUser.password)))
                    return res
                        .code(409)
                        .send({ statusCode: 409, error: "Please verify your email" });

                return res.code(401).send({ statusCode: 401, error: "Login failed" });
            }

            const pwdMatch = await bcrypt.compare(password, user.password);
            if (!pwdMatch)
                return res.code(401).send({ statusCode: 401, error: "Login failed" });

            if (user.ban) {
                return res.code(403).send({
                    statusCode: 403,
                    error: "Forbidden",
                    message: `You have been banned${
                        user.ban.exp ? ` until ${formatDate(user.ban.exp)}` : ""
                    }: ${user.ban.reason || "No reason provided"}.`,
                    ...(user.ban.exp && { exp: user.ban.exp }),
                });
            }

            const token = createToken(fastify.jwt, user);

            const session = await createSession(
                user.id,
                token,
                req.headers["user-agent"],
                req.ip,
                sameIp
            );

            if (!session)
                return res
                    .code(500)
                    .send({ statusCode: 500, error: "An error occurred" });

            res.send(session);
        }
    );
    done();
};
