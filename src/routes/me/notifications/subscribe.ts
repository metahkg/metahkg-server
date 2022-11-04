import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginOptions, FastifyInstance, FastifyRequest } from "fastify";

import { subscribeByToken } from "../../../lib/notifications/subscribe";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const schema = Type.Object(
        {
            endpoint: Type.String({ format: "uri", maxLength: 1000 }),
            keys: Type.Object(
                {
                    auth: Type.String({ minLength: 22, maxLength: 22 }),
                    p256dh: Type.String({ minLength: 87, maxLength: 87 }),
                },
                { additionalProperties: false }
            ),
        },
        { additionalProperties: false }
    );
    fastify.post(
        "/subscribe",
        { schema: { body: schema } },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const user = req.user;
            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

            await subscribeByToken(
                user.id,
                req.headers.authorization?.slice(7),
                req.body
            );

            return res.send({ success: true });
        }
    );
    done();
}
