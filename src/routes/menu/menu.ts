// get 20 neweat/hottezt threads in a category
// note: category 1 returns all categories
// Syntax: GET /api/menu/<category id>?sort=<0 | 1>&page=<number>
import { categoryCl, threadCl } from "../../common";
import { hiddencats as gethiddencats } from "../../lib/hiddencats";
import { Static, Type } from "@sinclair/typebox";
import verifyUser from "../../lib/auth/verify";
import Thread from "../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../lib/regex";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    /**
     * sort:
     * 0 : latest
     * 1 : viral
     */
    const querySchema = Type.Object(
        {
            sort: Type.Optional(Type.RegEx(/^(0|1)$/)),
            page: Type.Optional(Type.RegEx(regex.integer)),
            limit: Type.Optional(Type.RegEx(regex.oneTo50)),
        },
        { additionalProperties: false }
    );

    const paramsSchema = Type.Object(
        {
            category: Type.Union([
                Type.RegEx(regex.integer),
                Type.RegEx(/^bytid[1-9]\d*$/),
            ]),
        },
        { additionalProperties: false }
    );

    fastify.get(
        "/:category",
        { schema: { querystring: querySchema, params: paramsSchema } },
        async (
            req: FastifyRequest<{
                Querystring: Static<typeof querySchema>;
                Params: Static<typeof paramsSchema>;
            }>,
            res
        ) => {
            const sort = Number(req.query.sort || 0);
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 25;
            let category = Number(req.params.category) || req.params.category;

            const hiddenCats = await gethiddencats();

            if (req.params.category.startsWith("bytid")) {
                const thread = (await threadCl.findOne(
                    {
                        id: Number(req.params.category.replace("bytid", "")),
                    },
                    { projection: { _id: 0, category: 1 } }
                )) as Thread;

                if (!thread || !thread.category)
                    return res.code(404).send({ error: "Category not found." });

                category = thread.category;
            }

            if (!verifyUser(req.headers.authorization) && hiddenCats.includes(category as number))
                return res.code(403).send({ error: "Forbidden." });

            if (!(await categoryCl.findOne({ id: category })))
                return res.code(404).send({ error: "Category not found." });

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
                          { $skip: limit * (page - 1) },
                          { $limit: limit },
                      ])
                      .toArray()) as Thread[])
                : ((await threadCl
                      .find(find)
                      .sort({ lastModified: -1 })
                      .skip(limit * (page - 1))
                      .limit(limit)
                      .project({ _id: 0, conversation: 0 })
                      .toArray()) as Thread[]);

            res.send(data);
        }
    );
    done();
};
