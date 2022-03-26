import { MongoClient } from "mongodb";
import findimages from "../router/lib/findimages";
import { mongouri } from "../common";
async function main() {
  const client = new MongoClient(mongouri);
  await client.connect();
  const metahkgThreads = client.db("metahkg-threads");
  const conversation = metahkgThreads.collection("conversation");
  const images = metahkgThreads.collection("images");
  await conversation.find().forEach((item) => {
    (async () => {
      if (!(await images.findOne({ id: item.id }))) {
        const cimages: { image: string; cid: number }[] = [];
        item.conversation.forEach((citem: { comment?: string; id: number }) => {
          if (citem.comment) {
            findimages(citem.comment).forEach((c: string) => {
              const index = cimages.findIndex((i) => i.image === c);
              if (index === -1) {
                cimages.push({ image: c, cid: citem.id });
              } else {
                if (cimages[index].cid > item.cid) {
                  cimages.splice(index, 1);
                  cimages.push({ image: c, cid: citem.id });
                }
              }
            });
          }
        });
        await images.insertOne({ id: item.id, images: cimages });
      }
    })();
  });
}
main();
