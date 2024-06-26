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

import { RateLimitOptions } from "@fastify/rate-limit";
import { Static, Type } from "@sinclair/typebox";
import { randomBytes } from "crypto";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { usersCl, verificationCl } from "../../lib/common";
import { sendResetMsg } from "../../lib/email";
import { EmailSchema, CaptchaTokenSchema } from "../../lib/schemas";
import { sha256 } from "../../lib/sha256";
import User from "../../models/user";
import { Verification } from "../../models/verification";
import RequireCAPTCHA from "../../plugins/requireCaptcha";
import { config } from "../../lib/config";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            email: EmailSchema,
            captchaToken: config.DISABLE_CAPTCHA
                ? Type.Optional(CaptchaTokenSchema)
                : CaptchaTokenSchema,
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/forgot",
        {
            schema: { body: schema },
            config: {
                rateLimit: <RateLimitOptions>{
                    max: 2,
                    ban: 2,
                    keyGenerator: (
                        req: FastifyRequest<{ Body: Static<typeof schema> }>
                    ) => {
                        return sha256(req.body?.email);
                    },
                    hook: "preHandler",
                    // one day
                    timeWindow: 1000 * 60 * 60 * 24,
                },
            },
            preHandler: [RequireCAPTCHA],
        },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const { email } = req.body;
            const hashedEmail = sha256(email);

            const userData = (await usersCl.findOne({ email: hashedEmail })) as User;
            if (!userData)
                return res.code(404).send({ statusCode: 404, error: "User not found" });

            const verificationCode = randomBytes(30).toString("hex");

            if (!(await sendResetMsg(email, verificationCode))) {
                res.code(500).send({
                    statusCode: 500,
                    error: "An error occurred while sending the email",
                });
            }

            await verificationCl.insertOne(<Verification>{
                type: "reset",
                code: verificationCode,
                email: hashedEmail,
            });

            res.code(204).send();
        }
    );
    done();
};
