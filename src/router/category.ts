//get categories
//Syntax: GET /api/category/<"all" | number(category id)>
//"all" returns an array of all categories
import express from "express";
import { db, threadCl } from "../common";
const router = express.Router();
import body_parser from "body-parser";
import isInteger from "is-sn-integer";
import Thread from "../models/thread";

router.get("/api/category/:id", body_parser.json(), async (req, res) => {
    if (
        (req.params.id !== "all" &&
            !isInteger(req.params.id) &&
            !req.params.id?.startsWith("bytid")) ||
        (req.params.id?.startsWith("bytid") &&
            !isInteger(req.params.id?.replace("bytid", "")))
    ) {
        res.status(400);
        res.send({ error: "Bad request." });
        return;
    }

    const categories = db.collection("category");
    if (req.params.id === "all") {
        res.send(await categories.find().project({ _id: 0 }).sort({ id: 1 }).toArray());
        return;
    }
    if (req.params.id?.startsWith("bytid")) {
        const thread = await threadCl.findOne(
            {
                id: Number(req.params.id?.replace("bytid", "")),
            },
            { projection: { _id: 0, category: 1 } }
        ) as Thread;
        const category = await categories.findOne({ id: thread?.category });
        if (!category) {
            res.status(404);
            res.send({ error: "Not found." });
            return;
        }
        res.send({ id: category.id, name: category.name });
        return;
    }
    const c = await categories.findOne({ id: Number(req.params.id) });
    if (!c) {
        res.status(404);
        res.send({ error: "Not found." });
        return;
    }
    res.send({ id: c.id, name: c.name, hidden: c.hidden });
});
export default router;
