import isInteger from "is-sn-integer";
import fs from "fs";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default function (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    fastify.get("/:id", async (req: FastifyRequest<{ Params: { id: string } }>, res) => {
        if (!isInteger(req.params.id))
            return res.status(400).send({ error: "Bad request." });

        const filename = `images/avatars/${req.params.id}.png`;
        res.header("Content-Type", "image/png");
        fs.stat(filename, (err) => {
            if (!err) res.send(fs.readFileSync(`${process.env.root}/${filename}`));
            else
                res.send(
                    fs.readFileSync(`${process.env.root}/static/images/noavatar.png`)
                );
        });
    });
    done();
}
