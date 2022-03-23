import { generate } from "wcyat-rg";
import { client, timediff } from "../../common";
export default async function changecode() {
  const verification = client.db("metahkg-users").collection("verification");
  await verification.find().forEach((item) => {
    (async () => {
      if (timediff(item.lastModified || item.createdAt) > 86400) {
        await verification.updateOne(
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