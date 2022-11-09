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

import { Agenda, Job } from "agenda";
import { randomBytes } from "crypto";
import { client, usersCl, verificationCl } from "./common";

export const agenda = new Agenda({ mongo: client.db("agenda") });

agenda.define("updateVerificationCode", async (job: Job) => {
    // hashed email
    const { email } = job.attrs.data;

    await verificationCl.updateOne(
        { email, createdAt: { $lte: new Date(new Date().getTime() - 86400 * 1000) } },
        {
            $set: { code: randomBytes(15).toString("hex") },
            $currentDate: { lastModified: true },
        }
    );
});

agenda.define("unmuteUser", async (job: Job) => {
    const { userId } = job.attrs.data;

    await usersCl.updateOne({ id: userId }, { $unset: { mute: 1 } });
});

agenda.define("unbanUser", async (job: Job) => {
    const { userId } = job.attrs.data;

    await usersCl.updateOne({ id: userId }, { $unset: { ban: 1 } });
});

agenda.define("autoUnmuteUsers", async () => {
    await usersCl.updateMany(
        { "mute.exp": { $lte: new Date() } },
        { $unset: { mute: 1 } }
    );
});

agenda.define("autoUnbanUsers", async () => {
    await usersCl.updateMany({ "ban.exp": { $lte: new Date() } }, { $unset: { ban: 1 } });
});

agenda.define("removeExpiredSessions", async () => {
    // probably bug from mongodb side that $pull only accepts never
    await usersCl.updateMany(
        {},
        { $pull: { "sessions.exp": { $lt: new Date() } as never } }
    );
});

agenda.define("removeOldNotifications", async () => {
    // probably bug from mongodb side that $pull only accepts never
    await usersCl.updateMany(
        {},
        {
            $pull: {
                "notifications.createdAt": {
                    $lt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7),
                } as never,
            },
        }
    );
});
