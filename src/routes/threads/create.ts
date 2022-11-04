import {
    RecaptchaSecret,
    categoryCl,
    LINKS_DOMAIN,
    linksCl,
    threadCl,
} from "../../lib/common";
import { verifyCaptcha } from "../../lib/recaptcha";
import findImages from "../../lib/findimages";
import { Static, Type } from "@sinclair/typebox";

import { generate } from "generate-password";
import sanitize from "../../lib/sanitize";
import Thread from "../../models/thread";
import { htmlToText } from "html-to-text";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import checkMuted from "../../plugins/checkMuted";
import {
    CommentContentSchema,
    IntegerSchema,
    RTokenSchema,
    TitleSchema,
} from "../../lib/schemas";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            content: CommentContentSchema,
            rtoken: RTokenSchema,
            title: TitleSchema,
            category: IntegerSchema,
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/",
        {
            preHandler: [
                checkMuted,
                fastify.rateLimit({
                    max: 10,
                    timeWindow: 1000 * 60 * 60,
                }),
            ],
            schema: { body: schema },
        },
        async (
            req: FastifyRequest<{
                Body: Static<typeof schema>;
                headers: { authorization?: string };
            }>,
            res
        ) => {
            const { content } = req.body;
            content.html = sanitize(content.html);
            const text = htmlToText(content.html, { wordwrap: false });
            const title = req.body.title.trim();

            if (!(await verifyCaptcha(RecaptchaSecret, req.body.rtoken)))
                return res
                    .code(429)
                    .send({ statusCode: 429, error: "Recaptcha token invalid." });

            const user = req.user;
            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

            const category = await categoryCl.findOne({ id: req.body.category });
            if (!category)
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Category not found." });

            if (await threadCl.findOne({ title }, { projection: { _id: 0, id: 1 } }))
                return res
                    .code(409)
                    .send({ statusCode: 409, error: "Title already exists." });

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

            while (await linksCl.findOne({ id: commentSlinkId })) {
                commentSlinkId = generate(genOpts);
            }

            await linksCl.insertOne({
                id: commentSlinkId,
                url: `/thread/${newThreadId}?c=1`,
            });

            const userData = {
                id: user.id,
                name: user.name,
                role: user.role,
                sex: user.sex,
            };

            const images = findImages(content.html);

            const threadData: Thread = {
                id: newThreadId,
                count: 1,
                conversation: [
                    {
                        id: 1,
                        user: userData,
                        slink: `https://${LINKS_DOMAIN}/${commentSlinkId}`,
                        content: { ...content, text },
                        text,
                        createdAt: date,
                        images,
                    },
                ],
                op: userData,
                score: 0,
                slink: `https://${LINKS_DOMAIN}/${newThreadId}`,
                title,
                category: category.id,
                lastModified: date,
                createdAt: date,
                images: images.map((item) => {
                    return { src: item, cid: 1 };
                }),
            };

            await threadCl.insertOne(threadData);

            res.send({ id: newThreadId });
        }
    );
    done();
};
