const isInteger = require("is-sn-integer");
const { MongoClient } = require("mongodb");
const { mongouri } = require("../common");

async function updateconversation() {
  const client = new MongoClient(mongouri);
  await client.connect();
  const conversation = client.db("metahkg-threads").collection("conversation");
  conversation.find().forEach((i) => {
    const c = i.conversation;
    const o = [];
    let last = 0;
    c.forEach((t) => {
      if (t.id > last + 1) {
        for (let n = last + 1; n < t.id; n++) {
          o.push({
            id: n,
            removed: true,
          });
          last++;
        }
      }
      o.push(t);
      last++;
    });
    conversation.updateOne({ _id: i._id }, { $set: { conversation: o } });
  });
}
async function updatesex() {
  const client = new MongoClient(mongouri);
  await client.connect();
  const metahkgthreads = client.db("metahkg-threads");
  const metahkgusers = client.db("metahkg-users");
  const summary = metahkgthreads.collection("summary");
  const threadusers = metahkgthreads.collection("users");
  const users = metahkgusers.collection("users");
  const verification = metahkgusers.collection("verification");
  summary.find().forEach((i) => {
    if (typeof i.sex === "boolean") {
      summary.updateOne({ _id: i._id }, { $set: { sex: i.sex ? "M" : "F" } });
    }
  });
  threadusers.find().forEach((i) => {
    Object.entries(i).forEach((i1) => {
      if (isInteger(i1[0]) && typeof i1[1].sex === "boolean") {
        threadusers.updateOne(
          { _id: i._id },
          { $set: { [`${i1[0]}.sex`]: i1[1].sex ? "M" : "F" } }
        );
      }
    });
  });
  users.find().forEach((i) => {
    if (typeof i.sex === "boolean") {
      users.updateOne({ _id: i._id }, { $set: { sex: i.sex ? "M" : "F" } });
    }
  });
  verification.find().forEach((i) => {
    if (typeof i.sex === "boolean") {
      verification.updateOne(
        { _id: i._id },
        { $set: { sex: i.sex ? "M" : "F" } }
      );
    }
  });
}
async function updatevotes() {
  const client = new MongoClient(mongouri);
  await client.connect();
  const metahkgthreads = client.db("metahkg-threads");
  const metahkgusers = client.db("metahkg-users");
  const conversation = metahkgthreads.collection("conversation");
  const uservotes = metahkgusers.collection("votes");
  conversation.find().forEach(async (i) => {
    const c = i.conversation;
    const o = [];
    c.forEach((n) => {
      if (n?.up) {
        n.U = n.up;
        delete n.up;
      }
      if (n?.down) {
        n.D = n.down;
        delete n.down;
      }
      o.push(n);
    });
    await conversation.updateOne({ _id: i._id }, { $set: { conversation: o } });
  });
  uservotes.find().forEach((i) => {
    Object.entries(i).forEach(async (n) => {
      if (isInteger(n[0])) {
        const o = {};
        Object.entries(n[1]).forEach((v) => {
          if (v[1] === "up") {
            v[1] = "U";
          }
          if (v[1] === "down") {
            v[1] = "D";
          }
          o[v[0]] = v[1];
        });
        await uservotes.updateOne({ _id: i._id }, { $set: { [n[0]]: o } });
      }
    });
  });
}
updateconversation();
updatesex();
updatevotes();
