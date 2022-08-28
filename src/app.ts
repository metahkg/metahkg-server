import dotenv from "dotenv";
import routes from "./routes";
import Fastify from "fastify";
import refreshToken from "./lib/auth/refreshToken";
import updateToken from "./lib/auth/updateToken";
import multipart from "@fastify/multipart";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyCors from "@fastify/cors";
import { ajv } from "./lib/ajv";
import sitemap from "./sitemap";

dotenv.config();

export default function MetahkgServer() {
    const fastify = Fastify({
        logger: true,
        trustProxy: true,
    });

    fastify.setValidatorCompiler((opt) => ajv.compile(opt.schema));
    fastify.setErrorHandler((error, _request, reply) => {
        console.error(error);
        const { statusCode, message: errormsg } = error;
        try {
            reply.code(statusCode).send({ statusCode, error: errormsg });
        } catch (err) {
            reply.code(502).send({ statusCode });
        }
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
