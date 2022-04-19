import { Type } from "@sinclair/typebox";
import express from "express";
import { ajv } from "../lib/ajv";
import { threadCl } from "../common";

const router = express.Router();
/**
 * sort:
 * 0: by relevence //default
 * 1: by creation time
 * 2: by last modification time
 */
router.get("/api/search", async (req, res) => {
    const page = Number(req.query.page) || 1;
    const query = decodeURIComponent(String(req.query.q));
    const sort = Number(req.query.sort ?? 0);
    const mode = Number(req.query.mode ?? 0);
    const schema = Type.Object({
        query: Type.String(),
        sort: Type.Integer({ minimum: 0, maximum: 2 }),
        page: Type.Integer({ minimum: 1 }),
        mode: Type.Integer({ minimum: 0, maximum: 1 }),
    });
    if (
        !ajv.validate(schema, {
            page: page,
            query: query,
            sort: sort,
            mode: mode,
        })
    )
        return res.status(400).send({ error: "Bad request." });

    const sortObj: any = {
        0: {},
        1: { createdAt: -1 },
        2: { lastModified: -1 },
    }[sort];
    const findObj: any = {
        0: { title: new RegExp(query, "i") },
        1: { "op.name": new RegExp(query, "i") },
    }[mode];

    const data = await threadCl
        .find(findObj)
        .sort(sortObj)
        .skip(25 * (page - 1))
        .limit(25)
        .project({ _id: 0, conversation: 0 })
        .toArray();
    res.send(data.length ? data : [null]);
});
export default router;
