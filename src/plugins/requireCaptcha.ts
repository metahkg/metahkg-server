import { FastifyRequest, FastifyReply } from "fastify";
import { verifyCaptcha } from "../lib/captcha";
import { config } from "../lib/config";

export default async function RequireCAPTCHA(
    req: FastifyRequest<{ Body: { captchaToken: string } }>,
    res: FastifyReply,
) {
    if (config.DISABLE_CAPTCHA) return;
    const { captchaToken } = req.body;
    if (!(await verifyCaptcha(captchaToken)))
        return res.code(429).send({ statusCode: 429, error: "Captcha token invalid" });
}
