/*
 Copyright (C) 2022-present Wong Chun Yat (wcyat)

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import dotenv from "dotenv";
import routes from "./routes";
import Fastify, { FastifyRequest } from "fastify";
import { client } from "./lib/common";
import { setupMongo } from "./scripts/mongo/setupMongo";
import { agenda } from "./lib/agenda";
import multipart from "@fastify/multipart";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyCors from "@fastify/cors";
import sitemap from "./sitemap";
import authenticate from "./plugins/authenticate";
import { jwtTokenSchema } from "./types/jwt";
import fastifyJwt from "@fastify/jwt";
import { getSessionByToken } from "./lib/sessions/getSession";
import { sha256 } from "./lib/sha256";
import { config } from "./lib/config";
import { readFileSync } from "fs";
import { generateCerts } from "./scripts/certs";
import { redis } from "./lib/redis";
import { autoMigrate } from "./scripts/autoMigrate";
import { generateHMACKey } from "./lib/hmac";
import {
    TypeBoxTypeProvider,
    TypeBoxValidatorCompiler,
} from "@fastify/type-provider-typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

dotenv.config();

export default async function MetahkgServer() {
    await client.connect();
    await autoMigrate();
    await setupMongo();
    generateCerts();
    generateHMACKey();
    await agenda.start();

    [
        "updateVerificationCode",
        "removeExpiredSessions",
        "removeOldNotifications",
        "autoUnmuteUsers",
        "autoUnbanUsers",
    ].forEach(async (name) => {
        if (!(await agenda.jobs({ name })).length) {
            await agenda.every("5 minutes", name);
        }
    });
    await agenda.every("0 0 * * 0", "weeklyTokens");

    const fastify = Fastify({
        logger: true,
        trustProxy: true,
        maxParamLength: 100,
        // 1 MB
        bodyLimit: 1024 * 1024,
    })
        .withTypeProvider<TypeBoxTypeProvider>()
        .setValidatorCompiler(TypeBoxValidatorCompiler);

    fastify.setErrorHandler((error, _request, res) => {
        fastify.log.error(error);
        const { statusCode, message: errormsg } = error;

        if (error.validation) {
            res.code(400).send({
                statusCode: 400,
                error: "Bad request",
                message: errormsg,
            });
        }

        if (statusCode && statusCode < 500 && statusCode >= 400)
            try {
                res.code(statusCode).send({ statusCode, error: errormsg });
            } catch {}

        res.code(500).send({ statusCode: 500, error: "Internal Server Error" });
    });

    config.CORS && fastify.register(fastifyCors);

    fastify.register(multipart);

    await fastify.register(fastifyRateLimit, {
        global: true,
        max: 200,
        ban: 50,
        timeWindow: 1000 * 30,
        keyGenerator: (req: FastifyRequest) => {
            return sha256(req.ip);
        },
        ...(redis && { redis }),
    });

    fastify.register(fastifyJwt, {
        secret: {
            public: readFileSync("certs/public.pem", "utf-8"),
            private: {
                key: readFileSync("certs/private.pem", "utf-8"),
                passphrase: config.KEY_PASSPHRASE,
            },
        },
        sign: {
            algorithm: "EdDSA",
            iss: config.DOMAIN,
            aud: config.DOMAIN,
            expiresIn: "7d",
        },
        verify: {
            algorithms: ["EdDSA"],
            allowedIss: [config.DOMAIN],
            allowedAud: [config.DOMAIN],
        },
        trusted: async (req, decodedToken) => {
            // validate with jwt token schema
            if (
                !decodedToken ||
                !TypeCompiler.Compile(jwtTokenSchema).Check(decodedToken)
            )
                return false;

            // check if session exists
            const session = await getSessionByToken(
                decodedToken?.id,
                req.headers.authorization?.slice(7),
                true
            );
            if (!session) return false;

            // check if user is banned
            if (session.user?.ban) return false;

            try {
                // check if all values are the same
                if (
                    !Object.entries(decodedToken).every(([key, value]: [string, any]) => {
                        const userData = session.user as { [_k: string]: any };
                        if (userData[key]) {
                            if (value === userData[key]) return true;
                            return false;
                        }
                        return true;
                    })
                ) {
                    return false;
                }
            } catch {
                return false;
            }

            // check if ip is the same (if sameIp is enabled)
            if (session.sameIp && sha256(req.ip) !== session.ip) return false;

            return true;
        },
    });

    fastify.addHook("onRequest", authenticate);

    fastify.register(sitemap);
    fastify.register(routes, { prefix: "/api" });

    return fastify;
}
