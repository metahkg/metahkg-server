import { Static, Type } from "@sinclair/typebox";
import { usersCl } from "../../../../common";
import verifyUser from "../../../../lib/auth/verify";
import { createToken } from "../../../../lib/auth/createtoken";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../../lib/regex";
import EmailValidator from "email-validator";
import { userSex } from "../../../../types/user";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            name: Type.Optional(Type.RegEx(/^\S{1,15}$/)),
            sex: Type.Optional(Type.Union(["M", "F"].map((x) => Type.Literal(x)))),
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

            const user = verifyUser(req.headers.authorization);
            if (!user || user?.id !== id)
                return res.code(403).send({ error: "Forbidden." });

            const { name, sex } = req.body as { name?: string; sex?: userSex };

            if (name && name !== user.name && (await usersCl.findOne({ name })))
                return res.code(409).send({ error: "Name already taken." });

            if (EmailValidator.validate(name))
                return res.code(400).send({ error: "Name must not be a email." });

            await usersCl.updateOne({ id: user.id }, { $set: req.body });

            const token = createToken({
                ...user,
                ...(name && { name }),
                ...(sex && { sex }),
            });

            res.header("token", token).send({
                success: true,
                token,
            });
        }
    );
    done();
};
