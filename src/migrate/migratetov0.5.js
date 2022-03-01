const { mongouri, objtoarr } = require("./common");
const { MongoClient } = require("mongodb");
const { exit } = require("process");
(async () => {
  const client = new MongoClient(mongouri);
  await client.connect();
  const conversation = client
    .db("metahkg-conversation")
    .collection("conversation");
  const summary = client.db("metahkg-conversation").collection("summary");
  conversation
    .find()
    .forEach(async (i) => {
      await summary.updateOne(
        { id: i.id },
        { $set: { slink: (await conversation.findOne({ _id: i._id })).slink } }
      );
      await conversation.replaceOne(
        { _id: i._id },
        {
          conversation: objtoarr(i.conversation),
          lastModified: i.lastModified,
          _id: i._id,
          id: i.id,
        }
      );
    })
    .then(() => {
      exit(0);
    });
})();
