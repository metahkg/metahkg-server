import { randomBytes } from "crypto";
import { Poll } from "../../models/polls";
import { publicUserType } from "../../models/thread";
import { pollsCl } from "../common";

export async function createPoll(
    user: publicUserType,
    title: string,
    options: { title: string; description?: string }[],
    description?: string
) {
    // 20-digit random id
    const id = randomBytes(10).toString("hex");
    const poll: Poll = {
        id,
        user,
        title,
        description,
        options: options.map((v) => ({ ...v, votes: 0 })),
        createAt: new Date(),
    };
    await pollsCl.insertOne(poll);
}
