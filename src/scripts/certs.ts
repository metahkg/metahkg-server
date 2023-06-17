import { generateKeyPairSync } from "crypto";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { config } from "../lib/config";

export function generateCerts() {
    const publicExists = existsSync("certs/public.pem");
    const privateExists = existsSync("certs/private.pem");
    if (publicExists && privateExists) {
        return console.info(
            "Public and private keys exist. Not generating a new key pair."
        );
    }
    if (publicExists && !privateExists) {
        throw "Public key exists but private key does not. Please remove the public key or add the private key.";
    }
    if (!publicExists && privateExists) {
        throw "Private key exists but public key does not. Please remove the private key or add the public key.";
    }

    console.info(
        "Public and private key not found. Generating a new ed25519 key pair..."
    );
    const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
        publicKeyEncoding: {
            type: "spki",
            format: "pem",
        },
        privateKeyEncoding: {
            type: "pkcs8",
            format: "pem",
            cipher: "aes-256-cbc",
            passphrase: config.KEY_PASSPHRASE,
        },
    });
    if (!existsSync("certs")) {
        mkdirSync("certs");
    }
    writeFileSync("certs/public.pem", publicKey, { flag: "w" });
    writeFileSync("certs/private.pem", privateKey, { flag: "w" });
}
