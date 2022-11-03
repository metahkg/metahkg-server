import { Static, Type } from "@sinclair/typebox";
import { randomBytes } from "crypto";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { limitCl, RecaptchaSecret, usersCl, verificationCl } from "../../lib/common";
import { mg, mgDomain, resetMsg } from "../../lib/mailgun";
import { verifyCaptcha } from "../../lib/recaptcha";
import { EmailSchema, RTokenSchema } from "../../lib/schemas";
import { sha256 } from "../../lib/sha256";
import Limit from "../../models/limit";
import User from "../../models/user";

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
        "/forgot",
        { schema: { body: schema } },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const { email, rtoken } = req.body;

            if (!verifyCaptcha(RecaptchaSecret, rtoken))
                return res
                    .code(429)
                    .send({ statusCode: 429, error: "Recaptcha token invalid." });

            const hashedEmail = sha256(email);

            const userData = (await usersCl.findOne({ email: hashedEmail })) as User;
            if (!userData)
                return res.code(404).send({ statusCode: 404, error: "User not found." });

            if (
                (await limitCl.countDocuments({ type: "reset", email: hashedEmail })) >= 2
            )
                return res.code(429).send({
                    statusCode: 429,
                    error: "You can only request reset password 2 times a day.",
                });

            const verificationCode = randomBytes(15).toString("hex");

            await mg.messages.create(
                mgDomain,
                resetMsg({ email, code: verificationCode })
            );

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

            res.send({ success: true });
        }
    );
    done();
};
