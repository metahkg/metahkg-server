import { timediff, verificationCl } from "../common";
import { randomBytes } from "crypto";

export default async function updateVerificationCode() {
    await verificationCl.find().forEach((item) => {
        (async () => {
            if (timediff(item.lastModified || item.createdAt) > 86400) {
                await verificationCl.updateOne(
                    { _id: item._id },
                    {
                        $set: { code: randomBytes(15).toString("hex") },
                        $currentDate: { lastModified: true },
                    }
                );
            }
        })();
    });
}
