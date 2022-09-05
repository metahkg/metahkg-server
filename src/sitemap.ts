import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { categoryCl, domain, threadCl, usersCl } from "./common";
import Category from "./models/category";
import Thread from "./models/thread";
import User from "./models/user";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.get("/sitemap.xml", async (req, res) => {
        res.type("application/xml");
        res.send(/*xml*/ `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            ${["", "create", "search", "recall"].map(
                (path) => /*xml*/ `<url>
                    <loc>https://${domain}/${path}</loc>
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
                    <loc>https://${domain}/category/${category.id}</loc>
                    <changefreq>daily</changefreq>
                    <priority>1.0</priority>
                </url>`
            )}
            ${["login", "register", "verify", "resend"].map(
                (path) => /*xml*/ `<url>
                    <loc>https://${domain}/users/${path}</loc>
                    <priority>1.0</priority>
                </url>`
            )}
            ${(
                (await threadCl
                    .find()
                    .sort({ id: 1 })
                    .project({ _id: 0, id: 1, lastModified: 1 })
                    .toArray()) as Thread[]
            )
                .map(
                    (thread) =>
                        !("removed" in thread) &&
                        /*xml*/ `<url>
                    <loc>https://${domain}/thread/${thread.id}</loc>
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
                    <loc>https://${domain}/profile/${user.id}</loc>
                    <changefreq>daily</changefreq>
                    <priority>0.8</priority>
                </url>`
            )}
        </urlset>`);
    });
    done();
}
