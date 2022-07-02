import dotenv from "dotenv";
import routes from "./routes";
import Fastify from "fastify";
import refreshToken from "./lib/auth/refreshToken";
import updateToken from "./lib/auth/updateToken";
import multipart from "@fastify/multipart";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyCors from "@fastify/cors";
import { ajv } from "./lib/ajv";

dotenv.config();

export default async function MetahkgServer() {
    const fastify = Fastify({
        logger: true,
        trustProxy: true,
    });

    fastify.setValidatorCompiler((opt) => ajv.compile(opt.schema));
    fastify.setErrorHandler((error, _request, reply) => {
        console.error(error);
        reply.code(500).send({ statusCode: 500, error: "Internal server error." });
    });

    process.env.cors && fastify.register(fastifyCors);

    /**
     * Set content security policy
     */
    fastify.addHook("preHandler", (_req, res, done) => {
        res.header(
            "Content-Security-Policy",
            // eslint-disable-next-line max-len
            "script-src 'self' https://www.gstatic.com/recaptcha/ https://www.google.com/recaptcha/ https://sa.metahkg.org https://static.cloudflareinsights.com https://cdnjs.cloudflare.com"
        );
        done();
    });

    fastify.register(multipart);

    fastify.register(fastifyRateLimit, {
        global: true,
        max: 200,
        ban: 50,
        timeWindow: 1000 * 30,
    });

    fastify.register(updateToken);
    fastify.register(refreshToken);

    fastify.register(routes, { prefix: "/api" });

    return fastify;
}
