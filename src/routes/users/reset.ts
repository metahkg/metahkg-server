import { usersCl, verificationCl } from "../../common";
import hash from "hash.js";
import { Static, Type } from "@sinclair/typebox";
import User from "../../models/user";
import bcrypt from "bcrypt";
import { createToken } from "../../lib/auth/createtoken";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            email: Type.String({ format: "email" }),
            code: Type.String({ minLength: 30, maxLength: 30 }),
            pwd: Type.RegEx(/^[a-f0-9]{64}$/i),
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/reset",
        { schema: { body: schema } },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const { email, code, pwd } = req.body;

            const hashedEmail = hash.sha256().update(email).digest("hex");

            if (
                !(await verificationCl.findOne({
                    type: "reset",
                    email: hashedEmail,
                    code,
                }))
            )
                return res.code(401).send({
                    error: "Token incorrect, or expired, or you have not requested reset password.",
                });

            const user = (await usersCl.findOne({ email: hashedEmail })) as User;
            if (!user) return res.code(404).send({ error: "User not found." });

            await usersCl.updateOne(
                { email: hashedEmail },
                { $set: { pwd: bcrypt.hashSync(pwd, 10) } }
            );

            await verificationCl.deleteOne({
                type: "reset",
                email: hashedEmail,
                code: code,
            });

            return res.send({ token: createToken(user) });
        }
    );
    done();
};
