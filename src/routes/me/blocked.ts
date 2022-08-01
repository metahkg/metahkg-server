import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { usersCl } from "../../common";
import verifyUser from "../../lib/auth/verify";
import User from "../../models/user";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.get("/blocked", async (req, res) => {
        const user = verifyUser(req.headers.authorization);
        if (!user) return res.code(401).send({ error: "Unauthorized." });

        const blocked = ((
            await usersCl.findOne(
                { id: user.id },
                { projection: { _id: 0, blocked: 1 } }
            )
        )?.blocked || []) as number[];

        console.log(blocked)

        const blocklist = (await usersCl
            .find({
                id: { $in: blocked },
            })
            .project({ _id: 0, id: 1, name: 1, sex: 1, role: 1 })
            .toArray()) as User[];

        res.send(
            blocked.map((id) => blocklist.find((i) => i.id === id)).filter((i) => i)
        );
    });
    done();
}
