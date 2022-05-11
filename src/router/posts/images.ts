import { Router } from "express";
import isInteger from "is-sn-integer";
import { imagesCl } from "../../common";
const router = Router();
router.get("/api/posts/images/:id", async (req, res) => {
    if (!isInteger(req.params.id)) return res.status(400).send({ error: "Bad request." });

    const id = Number(req.params.id);
    const cid = Number(req.query.c);
    const result = await imagesCl.findOne(
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
        },
    );
    res.send(result.images);
});
export default router;
