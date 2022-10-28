import hash from "hash.js";
export function sha256(msg: string) {
    return hash.sha256().update(msg).digest("hex");
}
