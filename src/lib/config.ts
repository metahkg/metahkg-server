import dotenv from "dotenv";

dotenv.config();

export const config = {
    MONGO_URI: process.env.MONGO_URI || process.env.DB_URI || "mongodb://localhost",
    MAILGUN_KEY: process.env.MAILGUN_KEY || process.env.mailgun_key || "",
    MAILGUN_DOMAIN:
        process.env.MAILGUN_DOMAIN ||
        process.env.mailgun_domain ||
        process.env.DOMAIN ||
        process.env.domain ||
        "metahkg.org",
    DOMAIN: process.env.DOMAIN || process.env.domain || "",
    LINKS_DOMAIN: process.env.LINKS_DOMAIN || "",
    PORT: Number(process.env.PORT || 3200) || 3200,
    RECAPTCHA_SECRET: process.env.RECAPTCHA_SECRET || process.env.recaptchasecret || "",
    REGISTER_MODE: ["normal", "none", "invite"].includes(
        process.env.REGISTER_MODE || process.env.register
    )
        ? process.env.REGISTER_MODE || process.env.register
        : "normal",
    CORS: JSON.parse(process.env.CORS || process.env.cors) || false,
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || "",
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || "",
    GCM_API_KEY: process.env.GCM_API_KEY || "",
    KEY_PASSPHRASE: process.env.KEY_PASSPHRASE || "",
};
