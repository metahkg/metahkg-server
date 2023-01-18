import { FastifyRequest, FastifyReply } from "fastify";
import { config } from "../lib/config";
import { verifyCaptcha } from "../lib/recaptcha";

export default async function RequireReCAPTCHA(
    req: FastifyRequest<{ Body: { rtoken: string } }>,
    res: FastifyReply
) {
    const { rtoken } = req.body;
    if (!(await verifyCaptcha(config.RECAPTCHA_SECRET, rtoken)))
        return res.code(429).send({ statusCode: 429, error: "Recaptcha token invalid." });
}
