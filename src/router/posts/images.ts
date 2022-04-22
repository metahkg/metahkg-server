import { Router } from "express";
import isInteger from "is-sn-integer";
import { db } from "../../common";
const router = Router();
router.get("/api/posts/images/:id", async (req, res) => {
    if (!isInteger(req.params.id)) {
        res.status(400);
        res.send({ error: "Bad request." });
        return;
    }
    const id = Number(req.params.id);
    const cid = Number(req.query.c);
    const images = db.collection("images");
    const result = await images.findOne(
        { id: id },
        {
            projection: {
                _id: 0,
                images: cid && {
                    $filter: {
                        input: "$images",
                        cond: {
                            $eq: ["$$this.cid", cid],
                        },
                    },
                },
            },
        }
    );
    res.send(result.images);
});
export default router;
