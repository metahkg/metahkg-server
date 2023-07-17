/*
 Copyright (C) 2022-present Metahkg Contributors

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import Mailgun from "mailgun.js";
import formData from "form-data";
import dotenv from "dotenv";
import { config } from "./config";
import { createTransport } from "nodemailer";

dotenv.config();

/**
 * @brief send a email
 * @param to receiver email address
 * @param subject subject of the email
 * @param body body of the email (html)
 * @returns `true`: mailgun / smtp server received the email;
 * @returns `false`: email is rejected / other errors
 */
export async function sendEmail(
    to: string,
    subject: string,
    body: string,
): Promise<boolean> {
    if (config.MAIL_PROVIDER === "mailgun") {
        const mailgun = new Mailgun(formData);

        const mg = mailgun.client({
            key: config.MAILGUN_KEY,
            username: "api",
        });

        return await mg.messages
            .create(config.MAILGUN_DOMAIN, {
                from: `${config.BRANDING} support <support@${config.MAILGUN_DOMAIN}>`,
                to,
                subject,
                html: body,
            })
            .then(() => true)
            .catch((err) => {
                console.error(err);
                return false;
            });
    } else {
        const transporter = createTransport({
            host: config.SMTP_HOST,
            port: config.SMTP_PORT,
            ...(config.SMTP_SSL && { secure: true }),
            ...(config.SMTP_TLS &&
                !config.SMTP_REQUIRE_TLS && { opportunisticTLS: true }),
            ...(config.SMTP_TLS && config.SMTP_REQUIRE_TLS && { requireTLS: true }),
            ...((config.SMTP_USER || config.SMTP_PASSWORD) && {
                auth: {
                    ...(config.SMTP_USER && { user: config.SMTP_USER }),
                    ...(config.SMTP_PASSWORD && { pass: config.SMTP_PASSWORD }),
                },
            }),
        });

        return await transporter
            .sendMail({
                from: `${config.BRANDING} support <${config.SMTP_EMAIL}>`,
                to,
                subject,
                html: body,
            })
            .then(() => true)
            .catch((err) => {
                console.error(err);
                return false;
            });
    }
}

export async function sendVerifyMsg(email: string, code: string) {
    return await sendEmail(
        email,
        `${config.BRANDING} - verify your email`,
        /*html*/ `<h1>Verify your email</h1>
    <p>Click here to verify your email address:</p>
    <a href="https://${config.DOMAIN}/users/verify?code=${encodeURIComponent(
        code,
    )}&email=${encodeURIComponent(email)}">Verify</a>
    <p>Please ignore this email if you did not register at ${config.DOMAIN}.</p>`,
    );
}

export async function sendResetMsg(email: string, code: string) {
    return await sendEmail(
        email,
        `${config.BRANDING} - Reset Password`,
        /*html*/ `<h1>Reset Password</h1>
    <p>Click here to reset your password:</p>
    <a href="https://${config.DOMAIN}/users/reset?code=${encodeURIComponent(
        code,
    )}&email=${encodeURIComponent(email)}">Reset</a>
    <p>Please ignore this email if you did not request to reset your password.</p>`,
    );
}
