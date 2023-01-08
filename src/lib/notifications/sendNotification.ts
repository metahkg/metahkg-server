/*
 Copyright (C) 2022-present Metahkg Contributors

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import webPush from "web-push";
import { usersCl } from "../common";
import User, { Notification } from "../../models/user";
import { config } from "../config";

export async function sendNotification(userId: number, data: Notification) {
    webPush.setGCMAPIKey(config.GCM_API_KEY);
    webPush.setVapidDetails(`https://${config.DOMAIN}`, config.VAPID_PUBLIC_KEY, config.VAPID_PRIVATE_KEY);
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
            console.error(err);
        }
    });

    return true;
}
