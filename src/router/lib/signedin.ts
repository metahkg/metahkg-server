import { client } from "../../common";

export async function signedin(key: string) {
  if (!key || typeof key !== "string") return false;
  const users = client.db("metahkg-users").collection("users");
  const user = await users.findOne({ key: key });
  return Boolean(user);
}
