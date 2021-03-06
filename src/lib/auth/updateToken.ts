import verifyUser from "./verify";
import { usersCl } from "../../common";
import User from "../../models/user";
import { createToken } from "./createtoken";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    fastify.addHook("preHandler", async (req, res) => {
        const user = verifyUser(req.headers.authorization);

        if (user) {
            const userData = (await usersCl.findOne({ id: user.id })) as User;
            if (userData.name !== user.name) {
                const newToken = createToken(user);
                req.headers.authorization = `Bearer ${newToken}`;
                res.header("token", newToken);
            }
        }
    });
    done();
}
