import webPush from "web-push";
import { domain, usersCl, vapidKeys } from "../common";
import User, { Notification } from "../../models/user";

export async function sendNotification(userId: number, data: Notification) {
    webPush.setGCMAPIKey(process.env.GCM_API_KEY);
    webPush.setVapidDetails(`https://${domain}`, vapidKeys.public, vapidKeys.private);
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
            await webPush.sendNotification(session.subscription, JSON.stringify(data));
        } catch (err) {
            console.log(err);
        }
    });

    return true;
}
