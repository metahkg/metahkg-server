//verify email
/*Syntax: POST /api/verify
  {
    email (email used in sign up): string,
    code (verification code sent to user's email address): string
  }
*/
import dotenv from "dotenv";
import { usersCl, verificationCl } from "../../common";
import hash from "hash.js";
import { Static, Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import { createToken } from "../../lib/auth/createtoken";
import User from "../../models/user";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

dotenv.config();

export default (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            email: Type.String({ format: "email" }),
            code: Type.String(),
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/verify",
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            if (!ajv.validate(schema, req.body))
                return res.status(400).send({ error: "Bad request." });

            if (req.body.code?.length !== 30)
                return res.status(400).send({ error: "Code must be of 30 digits." });

            const verificationData = await verificationCl.findOne({
                type: "register",
                email: req.body.email,
                code: req.body.code,
            });

            if (verificationData?.code !== req.body.code)
                return res.status(401).send({
                    error: "Code incorrect or email not found, your verfication code might have expired.",
                });

            const newUserId =
                (await usersCl.find().sort({ id: -1 }).limit(1).toArray())[0]?.id + 1 ||
                1;

            const newUser: User = {
                name: verificationData?.name,
                id: newUserId,
                email: hash.sha256().update(verificationData?.email).digest("hex"),
                pwd: verificationData?.pwd,
                role: "user",
                createdAt: new Date(),
                sex: verificationData?.sex,
            };

            const token = createToken(
                newUser.id,
                newUser.name,
                newUser.sex,
                newUser.role
            );
            await usersCl.insertOne(newUser);

            res.send({
                token,
            });
            await verificationCl.deleteOne({ type: "register", email: req.body.email });
        }
    );
    done();
};
