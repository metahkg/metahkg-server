import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { usersCl } from "../../lib/common";
import verifyUser from "../../lib/auth/verify";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.get("/starred", async (req, res) => {
        const user = await verifyUser(req.headers.authorization, req.ip);
        if (!user) return res.code(401).send({ statusCode: 401, error: "Unauthorized" });

        const starred = (
            await usersCl.findOne({ id: user.id }, { projection: { starred: 1, _id: 0 } })
        )?.starred;

        return res.send(starred || []);
    });
    done();
}
