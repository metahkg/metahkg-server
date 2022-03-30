import { client } from "../../common";
const users = client.db("metahkg-users").collection("users");
export async function signedin(key: string) {
  if (!key || typeof key !== "string") return false;
  const user = await users.findOne({ key: key });
  return Boolean(user);
}

export async function getuser(key: string): Promise<any> {
  if (!key || typeof key !== "string") return undefined;
  const user = await users.findOne({ key: key });
  return user;
}