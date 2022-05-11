// get 20 neweat/hottezt threads in a category
// note: category 1 returns all categories
// Syntax: GET /api/menu/<category id>?sort=<0 | 1>&page=<number>
import express from "express";
import { categoryCl, threadCl, viralCl } from "../../common";
import { hiddencats as gethiddencats } from "../../lib/hiddencats";
import { Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import verifyUser from "../../lib/auth/verify";
import Thread from "../../models/thread";
const router = express.Router();
/**
 * sort:
 * 0 : newest
 * 1 : viral
 */
router.get("/api/menu/:category", async (req, res) => {
    const sort = Number(req.query.sort || 0);
    const page = Number(req.query.page) || 1;
    let category = Number(req.params.category) || req.params.category;
    const schema = Type.Object(
        {
            category: Type.Union([Type.Integer(), Type.RegEx(/bytid[1-9][0-9]+/i)]),
            sort: Type.Union([Type.Literal(0), Type.Literal(1)]),
            page: Type.Integer({ minimum: 1 }),
        },
        { additionalProperties: false },
    );

    if (!ajv.validate(schema, { category: category, page: page, sort: sort }))
        return res.status(400).send({ error: "Bad request." });

    const hiddencats = await gethiddencats();
    if (req.params.category.startsWith("bytid")) {
        const thread = (await threadCl.findOne(
            {
                id: Number(req.params.category.replace("bytid", "")),
            },
            { projection: { _id: 0, category: 1 } },
        )) as Thread;
        if (!thread || !thread.category)
            return res.status(404).send({ error: "Not found." });

        category = thread.category;
    }

    if (!verifyUser(req.headers.authorization) && hiddencats.includes(category))
        return res.status(401).send({ error: "Permission denied." });

    if (!(await categoryCl.findOne({ id: category })))
        return res.status(404).send({ error: "Not found." });

    const find =
        category === 1 ? { category: { $nin: hiddencats } } : { category: category };

    const data = sort
        ? await viralCl
              .find(find)
              .sort({ c: -1, lastModified: -1 })
              .skip(25 * (page - 1))
              .limit(25)
              .toArray()
        : ((await threadCl
              .find(find)
              .sort({ lastModified: -1 })
              .skip(25 * (page - 1))
              .limit(25)
              .project({ _id: 0, conversation: 0 })
              .toArray()) as Thread[]);
    if (sort) {
        for (let index = 0; index < data.length; index++) {
            data[index] = (await threadCl.findOne(
                { id: data[index].id },
                { projection: { _id: 0, conversation: 0 } },
            )) as Thread;
        }
    }
    res.send(data);
});
export default router;
