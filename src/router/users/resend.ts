import { secret, domain, verificationCl, limitCl, mg, mgDomain } from "../../common";
import { verifyCaptcha } from "../../lib/recaptcha";
import { Static, Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import Limit from "../../models/limit";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        { email: Type.String({ format: "email" }), rtoken: Type.String() },
        { additionalProperties: false }
    );

    fastify.post(
        "/resend",
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const { email, rtoken } = req.body;

            if (!ajv.validate(schema, req.body))
                return res.status(400).send({ error: "Bad request." });

            if (!(await verifyCaptcha(secret, rtoken)))
                return res.status(400).send({ error: "recaptcha token invalid." });

            const verificationUserData = await verificationCl.findOne({
                email,
            });
            if (!verificationUserData) {
                return res.status(404).send({
                    error: "Email not found.",
                });
            }

            if (
                (await limitCl.countDocuments({
                    type: "resend",
                    email,
                })) >= 5
            )
                return res
                    .status(429)
                    .send({ error: "You can only resend 5 times a day." });

            const verifyMsg = {
                from: `Metahkg support <support@${mgDomain}>`,
                to: email,
                subject: "Metahkg - verify your email",
                text: `Verify your email with the following link:
https://${domain}/users/verify?code=${encodeURIComponent(
                    verificationUserData.code
                )}&email=${encodeURIComponent(email)}

Alternatively, use this code at https://${domain}/verify :
${verificationUserData.code}`,
            };
            await mg.messages().send(verifyMsg);
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
