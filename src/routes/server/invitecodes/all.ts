import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { inviteCl } from "../../../lib/common";
import { Invite } from "../../../models/invite";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    fastify.get("/", async (_req, res) => {
        const invites = (await inviteCl.find().project({ _id: 0 }).toArray()) as Invite[];
        return res.send(invites);
    });
    done();
}
