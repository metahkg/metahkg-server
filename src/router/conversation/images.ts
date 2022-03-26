import { Router } from "express";
import isInteger from "is-sn-integer";
import { client } from "../../common";
const router = Router();
router.get("/api/images/:id", async (req, res) => {
  if (!isInteger(req.params.id)) {
    res.status(400);
    res.send({ error: "Bad request." });
    return;
  }
  const id = Number(req.params.id);
  const cid = Number(req.query.c);
  const images = client.db("metahkg-threads").collection("images");
  const result = await images.findOne(
    { id: id },
    {
      projection: {
        _id: 0,
        images: cid && {
          $filter: {
            input: "$images",
            cond: {
              $and: [
                {
                  $gte: ["$$this.cid", cid],
                  $lte: ["$$this.cid", cid],
                },
              ],
            },
          },
        },
      },
    }
  );
  res.send(result.images);
});
export default router;
