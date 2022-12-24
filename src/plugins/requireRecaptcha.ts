import { FastifyRequest, FastifyReply } from "fastify";
import { RecaptchaSecret } from "../lib/common";
import { verifyCaptcha } from "../lib/recaptcha";

export default async function RequireReCAPTCHA(
    req: FastifyRequest<{ Body: { rtoken: string } }>,
    res: FastifyReply
) {
    const { rtoken } = req.body;
    if (!(await verifyCaptcha(RecaptchaSecret, rtoken)))
        return res.code(429).send({ statusCode: 429, error: "Recaptcha token invalid." });
}
