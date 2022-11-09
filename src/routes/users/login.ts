import dotenv from "dotenv";
import { usersCl, verificationCl } from "../../lib/common";
import bcrypt from "bcrypt";
import { Static, Type } from "@sinclair/typebox";
import { createToken } from "../../lib/auth/createToken";
import User from "../../models/user";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { createSession } from "../../lib/sessions/createSession";
import { EmailSchema, PasswordSchema, UserNameSchema } from "../../lib/schemas";
import { sha256 } from "../../lib/sha256";

dotenv.config();

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            name: Type.Union([UserNameSchema, EmailSchema]),
            // check if password is a sha256 hash
            password: PasswordSchema,
            sameIp: Type.Optional(Type.Boolean()),
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/login",
        {
            preHandler: fastify.rateLimit({
                max: 5,
                ban: 5,
                timeWindow: 1000 * 60 * 5,
            }),
            schema: { body: schema },
        },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const { name, password, sameIp } = req.body;

            const user = (await usersCl.findOne({
                $or: [{ name }, { email: sha256(name) }],
            })) as User;

            if (!user) {
                const verifyUser = await verificationCl.findOne({
                    $or: [{ name }, { email: sha256(name) }],
                });

                if (verifyUser && (await bcrypt.compare(password, verifyUser.password)))
                    return res
                        .code(409)
                        .send({ statusCode: 409, error: "Please verify your email." });

                return res.code(401).send({ statusCode: 401, error: "Login failed." });
            }

            const pwdMatch = await bcrypt.compare(password, user.password);
            if (!pwdMatch)
                return res.code(401).send({ statusCode: 401, error: "Login failed." });

            if (user.ban) {
                return res.code(403).send({
                    statusCode: 403,
                    error: "Forbidden. You are banned by an admin.",
                    ...(user.ban.exp && { exp: user.ban.exp }),
                });
            }

            const token = createToken(user);

            await createSession(
                user.id,
                token,
                req.headers["user-agent"],
                req.ip,
                sameIp
            );

            res.send({ token });
        }
    );
    done();
};
