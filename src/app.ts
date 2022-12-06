/*
 Copyright (C) 2022-present Metahkg Contributors

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
import { client, domain } from "./lib/common";
import { setup } from "./mongo/setupMongo";
import { agenda } from "./lib/agenda";
import refreshToken from "./plugins/refreshToken";
import multipart from "@fastify/multipart";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyCors from "@fastify/cors";
import { ajv } from "./lib/ajv";
import sitemap from "./sitemap";
import checkBanned from "./plugins/checkBanned";
import authenticate from "./plugins/authenticate";
import { jwtTokenSchema } from "./types/jwt";
import fastifyJwt from "@fastify/jwt";
import { getSessionByToken } from "./lib/sessions/getSession";
import { sha256 } from "./lib/sha256";

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

    await fastify.register(fastifyRateLimit, {
        global: true,
        max: 200,
        ban: 50,
        timeWindow: 1000 * 30,
        keyGenerator: (req: FastifyRequest) => {
            return sha256(req.ip);
        },
    });

    fastify.register(fastifyJwt, {
        secret: process.env.jwtKey || "",
        sign: { algorithm: "HS256", iss: domain, aud: domain, expiresIn: "7d" },
        verify: { algorithms: ["HS256"], allowedIss: [domain], allowedAud: [domain] },
        trusted: async (req, decodedToken) => {
            if (!decodedToken || !ajv.validate(jwtTokenSchema, decodedToken))
                return false;

            const session = await getSessionByToken(
                decodedToken.id,
                req.headers.authorization?.slice(7)
            );
            if (!session) return false;

            if (session.sameIp && sha256(req.ip) !== session.ip) return false;

            return true;
        },
    });

    fastify.addHook("onRequest", authenticate);
    fastify.addHook("onRequest", refreshToken);
    // re-verify after updateToken and refreshToken
    fastify.addHook("onRequest", authenticate);
    fastify.addHook("onRequest", checkBanned);

    fastify.register(sitemap);
    fastify.register(routes, { prefix: "/api" });

    return fastify;
}
