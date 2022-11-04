import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { usersCl } from "../../lib/common";
import User, { FollowedUser } from "../../models/user";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.get("/following", async (req, res) => {
        const user = req.user;
        if (!user) return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

        const following = ((
            await usersCl.findOne({ id: user.id }, { projection: { _id: 0, following: 1 } })
        )?.following || []) as FollowedUser[];

        const usersFollowed = (await usersCl
            .find(
                { id: { $in: following.map((b) => b.id) } },
                { projection: { _id: 0, id: 1, name: 1, sex: 1, role: 1 } }
            )
            .toArray()) as User[];

        res.send(
            following
                .map((f) => ({ ...f, ...usersFollowed.find((u) => u.id === f.id) }))
                .filter((i) => i.name && i.id)
        );
    });
    done();
}
