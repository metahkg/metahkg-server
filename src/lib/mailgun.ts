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
import { domain } from "./common";

dotenv.config();

export const mgDomain = process.env.mailgun_domain || process.env.domain || "metahkg.org";

const mailgun = new Mailgun(formData);

export const mg = mailgun.client({
    key: process.env.mailgun_key || "",
    username: "api",
});

export const verifyMsg = (params: { email: string; code: string }) => {
    const { email, code } = params;
    return {
        from: `Metahkg support <support@${mgDomain}>`,
        to: email,
        subject: "Metahkg - verify your email",
        html: /*html*/ `<h1>Verify your email</h1>
        <p>Click here to verify your email address:</p>
        <a href="https://${domain}/users/verify?code=${encodeURIComponent(
            code
        )}&email=${encodeURIComponent(email)}">Verify</a>
        <p>Please ignore this email if you did not register at ${domain}.</p>`,
    };
};

export const resetMsg = (params: { email: string; code: string }) => {
    const { email, code } = params;
    return {
        from: `Metahkg support <support@${mgDomain}>`,
        to: email,
        subject: "Metahkg - Reset Password",
        html: /*html*/ `<h1>Reset Password</h1>
        <p>Click here to reset your password:</p>
        <a href="https://${domain}/users/reset?code=${encodeURIComponent(
            code
        )}&email=${encodeURIComponent(email)}">Reset</a>
        <p>Please ignore this email if you did not request to reset your password.</p>`,
    };
};
