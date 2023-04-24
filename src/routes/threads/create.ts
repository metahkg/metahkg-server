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

import { categoryCl, linksCl, threadCl, usersCl } from "../../lib/common";
import findImages from "../../lib/findimages";
import { Static, Type } from "@sinclair/typebox";
import { generate } from "generate-password";
import sanitize from "../../lib/sanitize";
import User from "../../models/user";
import Thread, { publicUserType } from "../../models/thread";
import { htmlToText } from "html-to-text";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import checkMuted from "../../plugins/checkMuted";
import {
    CommentSchema,
    IntegerSchema,
    CaptchaTokenSchema,
    TitleSchema,
    VisibilitySchema,
} from "../../lib/schemas";
import { sendNotification } from "../../lib/notifications/sendNotification";
import { sha256 } from "../../lib/sha256";
import { Link } from "../../models/link";
import Category from "../../models/category";
import { RateLimitOptions } from "@fastify/rate-limit";
import RequireCAPTCHA from "../../plugins/requireCaptcha";
import { config } from "../../lib/config";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            comment: CommentSchema,
            captchaToken: CaptchaTokenSchema,
            title: TitleSchema,
            category: IntegerSchema,
            visibility: Type.Optional(VisibilitySchema),
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/",
        {
            preHandler: [RequireCAPTCHA, checkMuted],
            config: {
                rateLimit: <RateLimitOptions>{
                    keyGenerator: (req: FastifyRequest) => {
                        return req.user?.id ? `user${req.user.id}` : sha256(req.ip);
                    },
                    max: 30,
                    ban: 5,
                    timeWindow: 1000 * 60 * 60,
                },
            },
            schema: { body: schema },
        },
        async (
            req: FastifyRequest<{
                Body: Static<typeof schema>;
                headers: { authorization?: string };
            }>,
            res
        ) => {
            const comment = sanitize(req.body.comment);
            const text = htmlToText(comment, { wordwrap: false });
            const title = req.body.title.trim();
            const { visibility } = req.body;

            const user = req.user;
            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized" });

            const category = (await categoryCl.findOne({
                id: req.body.category,
            })) as Category;
            if (!category)
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Category not found" });

            if ((await threadCl.findOne({ title }, { projection: { _id: 0 } })) as Thread)
                return res
                    .code(409)
                    .send({ statusCode: 409, error: "Title already exists" });

            const newThreadId =
                (
                    (await threadCl
                        .find()
                        .project({ id: 1, _id: 0 })
                        .sort({ id: -1 })
                        .limit(1)
                        .toArray()) as Thread[]
                )[0]?.id + 1 || 1;

            const date = new Date();

            const genOpts = {
                numbers: true,
                uppercase: true,
                lowercase: true,
                symbols: false,
                length: 7,
                strict: true,
            };

            let commentSlinkId = generate(genOpts);

            while ((await linksCl.findOne({ id: commentSlinkId })) as Link) {
                commentSlinkId = generate(genOpts);
            }

            await linksCl.insertOne(<Link>{
                id: commentSlinkId,
                url: `/thread/${newThreadId}?c=1`,
            });

            const userData: publicUserType = {
                id: user.id,
                name: user.name,
                role: user.role,
                sex: user.sex,
            };

            const images = findImages(comment);

            const threadData: Thread = {
                id: newThreadId,
                count: 1,
                visibility,
                conversation: [
                    {
                        id: 1,
                        user: userData,
                        slink: `https://${config.LINKS_DOMAIN}/${commentSlinkId}`,
                        comment,
                        text,
                        createdAt: date,
                        images,
                        visibility,
                    },
                ],
                op: userData,
                score: 0,
                slink: `https://${config.LINKS_DOMAIN}/${newThreadId}`,
                title,
                category: category.id,
                lastModified: date,
                createdAt: date,
                images: images.map((item) => {
                    return { ...item, cid: 1 };
                }),
            };

            await threadCl.insertOne(threadData);

            (
                usersCl
                    .find({
                        following: {
                            $elemMatch: {
                                id: user.id,
                            },
                        },
                        sessions: { $elemMatch: { subscription: { $exists: true } } },
                    })
                    .project({
                        _id: 0,
                        id: 1,
                    })
                    .toArray() as Promise<User[]>
            ).then((users) => {
                users.forEach(({ id }) => {
                    if (id !== user.id) {
                        sendNotification(id, {
                            title: "New thread",
                            createdAt: new Date(),
                            options: {
                                body: `${user.name} #${user.id} created: ${title}`,
                                data: {
                                    type: "thread",
                                    threadId: newThreadId,
                                    url: `https://${config.DOMAIN}/thread/${newThreadId}`,
                                },
                            },
                        });
                    }
                });
            });

            res.send({ id: newThreadId });
        }
    );
    done();
};
