import isInteger from "is-sn-integer";
import fs from "fs";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import dotenv from "dotenv";

dotenv.config();

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: () => void
) {
    fastify.get(
        "/avatars/:id",
        (req: FastifyRequest<{ Params: { id: string } }>, res) => {
            if (!isInteger(req.params.id))
                return res.status(400).send({ error: "Bad request." });

            const filename = `images/avatars/${req.params.id}.png`;

            fs.stat(filename, (err) => {
                const path = `${process.env.root}/${
                    err ? "static/images/noavatar.png" : filename
                }`;
                res.header("Content-Type", "image/png").send(fs.readFileSync(path));
            });
        }
    );
    done();
}
