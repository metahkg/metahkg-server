import { Static, Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import verifyUser from "../../lib/auth/verify";
import { usersCl } from "../../common";
import User from "../../models/user";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object({
        userId: Type.Integer({ minimum: 1 }),
    });

    fastify.post(
        "/block",
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const { userId } = req.body;
            const user = verifyUser(req.headers.authorization);

            if (!ajv.validate(schema, req.body) || !user)
                return res.code(400).send({ error: "Bad request." });

            try {
                const blocked = (
                    (await usersCl.findOneAndUpdate(
                        { id: user.id },
                        [{ $push: { blocked: userId } }],
                        { returnDocument: "after" }
                    )) as unknown as User
                )?.blocked;
                return res.send({ blocked });
            } catch {
                return res.code(500).send({ error: "Internal server error." });
            }
        }
    );
    done();
};
