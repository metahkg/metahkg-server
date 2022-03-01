import { MongoClient } from "mongodb";
import { mongouri } from "../../common";
/*
* Decrease collection "hottest" documents count by 1
  for sorting popularity
*/
export async function autodecrement() {
  const client = new MongoClient(mongouri);
  try {
    await client.connect();
    const hottest = client.db("metahkg-threads").collection("hottest");
    await hottest.updateMany({}, { $inc: { c: -1 } });
  } finally {
    await client.close();
  }
}
