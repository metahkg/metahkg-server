import { FastifyRequest, FastifyReply } from "fastify";
import { verifyCaptcha } from "../lib/captcha";

export default async function RequireCAPTCHA(
    req: FastifyRequest<{ Body: { captchaToken: string } }>,
    res: FastifyReply
) {
    const { captchaToken } = req.body;
    if (!(await verifyCaptcha(captchaToken)))
        return res.code(429).send({ statusCode: 429, error: "Captcha token invalid" });
}
