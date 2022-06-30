import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { usersCl } from "../../common";
import verifyUser from "../../lib/auth/verify";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.get("/blocklist", async (req, res) => {
        const user = verifyUser(req.headers.authorization);
        if (!user) return res.code(404).send({ error: "User not found." });

        const blocklist = (await usersCl.findOne(
            { user: user.id },
            { projection: { _id: 0, blocked: 1 } }
        )).blocked;

        res.send(blocklist);
    });
    done();
}
