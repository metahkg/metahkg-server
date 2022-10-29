import dotenv from "dotenv";
import { usersCl, verificationCl } from "../../common";
import bcrypt from "bcrypt";
import { Static, Type } from "@sinclair/typebox";
import { createToken } from "../../lib/auth/createtoken";
import User from "../../models/user";
import hash from "hash.js";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { createSession } from "../../lib/sessions/createSession";

dotenv.config();

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            name: Type.Union([
                Type.RegEx(/^\S{1,15}$/),
                Type.String({ format: "email" }),
            ]),
            // check if password is a sha256 hash
            password: Type.RegEx(/^[a-f0-9]{64}$/i),
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
                $or: [{ name }, { email: hash.sha256().update(name).digest("hex") }],
            })) as User;

            if (!user) {
                const verifyUser = await verificationCl.findOne({
                    $or: [{ name }, { email: hash.sha256().update(name).digest("hex") }],
                });

                if (verifyUser && (await bcrypt.compare(password, verifyUser.pwd)))
                    return res
                        .code(409)
                        .send({ statusCode: 409, error: "Please verify your email." });

                return res.code(401).send({ statusCode: 401, error: "Login failed." });
            }

            const pwdMatch = await bcrypt.compare(password, user.password);
            if (!pwdMatch)
                return res.code(401).send({ statusCode: 401, error: "Login failed." });

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
