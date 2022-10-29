import fs from "fs";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import dotenv from "dotenv";
import { Static, Type } from "@sinclair/typebox";
import regex from "../../../lib/regex";

dotenv.config();

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: () => void
) {
    const paramsSchema = Type.Object({ id: Type.RegEx(regex.integer) });

    fastify.get(
        "/avatar",
        { schema: { params: paramsSchema } },
        (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const filename = `images/avatars/${req.params.id}.png`;

            fs.stat(filename, (err) => {
                if (err)
                    return res
                        .code(404)
                        .send({ statusCode: 404, error: "User or avatar not found." });

                const path = `${process.env.root}/${filename}`;
                res.header("Content-Type", "image/png").send(fs.readFileSync(path));
            });
        }
    );
    done();
}
