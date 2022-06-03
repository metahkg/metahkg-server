import verifyUser from "./verify";
import { usersCl } from "../../common";
import User from "../../models/user";
import { createToken } from "./createtoken";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default function (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void,
) {
    fastify.use(async (req, res, next) => {
        const user = verifyUser(req.headers.authorization);

        if (user) {
            const userData = (await usersCl.findOne({ id: user.id })) as User;
            if (userData.name !== user.name || userData.sex !== user.sex) {
                const newToken = createToken(
                    userData.id,
                    userData.name,
                    userData.sex,
                    userData.role,
                );
                req.headers.authorization = `Bearer ${newToken}`;
                res.setHeader("token", newToken);
            }
        }
        next();
    });
    done();
}
