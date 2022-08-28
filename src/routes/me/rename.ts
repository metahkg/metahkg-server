import { Static, Type } from "@sinclair/typebox";
import { usersCl } from "../../common";
import verifyUser from "../../lib/auth/verify";
import { createToken } from "../../lib/auth/createtoken";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        { name: Type.RegEx(/^\S{1,15}$/) },
        { additionalProperties: false }
    );

    fastify.post(
        "/rename",
        {schema: {body: schema}},
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const user = verifyUser(req.headers.authorization);
            if (!user) return res.code(401).send({ error: "Unauthorized." });

            const { name: newName } = req.body;

            if (newName !== user.name && (await usersCl.findOne({ name: newName })))
                return res.code(409).send({ error: "Name already taken." });

            await usersCl.updateOne({ id: user.id }, { $set: { name: newName } });

            res.send({
                success: true,
                token: createToken({ ...user, name: newName }),
            });
        }
    );
    done();
};
