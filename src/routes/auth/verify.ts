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
import { Static, Type } from "@sinclair/typebox";
import { createToken } from "../../lib/auth/createToken";
import User from "../../models/user";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { createSession } from "../../lib/sessions/createSession";
import { CodeSchema, EmailSchema, RTokenSchema } from "../../lib/schemas";
import { sha256 } from "../../lib/sha256";
import { Verification } from "../../models/verification";
import { RateLimitOptions } from "@fastify/rate-limit";
import RequireReCAPTCHA from "../../plugins/requireRecaptcha";

dotenv.config();

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            email: EmailSchema,
            code: CodeSchema,
            sameIp: Type.Optional(Type.Boolean()),
            rtoken: RTokenSchema,
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/verify",
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
            const { email, code, sameIp } = req.body;

            const hashedEmail = sha256(email);

            const verificationData = (await verificationCl.findOne({
                type: "register",
                email: hashedEmail,
                code,
            })) as Verification & { type: "register" };

            if (!verificationData)
                return res
                    .code(401)
                    .send({ error: "Code incorrect or expired, or email not found." });

            const { name, password, sex } = verificationData;

            const newUserId =
                ((await usersCl.find().sort({ id: -1 }).limit(1).toArray()) as User[])[0]
                    ?.id + 1 || 1;

            const newUser: User = {
                name,
                id: newUserId,
                email: hashedEmail,
                password,
                role: "user",
                createdAt: new Date(),
                sex,
            };

            await usersCl.insertOne(newUser);
            await verificationCl.deleteOne({ type: "register", email: hashedEmail });

            const token = createToken(fastify.jwt, newUser);

            const session = await createSession(
                newUser.id,
                token,
                req.headers["user-agent"],
                req.ip,
                sameIp
            );

            if (!session)
                return res
                    .code(500)
                    .send({ statusCode: 500, error: "An error occurred." });

            res.send(session);
        }
    );
    done();
};
