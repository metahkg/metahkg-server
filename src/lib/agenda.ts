import { Agenda, Job } from "agenda";
import { randomBytes } from "crypto";
import { client, usersCl, verificationCl } from "../common";

export const agenda = new Agenda({ mongo: client.db("agenda") });

agenda.define("updateVerificationCode", async (job: Job) => {
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

agenda.define("removeExpiredSessions", async () => {
    // probably bug from mongodb side that $pull only accepts never
    await usersCl.updateMany({}, { $pull: { "sessions.exp": { $lt: new Date() } as never } });
});
