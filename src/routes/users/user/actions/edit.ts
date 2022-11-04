import { Static, Type } from "@sinclair/typebox";
import { usersCl } from "../../../../lib/common";

import { createToken } from "../../../../lib/auth/createToken";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../../lib/regex";
import EmailValidator from "email-validator";
import { userSex } from "../../../../models/user";
import { updateSessionByToken } from "../../../../lib/sessions/updateSession";
import { SexSchema, UserNameSchema } from "../../../../lib/schemas";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            name: Type.Optional(UserNameSchema),
            sex: Type.Optional(SexSchema),
        },
        { additionalProperties: false, minProperties: 1 }
    );

    const paramsSchema = Type.Object({ id: Type.RegEx(regex.integer) });

    fastify.patch(
        "/",
        { schema: { body: schema, params: paramsSchema } },
        async (
            req: FastifyRequest<{
                Body: Static<typeof schema>;
                Params: Static<typeof paramsSchema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id);

            const user = req.user;
            if (!user || user?.id !== id)
                return res.code(403).send({ statusCode: 403, error: "Forbidden." });

            const { name, sex } = req.body as { name?: string; sex?: userSex };

            if (name && name !== user.name && (await usersCl.findOne({ name })))
                return res
                    .code(409)
                    .send({ statusCode: 409, error: "Name already taken." });

            if (EmailValidator.validate(name))
                return res
                    .code(400)
                    .send({ statusCode: 400, error: "Name must not be a email." });

            if (
                !(await usersCl.updateOne({ id: user.id }, { $set: req.body }))
                    .modifiedCount
            )
                return res
                    .code(500)
                    .send({ statusCode: 500, error: "An unknown error occured." });

            const newToken = createToken(fastify.jwt, {
                ...user,
                ...(name && { name }),
                ...(sex && { sex }),
            });

            await updateSessionByToken(
                user.id,
                req.headers.authorization.slice(7),
                newToken
            );

            res.header("token", newToken).send({
                token: newToken,
            });
        }
    );
    done();
};
