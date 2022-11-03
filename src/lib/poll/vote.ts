import { publicUserType } from "../../models/thread";
import { pollsCl } from "../common";

export async function votePoll(user: publicUserType, pollId: string, option: string) {
    await pollsCl.updateOne({}, {});
}
