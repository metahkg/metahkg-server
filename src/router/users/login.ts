import dotenv from "dotenv";
import express from "express";
import body_parser from "body-parser";
import { usersCl, verificationCl } from "../../common";
import bcrypt from "bcrypt";
import { Static, Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import { createToken } from "../../lib/auth/createtoken";
import User from "../../models/user";
import hash from "hash.js";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import fastifyRateLimit from "@fastify/rate-limit";

dotenv.config();

export default (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            name: Type.Union([
                Type.RegEx(/^\S{1,15}$/),
                Type.String({ format: "email" }),
            ]),
            // check if password is a sha256 hash
            pwd: Type.RegEx(/^[a-f0-9]{64}$/i),
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/login",
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const { name, pwd } = req.body;

            if (!ajv.validate(schema, req.body))
                return res.code(400).send({ error: "Bad request." });

            const user = (await usersCl.findOne({
                $or: [{ name }, { email: hash.sha256().update(name).digest("hex") }],
            })) as User;

            if (!user) {
                const verifyUser = await verificationCl.findOne({
                    $or: [{ name }, { email: hash.sha256().update(name).digest("hex") }],
                });

                if (verifyUser && (await bcrypt.compare(pwd, verifyUser.pwd)))
                    return res.code(409).send({ error: "Please verify your email." });

                return res.code(401).send({ error: "Login failed." });
            }

            const pwdMatch = await bcrypt.compare(pwd, user.pwd);
            if (!pwdMatch) return res.code(401).send({ error: "Login failed." });

            res.send({
                token: createToken(user.id, user.name, user.sex, user.role),
            });
        }
    );
    done();
};
