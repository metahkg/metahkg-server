import { domain, limitCl, mg, mgDomain, usersCl, verificationCl } from "../../common";
import hash from "hash.js";
import { Static, Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import User from "../../models/user";
import Limit from "../../models/limit";
import bcrypt from "bcrypt";
import { createToken } from "../../lib/auth/createtoken";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { randomBytes } from "crypto";

export default (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            email: Type.String({ format: "email" }),
            token: Type.Optional(Type.String({ minLength: 30, maxLength: 30 })),
            pwd: Type.Optional(Type.RegEx(/^[a-f0-9]{64}$/i)),
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/reset",
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            if (!ajv.validate(schema, req.body))
                return res.code(400).send({ error: "Bad request." });

            const { email, token, pwd } = req.body;

            const hashedEmail = hash.sha256().update(email).digest("hex");

            const userData = (await usersCl.findOne({ email: hashedEmail })) as User;
            if (!userData) return res.code(404).send({ error: "User not found." });

            if (token && pwd) {
                if (
                    !(await verificationCl.findOne({
                        type: "reset",
                        email: hashedEmail,
                        code: token,
                    }))
                )
                    return res.code(401).send({
                        error: "Token incorrect, or expired, or you have not requested reset password.",
                    });

                const userData = (await usersCl.findOne({ email: hashedEmail })) as User;

                if (!userData) return res.code(404).send({ error: "User not found." });

                await usersCl.updateOne(
                    { email: hashedEmail },
                    { $set: { pwd: bcrypt.hashSync(pwd, 10) } }
                );

                await verificationCl.deleteOne({
                    type: "reset",
                    email: hashedEmail,
                    code: token,
                });

                return res.send({
                    token: createToken(
                        userData.id,
                        userData.name,
                        userData.sex,
                        userData.role
                    ),
                });
            }

            if (
                (await limitCl.countDocuments({ type: "reset", email: hashedEmail })) >= 2
            )
                return res.code(429).send({
                    error: "You can only request reset password 2 times a day.",
                });

            const verificationCode = randomBytes(15).toString("hex");

            const reset = {
                from: `Metahkg support <support@${mgDomain}>`,
                to: req.body.email,
                subject: "Metahkg - Reset Password",
                text: `Reset your password with the following link:
    https://${domain}/users/reset?code=${encodeURIComponent(
                    verificationCode
                )}&email=${encodeURIComponent(req.body.email)}

    Alternatively, use this code at https://${domain}/reset :
    ${verificationCode}`,
            };

            await mg.messages().send(reset);

            await verificationCl.insertOne({
                type: "reset",
                code: verificationCode,
                email: userData.email,
            });

            await limitCl.insertOne({
                type: "reset",
                email: userData.email,
                createdAt: new Date(),
            } as Limit);

            res.send({ response: "ok" });
        }
    );
    done();
};
