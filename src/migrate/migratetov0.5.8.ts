import { MongoClient } from "mongodb";
import findimages from "../router/lib/findimages";
import { mongouri } from "../common";
import axios from "axios";
import fs from "fs";
async function images() {
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
async function avatars() {
  const client = new MongoClient(mongouri);
  await client.connect();
  const users = client.db("metahkg-users").collection("users");
  fs.mkdir("images/avatars", { recursive: true }, (e) => {
    console.log(e);
  });
  await users.find().forEach((item) => {
    (async () => {
      if (item.avatar) {
        await axios
          .get(item.avatar, { responseType: "stream" })
          .then(async (res) => {
            res.data.pipe(
              fs.createWriteStream(`images/avatars/${item.id}.png`)
            );
            await users.updateOne(
              { _id: item._id },
              { $unset: { avatar: true } }
            );
          });
      }
    })();
  });
}
//images();
avatars();
