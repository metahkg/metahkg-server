import isInteger from "is-sn-integer";
import fs from "fs";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default function (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    fastify.get(
        "/avatars/:id",
        async (req: FastifyRequest<{ Params: { id: string } }>, res) => {
            if (!isInteger(req.params.id))
                return res.status(400).send({ error: "Bad request." });

            const filename = `images/avatars/${req.params.id}.png`;
            fs.stat(filename, async (err) => {
                const stream = await fs.createReadStream(`${process.env.root}/
                    ${err ? "static/images/noavatar.png" : filename}
                `);
                res.header("Content-Type", "image/png");
                res.type("image/png").send(stream);
            });
        }
    );
    done();
}
