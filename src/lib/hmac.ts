import { createHmac, randomBytes } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";

export function generateHMACKey() {
    if (existsSync("certs/hmac.key")) {
        return console.info("HMAC key exists. Not generating a new hmac key.");
    }
    console.info("Generating a new HMAC key...");
    writeFileSync("certs/hmac.key", randomBytes(256).toString("hex"), { flag: "w" });
}

export function getHMACKey() {
    if (!existsSync("certs/hmac.key")) {
        return "";
    }
    return readFileSync("certs/hmac.key", "utf-8").trim();
}

export function HMACSign(data: string) {
    const hmac = createHmac("sha256", getHMACKey());
    hmac.update(data);
    return hmac.digest("base64url");
}
