//Create a topic
/*Syntax: POST /api/create
{
  icomment (initial comment) : string,
  rtoken (recaptcha token) : string,
  title : string,
  category : number
}*/
//only for human
import {
    secret,
    limitCl,
    categoryCl,
    LINKS_DOMAIN,
    linksCl,
    threadCl,
    imagesCl,
} from "../../common";
import { verifyCaptcha } from "../../lib/recaptcha";
import findImages from "../../lib/findimages";
import { Static, Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import verifyUser from "../../lib/auth/verify";
import { generate } from "wcyat-rg";
import sanitize from "../../lib/sanitize";
import Limit from "../../models/limit";
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
        async (
            req: FastifyRequest<{
                Body: Static<typeof schema>;
                headers: { authorization?: string };
            }>,
            res
        ) => {
            if (!ajv.validate(schema, req.body))
                return res.code(400).send({ error: "Bad request." });

            const comment = sanitize(req.body.comment);
            const text = htmlToText(comment, { wordwrap: false });

            if (!(await verifyCaptcha(secret, req.body.rtoken)))
                return res.code(400).send({ error: "recaptcha token invalid." });

            const user = verifyUser(req.headers.authorization);
            if (!user) return res.code(400).send({ error: "User not found." });

            if ((await limitCl.countDocuments({ id: user.id, type: "create" })) >= 10)
                return res
                    .status(429)
                    .send({ error: "You cannot create more than 10 topics a day." });

            const category = await categoryCl.findOne({ id: req.body.category });
            if (!category) return res.code(404).send({ error: "Category not found." });

            const newThreadId =
                (
                    (await threadCl
                        .find()
                        .sort({ id: -1 })
                        .limit(1)
                        .project({ id: 1, _id: 0 })
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
                    },
                ],
                op: userData,
                c: 1,
                vote: 0,
                slink: `https://${LINKS_DOMAIN}/${newThreadId}`,
                title: req.body.title,
                category: category.id,
                lastModified: date,
                createdAt: date,
            };

            await threadCl.insertOne(threadData);

            await imagesCl.insertOne({
                id: newThreadId,
                images: findImages(comment).map((item) => {
                    return { image: item, cid: 1 };
                }),
            });

            await limitCl.insertOne({
                id: user.id,
                createdAt: date,
                type: "create",
            } as Limit);

            res.send({ id: newThreadId });
        }
    );
    done();
};
