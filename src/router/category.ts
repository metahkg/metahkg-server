//get categories
//Syntax: GET /api/category/<"all" | number(category id)>
//"all" returns an array of all categories
import { Router } from "express";
import { categoryCl, threadCl } from "../common";
import body_parser from "body-parser";
import Thread from "../models/thread";
import { Type } from "@sinclair/typebox";
import { ajv } from "../lib/ajv";

const router = Router();

router.get("/api/category/:id", body_parser.json(), async (req, res) => {
    const id = Number(req.params.id) || req.params.id;

    const schema = Type.Union([
        Type.Integer({ minimum: 1 }),
        Type.Literal("all"),
        Type.RegEx(/^bytid[0-9]*$/),
    ]);

    if (!ajv.validate(schema, id)) return res.status(400).send({ error: "Bad request." });

    if (id === "all")
        return res.send(
            await categoryCl.find().project({ _id: 0 }).sort({ id: 1 }).toArray(),
        );

    if (req.params.id?.startsWith("bytid")) {
        const thread = (await threadCl.findOne(
            {
                id: Number(req.params.id?.replace("bytid", "")),
            },
            { projection: { _id: 0, category: 1 } },
        )) as Thread;

        const category = await categoryCl.findOne(
            { id: thread?.category },
            { projection: { _id: 0 } },
        );

        if (!category) return res.status(404).send({ error: "Not found." });

        return res.send(category);
    }

    const category = await categoryCl.findOne({ id: Number(req.params.id) });

    if (!category) return res.status(404).send({ error: "Not found." });

    res.send({ id: category.id, name: category.name, hidden: category.hidden });
});
export default router;
