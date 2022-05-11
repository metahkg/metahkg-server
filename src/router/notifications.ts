import { Router } from "express";
import { notificationsCl } from "../common";
import verifyUser from "../lib/auth/verify";
const router = Router();

router.get("/api/notifications", async (req, res) => {
    const user = verifyUser(req.headers.authorization);
    if (!user) return res.status(404).send({ error: "User not found." });
    const limit = Number(req.query.limit);
    const page = Number(req.query.page) || 1;
    const unread = Boolean(req.query.unread);
    const read = Boolean(req.query.read);
    const notifications = await notificationsCl.findOne(
        { user: user.id },
        {
            projection: {
                _id: 0,
                notifications: {
                    $filter: {
                        input: "$notifications",
                        cond: {
                            $and: [
                                {
                                    $or: [
                                        {
                                            $eq: ["$$this.read", read],
                                        },
                                        { $eq: ["$$this.unread", unread] },
                                    ],
                                },
                                limit
                                    ? {
                                          $and: [
                                              {
                                                  $gte: [
                                                      "$$this.id",
                                                      limit * (page - 1) + 1,
                                                  ],
                                              },
                                              { $lte: ["$$this.id", limit * page] },
                                          ],
                                      }
                                    : undefined,
                            ],
                        },
                    },
                },
            },
        },
    );
    res.send(notifications);
});

export default router;
