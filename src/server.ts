import dotenv from "dotenv";
import router from "./router";
import updateVerificationCode from "./lib/updateVerificationCode";
import { client } from "./common";
import { setup } from "./mongo/setupmongo";
import cors from "@fastify/cors";
import Fastify from "fastify";
import refreshToken from "./lib/auth/refreshToken";
import fastify_express from "@fastify/express";
import updateToken from "./lib/auth/updateToken";
import multipart from "@fastify/multipart";
import expressRoutes from "./router/expressRoutes";
import fastifyRateLimit from "@fastify/rate-limit";

dotenv.config();

const fastify = Fastify({
    logger: true,
    trustProxy: true,
});

setInterval(updateVerificationCode, 3600 * 1000);

async function build() {
    await fastify.register(fastify_express);
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

    process.env.cors && fastify.register(cors);
    fastify.register(multipart);

    fastify.register(fastifyRateLimit, {
        max: 200,
        ban: 50,
        timeWindow: 1000 * 30,
    });

    fastify.register(updateToken);
    fastify.register(refreshToken);

    return fastify;
}

(async () => {
    await client.connect();
    await setup();
    const fastify = await build();
    /**
     * The port can be modified in .env
     */

    fastify.register(router, { prefix: "/api" });
    fastify.use(expressRoutes);

    fastify.listen({ port: Number(process.env.port) || 3200, host: "0.0.0.0" }, (err) => {
        if (err) console.log(err);
        console.log(`listening at port ${process.env.port || 3200}`);
    });
})();
