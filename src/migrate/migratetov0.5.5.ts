import { MongoClient } from "mongodb";
import { domain } from "../common";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
const mongouri = process.env.DB_URI;
(async function () {
    const client = new MongoClient(mongouri);
    await client.connect();
    const conversation = client.db("metahkg-threads").collection("conversation");
    conversation.find().forEach((i: any) => {
        (async () => {
            await i.conversation.forEach((c: any) => {
                (async () => {
                    if (!c.removed && !c.slink) {
                        const slink = `https://l.wcyat.me/${
                            (
                                await axios.post("https://api-us.wcyat.me/create", {
                                    url: `https://${domain}/thread/${i.id}?c=${c.id}`,
                                })
                            ).data.id
                        }`;
                        i.conversation[c.id - 1].slink = slink;
                        await conversation.updateOne({ _id: i._id }, { $set: { conversation: i.conversation } });
                    }
                })();
            });
        })();
    });
})();
