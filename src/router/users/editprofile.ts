import { Router } from "express";
import body_parser from "body-parser";
import { Static, Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import { usersCl } from "../../common";
import verifyUser from "../../lib/auth/verify";
import { createToken } from "../../lib/auth/createtoken";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            name: Type.Optional(Type.String()),
            sex: Type.Optional(Type.Union([Type.Literal("M"), Type.Literal("F")])),
        },
        { additionalProperties: false }
    );

    fastify.put(
        "/editprofile",
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            if (!ajv.validate(schema, req.body) || !Object.keys(req.body).length)
                return res.status(400).send({ error: "Bad request." });

            const user = verifyUser(req.headers.authorization);
            if (!user) return res.status(404).send({ error: "User not found." });

            if (
                req.body.name !== user.name &&
                (await usersCl.findOne({ name: req.body.name }))
            )
                return res.status(409).send({ error: "Name already taken." });

            await usersCl.updateOne({ id: user.id }, { $set: req.body });

            res.send({
                response: "ok",
                token: createToken(user.id, req.body.name, req.body.sex, user.role),
            });
        }
    );
    done();
};
