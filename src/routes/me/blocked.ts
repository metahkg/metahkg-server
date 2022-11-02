import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { usersCl } from "../../lib/common";
import verifyUser from "../../lib/auth/verify";
import User, { BlockedUser } from "../../models/user";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.get("/blocked", async (req, res) => {
        const user = await verifyUser(req.headers.authorization, req.ip);
        if (!user) return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

        const blocked = ((
            await usersCl.findOne({ id: user.id }, { projection: { _id: 0, blocked: 1 } })
        )?.blocked || []) as BlockedUser[];

        const usersBlocked = (await usersCl
            .find(
                { id: { $in: blocked.map((b) => b.id) } },
                { projection: { _id: 0, id: 1, name: 1, sex: 1, role: 1 } }
            )
            .toArray()) as User[];

        res.send(
            blocked
                .map((b) => ({ ...b, ...usersBlocked.find((u) => u.id === b.id) }))
                .filter((i) => i.name && i.id)
        );
    });
    done();
}
