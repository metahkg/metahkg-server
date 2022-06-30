// get 20 neweat/hottezt threads in a category
// note: category 1 returns all categories
// Syntax: GET /api/menu/<category id>?sort=<0 | 1>&page=<number>
import { categoryCl, threadCl } from "../../common";
import { hiddencats as gethiddencats } from "../../lib/hiddencats";
import { Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import verifyUser from "../../lib/auth/verify";
import Thread from "../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    /**
     * sort:
     * 0 : newest
     * 1 : viral
     */
    fastify.get(
        "/:category",
        async (
            req: FastifyRequest<{
                Querystring: { sort?: string; page?: string };
                Params: { category: string };
            }>,
            res
        ) => {
            const sort = Number(req.query.sort || 0);
            const page = Number(req.query.page) || 1;
            let category = Number(req.params.category) || req.params.category;
            const schema = Type.Object(
                {
                    category: Type.Union([Type.Integer(), Type.RegEx(/bytid\d+/i)]),
                    sort: Type.Union([Type.Literal(0), Type.Literal(1)]),
                    page: Type.Integer({ minimum: 1 }),
                },
                { additionalProperties: false }
            );

            if (!ajv.validate(schema, { category, page, sort }))
                return res.code(400).send({ error: "Bad request." });

            const hiddenCats = await gethiddencats();

            if (req.params.category.startsWith("bytid")) {
                const thread = (await threadCl.findOne(
                    {
                        id: Number(req.params.category.replace("bytid", "")),
                    },
                    { projection: { _id: 0, category: 1 } }
                )) as Thread;
                if (!thread || !thread.category)
                    return res.code(404).send({ error: "Not found." });

                category = thread.category;
            }

            if (!verifyUser(req.headers.authorization) && hiddenCats.includes(category))
                return res.code(403).send({ error: "Permission denied." });

            if (!(await categoryCl.findOne({ id: category })))
                return res.code(404).send({ error: "Not found." });

            const find =
                category === 1 ? { category: { $nin: hiddenCats } } : { category };

            const timeForViral = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

            const data = sort
                ? ((await threadCl
                      .aggregate([
                          {
                              $match: { ...find, lastModified: { $gte: timeForViral } },
                          },
                          {
                              $addFields: {
                                  newComments: {
                                      $reduce: {
                                          input: "$conversation",
                                          initialValue: 0,
                                          in: {
                                              $add: [
                                                  "$$value",
                                                  {
                                                      $toInt: {
                                                          $gte: [
                                                              "$$this.createdAt",
                                                              timeForViral,
                                                          ],
                                                      },
                                                  },
                                              ],
                                          },
                                      },
                                  },
                              },
                          },
                          { $sort: { newComments: -1, lastModified: -1 } },
                          { $project: { _id: 0, conversation: 0, newComments: 0 } },
                          { $skip: 25 * (page - 1) },
                          { $limit: 25 },
                      ])
                      .toArray()) as Thread[])
                : ((await threadCl
                      .find(find)
                      .sort({ lastModified: -1 })
                      .skip(25 * (page - 1))
                      .limit(25)
                      .project({ _id: 0, conversation: 0 })
                      .toArray()) as Thread[]);

            res.send(data);
        }
    );
    done();
};
