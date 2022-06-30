import { secret, verificationCl, limitCl } from "../../common";
import { verifyCaptcha } from "../../lib/recaptcha";
import { Static, Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import Limit from "../../models/limit";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { mg, mgDomain, verifyMsg } from "../../lib/mailgun";

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
            if (!ajv.validate(schema, req.body))
                return res.code(400).send({ error: "Bad request." });

            const { email, rtoken } = req.body;

            if (!(await verifyCaptcha(secret, rtoken)))
                return res.code(400).send({ error: "recaptcha token invalid." });

            const verificationUserData = await verificationCl.findOne({
                email,
            });
            if (!verificationUserData) {
                return res.code(404).send({
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

            await mg.messages.create(
                mgDomain,
                verifyMsg({ email, code: verificationUserData.code })
            );

            await limitCl.insertOne({
                type: "resend",
                email,
                createdAt: new Date(),
            } as Limit);
            res.send({ response: "ok" });
        }
    );
    done();
};
