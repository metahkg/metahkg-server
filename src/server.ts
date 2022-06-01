import dotenv from "dotenv";
import { autodecrement } from "./lib/autodecrement";
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

dotenv.config();

const fastify = Fastify({
    logger: true,
    trustProxy: true,
});

/**
 * Decrease count by one in collection "viral" every 2 hours
 */
setInterval(() => {
    setTimeout(autodecrement, 7200 * 1000);
}, 7200 * 1000);
setInterval(updateVerificationCode, 3600 * 1000);

async function build() {
    await fastify.register(fastify_express);
    /**
     * Set content security policy
     */
    fastify.use((req, res, next) => {
        res.setHeader(
            "Content-Security-Policy",
            "script-src 'self' https://www.gstatic.com/recaptcha/ https://www.google.com/recaptcha/ https://sa.metahkg.org https://static.cloudflareinsights.com https://cdnjs.cloudflare.com",
        );
        next();
    });

    process.env.cors && fastify.register(cors);
    fastify.register(multipart);

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
