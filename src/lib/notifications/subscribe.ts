import { usersCl } from "../common";
import { Subscription } from "../../models/user";
import { sha256 } from "../sha256";

export async function subscribeById(
    userId: number,
    sessionId: string,
    subscription: Subscription
) {
    if (
        !(
            await usersCl.updateOne(
                { id: userId, sessions: { $elemMatch: { id: sessionId } } },
                { $set: { "sessions.$.subscription": subscription } }
            )
        ).matchedCount
    ) {
        return null;
    }

    return true;
}

export async function subscribeByToken(
    userId: number,
    token: string,
    subscription: Subscription
) {
    const hashedToken = sha256(token);
    if (
        !(
            await usersCl.updateOne(
                { id: userId, sessions: { $elemMatch: { token: hashedToken } } },
                { $set: { "sessions.$.subscription": subscription } }
            )
        ).matchedCount
    ) {
        return null;
    }

    return true;
}
