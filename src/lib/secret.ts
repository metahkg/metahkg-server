import { readFileSync, writeFileSync } from "fs";
import { generateVAPIDKeys } from "web-push";
import { generate } from "generate-password";

interface Secrets {
    VAPID_PUBLIC_KEY: string;
    VAPID_PRIVATE_KEY: string;
    KEY_PASSPHRASE: string;
}

export function secrets(): Secrets {
    try {
        const parsedSecrets = JSON.parse(
            readFileSync("secrets.json").toString(),
        ) as Secrets;
        if (
            parsedSecrets.VAPID_PUBLIC_KEY &&
            parsedSecrets.VAPID_PRIVATE_KEY &&
            parsedSecrets.KEY_PASSPHRASE
        ) {
            // all required properties are present, return the parsed secrets
            return parsedSecrets;
        }
        // some required properties are missing, generate the missing ones
        const vapidKeys = parsedSecrets.VAPID_PUBLIC_KEY
            ? {
                  publicKey: parsedSecrets.VAPID_PUBLIC_KEY,
                  privateKey: parsedSecrets.VAPID_PRIVATE_KEY,
              }
            : generateVAPIDKeys();

        const passphrase = parsedSecrets.KEY_PASSPHRASE
            ? parsedSecrets.KEY_PASSPHRASE
            : generate({
                  length: 100,
                  numbers: true,
                  symbols: true,
                  uppercase: true,
                  excludeSimilarCharacters: true,
              });

        // merge the parsed and generated properties
        const se: Secrets = {
            VAPID_PUBLIC_KEY: vapidKeys.publicKey,
            VAPID_PRIVATE_KEY: vapidKeys.privateKey,
            KEY_PASSPHRASE: passphrase,
        };
        writeFileSync("secrets.json", JSON.stringify(se));
        return se;
    } catch {}

    console.info("secrets.json not found or couldn't be parsed. Generating secrets.");
    // generate all the properties
    const vapidKeys = generateVAPIDKeys();
    const passphrase = generate({
        length: 100,
        numbers: true,
        symbols: true,
        uppercase: true,
        excludeSimilarCharacters: true,
    });
    const se: Secrets = {
        VAPID_PUBLIC_KEY: vapidKeys.publicKey,
        VAPID_PRIVATE_KEY: vapidKeys.privateKey,
        KEY_PASSPHRASE: passphrase,
    };
    writeFileSync("secrets.json", JSON.stringify(se));
    return se;
}
