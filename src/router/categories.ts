//get categories
//Syntax: GET /api/category/<"all" | number(category id)>
//"all" returns an array of all categories
import express from "express";
import { db } from "../common";
const router = express.Router();
import body_parser from "body-parser";
import isInteger from "is-sn-integer";

router.get("/api/category/:id", body_parser.json(), async (req, res) => {
    if ((req.params.id !== "all" && !isInteger(req.params.id) && !req.params.id?.startsWith("bytid")) || (req.params.id?.startsWith("bytid") && !isInteger(req.params.id?.replace("bytid", "")))) {
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
        const summary = db.collection("summary");
        const s = await summary.findOne({
            id: Number(req.params.id?.replace("bytid", "")),
        });
        const c = await categories.findOne({ id: s?.category });
        if (!c) {
            res.status(404);
            res.send({ error: "Not found." });
            return;
        }
        res.send({ id: c.id, name: c.name });
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
