import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { config } from "../../lib/config";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.get("/config", (_req, res) => {
        res.send({
            visibility: config.VISIBILITY,
            register: {
                mode: config.REGISTER_MODE,
                ...(config.REGISTER_DOMAINS && { domains: config.REGISTER_DOMAINS }),
            },
            domains: {
                main: config.DOMAIN,
                links: config.LINKS_DOMAIN,
                images: config.IMAGES_DOMAIN,
                rlpProxy: config.RLP_PROXY_DOMAIN,
                redirect: config.REDIRECT_DOMAIN,
            },
            domain: config.DOMAIN,
            vapidPublicKey: config.VAPID_PUBLIC_KEY,
            cors: config.CORS,
            captcha: {
                type: config.CAPTCHA,
                siteKey:
                    config.CAPTCHA === "recaptcha"
                        ? config.RECAPTCHA_SITE_KEY
                        : config.TURNSTILE_SITE_KEY,
            },
            branding: config.BRANDING,
        });
    });
    done();
}
