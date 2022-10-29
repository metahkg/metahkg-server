import { RecaptchaSecret, verificationCl, limitCl } from "../../common";
import { verifyCaptcha } from "../../lib/recaptcha";
import { Static, Type } from "@sinclair/typebox";
import Limit from "../../models/limit";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { mg, mgDomain, verifyMsg } from "../../lib/mailgun";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        { email: Type.String({ format: "email" }), rtoken: Type.String() },
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
