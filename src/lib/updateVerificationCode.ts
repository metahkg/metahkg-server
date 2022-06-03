import { generate } from "wcyat-rg";
import { timediff, verificationCl } from "../common";

export default async function updateVerificationCode() {
    await verificationCl.find().forEach((item) => {
        (async () => {
            if (timediff(item.lastModified || item.createdAt) > 86400) {
                await verificationCl.updateOne(
                    { _id: item._id },
                    {
                        $set: {
                            code: generate({
                                include: {
                                    numbers: true,
                                    upper: true,
                                    lower: true,
                                    special: false,
                                },
                                digits: 30,
                            }),
                        },
                        $currentDate: {
                            lastModified: true,
                        },
                    }
                );
            }
        })();
    });
}
