import { usersCl } from "../../common";
import { sha256 } from "../sha256";

export async function revokeSessionByToken(userId: number, token: string): Promise<null | true> {
    if (
        !(
            await usersCl.updateOne(
                { id: userId },
                {
                    $pull: {
                        sessions: {
                            token: sha256(token),
                        },
                    },
                }
            )
        ).matchedCount
    ) {
        return null;
    }
    return true;
}

export async function revokeSessionById(userId: number, sessionId: string) {
    if (
        !(
            await usersCl.updateOne(
                { id: userId },
                {
                    $pull: {
                        sessions: {
                            id: sessionId,
                        },
                    },
                }
            )
        ).matchedCount
    ) {
        return null;
    }
    return true;
}
