import { usersCl, webpush } from "../../common";
import User, { Notification } from "../../models/user";

export async function sendNotification(userId: number, data: Notification) {
    const sessions = (
        (await usersCl.findOne(
            { id: userId },
            {
                projection: {
                    _id: 0,
                    sessions: {
                        $filter: {
                            input: "$sessions",
                            as: "session",
                            cond: {
                                $ne: [{ $type: "$$session.subscription" }, "missing"],
                            },
                        },
                    },
                },
            }
        )) as User
    )?.sessions;

    if (!sessions?.length) return null;

    await usersCl.updateOne({ id: userId }, { $push: { notifications: data } });

    sessions.forEach(async (session) => {
        try {
            await webpush.sendNotification(session.subscription, JSON.stringify(data));
        } catch (err) {
            console.log(err);
        }
    });

    return true;
}
