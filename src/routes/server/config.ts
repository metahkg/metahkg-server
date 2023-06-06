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
            domain: config.DOMAIN,
            linksDomain: config.LINKS_DOMAIN,
            vapidPublicKey: config.VAPID_PUBLIC_KEY,
            cors: config.CORS,
            captcha: config.CAPTCHA,
            branding: config.BRANDING,
        });
    });
    done();
}
