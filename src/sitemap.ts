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

import { RateLimitOptions } from "@fastify/rate-limit";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { categoryCl, threadCl, usersCl } from "./lib/common";
import { config } from "./lib/config";
import Category from "./models/category";
import Thread from "./models/thread";
import User from "./models/user";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.get(
        "/sitemap.xml",
        {
            config: {
                rateLimit: <RateLimitOptions>{
                    max: 10,
                    ban: 5,
                    timeWindow: 1000 * 60,
                },
            },
        },
        async (req, res) => {
            res.type("application/xml");
            res.send(/*xml*/ `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            ${["", "create", "search", "recall"].map(
                (path) => /*xml*/ `<url>
                    <loc>https://${config.DOMAIN}/${path}</loc>
                    <changefreq>daily</changefreq>
                    <priority>1.0</priority>
                </url>`
            )}
            ${(
                (await categoryCl
                    .find()
                    .sort({ id: 1 })
                    .project({ _id: 0, id: 1 })
                    .toArray()) as Category[]
            ).map(
                (category) => /*xml*/ `<url>
                    <loc>https://${config.DOMAIN}/category/${category.id}</loc>
                    <changefreq>daily</changefreq>
                    <priority>1.0</priority>
                </url>`
            )}
            ${["login", "register", "verify", "resend"].map(
                (path) => /*xml*/ `<url>
                    <loc>https://${config.DOMAIN}/users/${path}</loc>
                    <priority>1.0</priority>
                </url>`
            )}
            ${(
                (await threadCl
                    .find({ removed: { $exists: false } })
                    .sort({ id: 1 })
                    .project({ _id: 0, id: 1, lastModified: 1 })
                    .toArray()) as Thread[]
            )
                .map(
                    (thread) =>
                        !("removed" in thread) &&
                        /*xml*/ `<url>
                    <loc>https://${config.DOMAIN}/thread/${thread.id}</loc>
                    <changefreq>daily</changefreq>
                    <lastmod>${thread.lastModified.toISOString()}</lastmod>
                    <priority>0.8</priority>
                </url>`
                )
                .filter((x) => x)}
            ${(
                (await usersCl
                    .find()
                    .sort({ id: 1 })
                    .project({ _id: 0, id: 1 })
                    .toArray()) as User[]
            ).map(
                (user) => /*xml*/ `<url>
                    <loc>https://${config.DOMAIN}/profile/${user.id}</loc>
                    <changefreq>daily</changefreq>
                    <priority>0.8</priority>
                </url>`
            )}
        </urlset>`);
        }
    );
    done();
}
