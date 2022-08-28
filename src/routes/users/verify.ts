import dotenv from "dotenv";
import { usersCl, verificationCl } from "../../common";
import hash from "hash.js";
import { Static, Type } from "@sinclair/typebox";
import { createToken } from "../../lib/auth/createtoken";
import User from "../../models/user";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { agenda } from "../../lib/agenda";

dotenv.config();

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            email: Type.String({ format: "email" }),
            code: Type.String({ maxLength: 30, minLength: 30 }),
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/verify",
        { schema: { body: schema } },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const { email, code } = req.body;

            const verificationData = await verificationCl.findOne({
                type: "register",
                email,
                code,
            });

            if (!verificationData)
                return res
                    .code(401)
                    .send({ error: "Code incorrect or expired, or email not found." });

            const { name, pwd, sex } = verificationData;

            const newUserId =
                (await usersCl.find().sort({ id: -1 }).limit(1).toArray())[0]?.id + 1 ||
                1;

            const newUser: User = {
                name,
                id: newUserId,
                email: hash.sha256().update(email).digest("hex"),
                pwd,
                role: "user",
                createdAt: new Date(),
                sex,
            };

            await usersCl.insertOne(newUser);
            await verificationCl.deleteOne({ type: "register", email });

            await agenda.cancel({ name: "updateVerificationCode", data: { email } });

            const token = createToken(newUser);

            res.send({ token });
        }
    );
    done();
};
