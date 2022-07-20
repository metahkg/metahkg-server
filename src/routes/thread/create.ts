//Create a topic
/*Syntax: POST /api/create
{
  icomment (initial comment) : string,
  rtoken (recaptcha token) : string,
  title : string,
  category : number
}*/
//only for human
import { secret, categoryCl, LINKS_DOMAIN, linksCl, threadCl } from "../../common";
import { verifyCaptcha } from "../../lib/recaptcha";
import findImages from "../../lib/findimages";
import { Static, Type } from "@sinclair/typebox";
import verifyUser from "../../lib/auth/verify";
import { generate } from "wcyat-rg";
import sanitize from "../../lib/sanitize";
import Thread from "../../models/thread";
import { htmlToText } from "html-to-text";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            comment: Type.String(),
            rtoken: Type.String(),
            title: Type.String(),
            category: Type.Integer(),
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/create",
        {
            preHandler: fastify.rateLimit({
                max: 10,
                timeWindow: 1000 * 60 * 60,
            }),
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

            if (!(await verifyCaptcha(secret, req.body.rtoken)))
                return res.code(429).send({ error: "Recaptcha token invalid." });

            const user = verifyUser(req.headers.authorization);
            if (!user) return res.code(401).send({ error: "Unauthorized." });

            const category = await categoryCl.findOne({ id: req.body.category });
            if (!category) return res.code(404).send({ error: "Category not found." });

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

            let commentSlinkId = generate({
                include: { numbers: true, upper: true, lower: true, special: false },
                digits: 7,
            });

            while (await linksCl.findOne({ id: commentSlinkId })) {
                commentSlinkId = generate({
                    include: { numbers: true, upper: true, lower: true, special: false },
                    digits: 7,
                });
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

            const images = findImages(comment);

            const threadData: Thread = {
                id: newThreadId,
                conversation: [
                    {
                        id: 1,
                        user: userData,
                        slink: `https://${LINKS_DOMAIN}/${commentSlinkId}`,
                        comment,
                        text,
                        createdAt: date,
                        images,
                    },
                ],
                op: userData,
                c: 1,
                score: 0,
                slink: `https://${LINKS_DOMAIN}/${newThreadId}`,
                title: req.body.title,
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
