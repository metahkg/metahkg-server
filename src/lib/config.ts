import dotenv from "dotenv";
import { secrets } from "./secret";
import { getHMACKey } from "./hmac";

dotenv.config();

const se = secrets();

export const config = {
    MONGO_URI: process.env.MONGO_URI || process.env.DB_URI || "mongodb://localhost",
    REDIS_HOST: process.env.REDIS_HOST || "",
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
    REDIS_PORT: Number(process.env.REDIS_PORT || 6379) || 6379,
    MAILGUN_KEY: process.env.MAILGUN_KEY || process.env.mailgun_key || "",
    MAILGUN_DOMAIN:
        process.env.MAILGUN_DOMAIN ||
        process.env.mailgun_domain ||
        process.env.DOMAIN ||
        process.env.domain ||
        "metahkg.org",
    SMTP_HOST: process.env.SMTP_HOST || "",
    SMTP_PORT: Number(process.env.SMTP_PORT || 587),
    SMTP_SSL: JSON.parse(process.env.SMTP_SSL || "false") || false,
    SMTP_TLS: JSON.parse(process.env.SMTP_TLS || "false") || false,
    SMTP_REQUIRE_TLS: JSON.parse(process.env.SMTP_REQUIRE_TLS || "false") || false,
    SMTP_USER: process.env.SMTP_USER || "",
    SMTP_PASSWORD: process.env.SMTP_PASSWORD || "",
    SMTP_EMAIL:
        process.env.SMTP_EMAIL ||
        `support@${process.env.DOMAIN || process.env.domain || ""}`,
    DOMAIN: process.env.DOMAIN || process.env.domain || "",
    LINKS_DOMAIN: process.env.LINKS_DOMAIN || "",
    PORT: Number(process.env.PORT || 3000) || 3000,
    CAPTCHA: (["recaptcha", "turnstile"].includes(process.env.CAPTCHA)
        ? process.env.CAPTCHA
        : "recaptcha") as "recaptcha" | "turnstile",
    DISABLE_CAPTCHA: JSON.parse(process.env.DISABLE_CAPTCHA || "false") || false,
    RECAPTCHA_SECRET: process.env.RECAPTCHA_SECRET || process.env.recaptchasecret || "",
    TURNSTILE_SECRET: process.env.TURNSTILE_SECRET || "",
    REGISTER_MODE: (["normal", "none", "invite"].includes(
        process.env.REGISTER_MODE || process.env.register
    )
        ? process.env.REGISTER_MODE || process.env.register
        : "normal") as "normal" | "none" | "invite",
    REGISTER_DOMAINS: (() => {
        if (process.env.REGISTER_DOMAINS) {
            const domains = process.env.REGISTER_DOMAINS.split(",");
            if (!domains.length) return null;
            return domains;
        }
        return null;
    })(),
    VISIBILITY: (["public", "internal"].includes(process.env.VISIBILITY)
        ? process.env.VISIBILITY
        : "public") as "public" | "internal",
    CORS: JSON.parse(process.env.CORS || process.env.cors || "false") || false,
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || se.VAPID_PUBLIC_KEY || "",
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || se.VAPID_PRIVATE_KEY || "",
    GCM_API_KEY: process.env.GCM_API_KEY || "",
    KEY_PASSPHRASE: process.env.KEY_PASSPHRASE || se.KEY_PASSPHRASE || "",
    HMAC_KEY: getHMACKey(),
};
