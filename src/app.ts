import dotenv from "dotenv";
import routes from "./routes";
import Fastify from "fastify";
import { client } from "./lib/common";
import { setup } from "./mongo/setupMongo";
import { agenda } from "./lib/agenda";
import refreshToken from "./plugins/refreshToken";
import updateToken from "./plugins/updateToken";
import multipart from "@fastify/multipart";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyCors from "@fastify/cors";
import { ajv } from "./lib/ajv";
import sitemap from "./sitemap";
import checkBanned from "./plugins/checkBanned";

dotenv.config();

export default async function MetahkgServer() {
    await client.connect();
    await setup();
    await agenda.start();

    [
        "removeExpiredSessions",
        "removeOldNotifications",
        "autoUnmuteUsers",
        "autoUnbanUsers",
    ].forEach(async (name) => {
        if (!(await agenda.jobs({ name })).length) {
            await agenda.every("5 minutes", name);
        }
    });

    const fastify = Fastify({
        logger: true,
        trustProxy: true,
        maxParamLength: 100,
        // 1 MB
        bodyLimit: 1024 * 1024,
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

    fastify.addHook("preHandler", checkBanned);
    fastify.addHook("preHandler", updateToken);
    fastify.addHook("preHandler", refreshToken);

    fastify.register(sitemap);
    fastify.register(routes, { prefix: "/api" });

    return fastify;
}
