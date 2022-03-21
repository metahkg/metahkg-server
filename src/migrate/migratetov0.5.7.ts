import { MongoClient } from "mongodb";
import { mongouri } from "../common";
import hash from "hash.js";
import EmailValidator from "email-validator";
async function main() {
  const client = new MongoClient(mongouri);
  await client.connect();
  const users = client.db("metahkg-users").collection("users");
  await users.find().forEach((item) => {
    if (EmailValidator.validate(item.email)) {
      users.updateOne(
        { _id: item._id },
        { $set: { email: hash.sha256().update(item.email).digest("hex") } }
      );
    }
  });
}
main();
