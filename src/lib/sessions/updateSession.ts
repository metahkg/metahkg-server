import { usersCl } from "../common";
import { sha256 } from "../sha256";

export async function updateSessionById(
    userId: number,
    sessionId: string,
    newToken: string
) {
    if (
        !(
            await usersCl.updateOne(
                { id: userId, sessions: { $elemMatch: { id: sessionId } } },
                {
                    $set: {
                        "sessions.$.exp": new Date(
                            new Date().getTime() + 1000 * 60 * 60 * 24 * 7
                        ),
                        "sessions.$.token": newToken,
                    },
                }
            )
        ).matchedCount
    )
        return null;

    return true;
}

export async function updateSessionByToken(
    userId: number,
    token: string,
    newToken: string
) {
    const hashedToken = sha256(token);
    if (
        !(
            await usersCl.updateOne(
                { id: userId, sessions: { $elemMatch: { token: hashedToken } } },
                {
                    $set: {
                        "sessions.$.exp": new Date(
                            new Date().getTime() + 1000 * 60 * 60 * 24 * 7
                        ),
                        "sessions.$.token": newToken,
                    },
                }
            )
        ).matchedCount
    )
        return null;

    return true;
}
