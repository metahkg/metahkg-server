import { usersCl, verificationCl } from "../../lib/common";
import hash from "hash.js";
import { Static, Type } from "@sinclair/typebox";
import User from "../../models/user";
import bcrypt from "bcrypt";
import { createToken } from "../../lib/auth/createtoken";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { createSession } from "../../lib/sessions/createSession";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            email: Type.String({ format: "email" }),
            code: Type.String({ minLength: 30, maxLength: 30 }),
            password: Type.RegEx(/^[a-f0-9]{64}$/i),
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/reset",
        { schema: { body: schema } },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const { email, code, password } = req.body;

            const hashedEmail = hash.sha256().update(email).digest("hex");

            if (
                !(await verificationCl.findOne({
                    type: "reset",
                    email: hashedEmail,
                    code,
                }))
            )
                return res.code(401).send({
                    statusCode: 401,
                    error: "Token incorrect, or expired, or you have not requested reset password.",
                });

            const user = (await usersCl.findOne({ email: hashedEmail })) as User;
            if (!user)
                return res.code(404).send({ statusCode: 404, error: "User not found." });

            await usersCl.updateOne(
                { email: hashedEmail },
                { $set: { password: bcrypt.hashSync(password, 10) } }
            );

            await verificationCl.deleteOne({
                type: "reset",
                email: hashedEmail,
                code: code,
            });

            const token = createToken(user);

            await createSession(user.id, token, req.headers["user-agent"], req.ip);

            return res.send({ token });
        }
    );
    done();
};
