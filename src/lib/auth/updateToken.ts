import verifyUser from "./verify";
import { usersCl } from "../../common";
import User from "../../models/user";
import { createToken } from "./createtoken";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { updateSessionByToken } from "../sessions/updateSession";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    fastify.addHook("preHandler", async (req, res) => {
        const user = await verifyUser(req.headers.authorization, req.ip);

        if (user) {
            const userData = (await usersCl.findOne({ id: user.id })) as User;
            if (userData.name !== user.name || userData.sex !== user.sex) {
                const newToken = createToken(user);

                await updateSessionByToken(
                    user.id,
                    req.headers.authorization?.slice(7),
                    newToken
                );

                req.headers.authorization = `Bearer ${newToken}`;
                res.header("token", newToken);
            }
        }
    });
    done();
}
