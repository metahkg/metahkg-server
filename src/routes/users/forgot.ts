import { Static, Type } from "@sinclair/typebox";
import { randomBytes } from "crypto";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { limitCl, usersCl, verificationCl } from "../../common";
import { ajv } from "../../lib/ajv";
import { mg, mgDomain, resetMsg } from "../../lib/mailgun";
import Limit from "../../models/limit";
import User from "../../models/user";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        { email: Type.String({ format: "email" }) },
        { additionalProperties: false }
    );

    fastify.post(
        "/forgot",
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            if (!ajv.validate(schema, req.body))
                return res.code(400).send({ error: "Bad request." });

            const { email } = req.body;

            const hashedEmail = hash.sha256().update(email).digest("hex");

            const userData = (await usersCl.findOne({ email: hashedEmail })) as User;
            if (!userData) return res.code(404).send({ error: "User not found." });

            if (
                (await limitCl.countDocuments({ type: "reset", email: hashedEmail })) >= 2
            )
                return res.code(429).send({
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

            res.send({ response: "ok" });
        }
    );
    done();
};
