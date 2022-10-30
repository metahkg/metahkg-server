import { usersCl } from "../../common";
import { sha256 } from "../sha256";

export async function unSubscribeById(userId: number, sessionId: string) {
    if (
        !(
            await usersCl.updateOne(
                { id: userId, sessions: { $elemMatch: { id: sessionId } } },
                { $unset: { "sessions.$.subscription": 1 } }
            )
        ).matchedCount
    ) {
        return null;
    }

    return true;
}

export async function unSubscribeByToken(userId: number, token: string) {
    const hashedToken = sha256(token);
    if (
        !(
            await usersCl.updateOne(
                { id: userId, sessions: { $elemMatch: { token: hashedToken } } },
                { $unset: { "sessions.$.subscription": 1 } }
            )
        ).matchedCount
    ) {
        return null;
    }

    return true;
}
