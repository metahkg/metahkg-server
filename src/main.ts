import dotenv from "dotenv";
import router from "./router";
import updateVerificationCode from "./lib/updateVerificationCode";
import { client } from "./common";
import { setup } from "./mongo/setupmongo";
import Fastify from "fastify";
import refreshToken from "./lib/auth/refreshToken";
import updateToken from "./lib/auth/updateToken";
import multipart from "@fastify/multipart";
import fastifyRateLimit from "@fastify/rate-limit";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import fastifyCors from "@fastify/cors";

dotenv.config();

setInterval(updateVerificationCode, 3600 * 1000);

async function build() {
    const fastify = Fastify({
        logger: true,
        trustProxy: true,
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

    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter(fastify)
    );

    app.register(router, { prefix: "/api" });

    return app;
}

(async () => {
    await client.connect();
    await setup();

    const app = await build();

    /**
     * The port can be modified in .env
     */
    await app.listen(Number(process.env.port) || 3200, "0.0.0.0", (err: Error) => {
        if (err) console.log(err);
        console.log(`listening at port ${process.env.port || 3200}`);
    });
})();
