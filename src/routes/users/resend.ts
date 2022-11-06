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

import { RecaptchaSecret, verificationCl, limitCl } from "../../lib/common";
import { verifyCaptcha } from "../../lib/recaptcha";
import { Static, Type } from "@sinclair/typebox";
import Limit from "../../models/limit";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { mg, mgDomain, verifyMsg } from "../../lib/mailgun";
import { EmailSchema, RTokenSchema } from "../../lib/schemas";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        { email: EmailSchema, rtoken: RTokenSchema },
        { additionalProperties: false }
    );

    fastify.post(
        "/resend",
        { schema: { body: schema } },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const { email, rtoken } = req.body;

            if (!(await verifyCaptcha(RecaptchaSecret, rtoken)))
                return res
                    .code(429)
                    .send({ statusCode: 429, error: "Recaptcha token invalid." });

            const verificationUserData = await verificationCl.findOne({
                email,
            });
            if (!verificationUserData)
                return res.code(404).send({ statusCode: 404, error: "Email not found." });

            if (
                (await limitCl.countDocuments({
                    type: "resend",
                    email,
                })) >= 5
            )
                return res
                    .status(429)
                    .send({ error: "You can only resend 5 times a day." });

            await mg.messages.create(
                mgDomain,
                verifyMsg({ email, code: verificationUserData.code })
            );

            await limitCl.insertOne({
                type: "resend",
                email,
                createdAt: new Date(),
            } as Limit);
            res.send({ success: true });
        }
    );
    done();
};
