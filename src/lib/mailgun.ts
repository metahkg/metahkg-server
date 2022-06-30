import Mailgun from "mailgun.js";
import formData from "form-data";
import dotenv from "dotenv";
import { domain } from "../common";

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
    <p>Alternatively, use this code at https://${domain}/users/verify :<p>
    <p>${code}</p>`,
    };
};

export const resetMsg = (params: { email: string; code: string }) => {
    const { email, code } = params;
    return {
        from: `Metahkg support <support@${mgDomain}>`,
        to: email,
        subject: "Metahkg - Reset Password",
        html: /*html*/ `<h1>Reset Password</h1>
        <p>Click here to reset your password:</h1>
        <a href="https://${domain}/users/reset?code=${encodeURIComponent(code)}&email=${encodeURIComponent(
            email
        )}">Reset</a>
        <p>Alternatively, use this code at https://${domain}/reset :</p>
        <p>${code}</p>`,
    };
};
