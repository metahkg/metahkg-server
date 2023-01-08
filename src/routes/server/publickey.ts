import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { readFileSync } from "fs";

export default function (fastify: FastifyInstance, _opts: FastifyPluginOptions, done: (err?: Error) => void) {
    fastify.get("/publickey", (_req, res) => {
        res.type("text/plain").send(readFileSync("certs/public.pem"))
    })
    done();
}
