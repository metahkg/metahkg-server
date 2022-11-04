import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { usersCl } from "../../lib/common";

import User from "../../models/user";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.get("/starred", async (req, res) => {
        const user = req.user;
        if (!user) return res.code(401).send({ statusCode: 401, error: "Unauthorized" });

        const starred = (
            (await usersCl.findOne(
                { id: user.id },
                { projection: { starred: 1, _id: 0 } }
            )) as User | null
        )?.starred;

        return res.send(starred || []);
    });
    done();
}
