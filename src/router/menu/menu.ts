// get 20 neweat/hottezt threads in a category
// note: category 1 returns all categories
// Syntax: GET /api/menu/<category id>?sort=<0 | 1>&page=<number>
import express from "express";
import isInteger from "is-sn-integer";
import { db } from "../../common";
import { hiddencats as gethiddencats } from "../lib/hiddencats";
import { signedin } from "../lib/users";
import { Type } from "@sinclair/typebox";
import { ajv } from "../lib/ajv";
const router = express.Router();
/**
 * sort:
 * 0 : newest
 * 1 : viral
 */
router.get("/api/menu/:category", async (req, res) => {
    const sort = Number(req.query.sort || 0);
    const page = Number(req.query.page) || 1;
    let category = Number(req.params.category);
    const schema = Type.Object(
        {
            category: Type.Union([Type.Integer(), Type.RegEx(/bytid[1-9][0-9]+/i)]),
            sort: Type.Union([Type.Literal(0), Type.Literal(1)]),
            page: Type.Integer({ minimum: 1 }),
        },
        { additionalProperties: false }
    );
    if (!ajv.validate(schema, { category: category, page: page, sort: sort })) {
        res.status(400);
        res.send({ error: "Bad request." });
        return;
    }
    const summary = db.collection("summary");
    const viral = db.collection("viral");
    const hiddencats = await gethiddencats();
    if (req.params.category.startsWith("bytid")) {
        const s = await summary.findOne({
            id: Number(req.params.category.replace("bytid", "")),
        });
        if (!s || !s.category) {
            res.status(404);
            res.send({ error: "Not found." });
            return;
        }
        category = s.category;
    }
    if (!(await signedin(req.cookies.key)) && hiddencats.includes(category)) {
        res.status(401);
        res.send({ error: "Permission denied." });
        return;
    }
    if (!(await db.collection("category").findOne({ id: category }))) {
        res.status(404);
        res.send({ error: "Not found." });
        return;
    }
    let find = category === 1 ? { category: { $nin: hiddencats } } : { category: category };
    const data = sort
        ? await viral
              .find(find)
              .sort({ c: -1, lastModified: -1 })
              .skip(25 * (page - 1))
              .limit(25)
              .toArray()
        : await summary
              .find(find)
              .sort({ lastModified: -1 })
              .skip(25 * (page - 1))
              .limit(25)
              .project({ _id: 0 })
              .toArray();
    if (sort) {
        for (let index = 0; index < data.length; index++) {
            data[index] = await summary.findOne({ id: data[index].id }, { projection: { _id: 0 } });
        }
    }
    res.send(data.length ? data : [null]);
});
export default router;
