import dotenv from "dotenv";
import routes from "./routes";
import Fastify from "fastify";
import { client } from "./common";
import { setup } from "./mongo/setupmongo";
import { agenda } from "./lib/agenda";
import refreshToken from "./lib/auth/refreshToken";
import updateToken from "./lib/auth/updateToken";
import multipart from "@fastify/multipart";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyCors from "@fastify/cors";
import { ajv } from "./lib/ajv";
import sitemap from "./sitemap";

dotenv.config();

export default async function MetahkgServer() {
    await client.connect();
    await setup();
    await agenda.start();

    if (!(await agenda.jobs({ name: "removeExpiredSessions" })).length) {
        await agenda.every("5 minutes", "removeExpiredSessions");
    }

    const fastify = Fastify({
        logger: true,
        trustProxy: true,
    });

    fastify.setValidatorCompiler((opt) => ajv.compile(opt.schema));

    fastify.setErrorHandler((error, _request, res) => {
        console.error(error);
        const { statusCode, message: errormsg } = error;

        if (error.validation) {
            res.code(400).send({ statusCode: 400, error: "Bad request." });
        }

        if (statusCode && statusCode < 500 && statusCode >= 400)
            try {
                res.code(statusCode).send({ statusCode, error: errormsg });
            } catch {}

        res.code(500).send({ statusCode: 500, error: "Internal Server Error." });
    });

    JSON.parse(process.env.cors) && fastify.register(fastifyCors);

    fastify.register(multipart);

    fastify.register(fastifyRateLimit, {
        global: true,
        max: 200,
        ban: 50,
        timeWindow: 1000 * 30,
    });

    fastify.register(updateToken);
    fastify.register(refreshToken);

    fastify.register(sitemap);
    fastify.register(routes, { prefix: "/api" });

    return fastify;
}
