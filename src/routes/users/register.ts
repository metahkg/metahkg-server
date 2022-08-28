import { RecaptchaSecret, usersCl, verificationCl, inviteCl } from "../../common";
import { mg, mgDomain, verifyMsg } from "../../lib/mailgun";
import EmailValidator from "email-validator";
import { verifyCaptcha } from "../../lib/recaptcha";
import bcrypt from "bcrypt";
import { generate } from "wcyat-rg";
import { Static, Type } from "@sinclair/typebox";
import hash from "hash.js";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import dotenv from "dotenv";
import { agenda } from "../../lib/agenda";

dotenv.config();

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object(
        {
            name: Type.RegEx(/^\S{1,15}$/),
            // check if password is a sha256 hash
            pwd: Type.RegEx(/^[a-f0-9]{64}$/i),
            email: Type.String({ format: "email" }),
            rtoken: Type.String(),
            sex: Type.Union([Type.Literal("M"), Type.Literal("F")]),
            invitecode: Type.Optional(Type.String()),
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/register",
        { schema: { body: schema } },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            if (EmailValidator.validate(req.body.name))
                return res.code(400).send({ error: "Bad request." });

            const { name, pwd, email, rtoken, sex, invitecode } = req.body;

            if (!(await verifyCaptcha(RecaptchaSecret, rtoken)))
                return res.code(429).send({ error: "Recaptcha token invalid." });

            // register modes (process.env.register)
            const registerMode =
                {
                    normal: "normal",
                    none: "none",
                    invite: "invite",
                }[process.env.register || ""] || "normal";

            if (registerMode === "none")
                return res.code(400).send({ error: "Registration disabled." });

            // TODO: WARNING: frontend not implemented !!!
            if (
                registerMode === "invite" &&
                !(await inviteCl.findOne({ code: invitecode }))
            )
                return res.code(400).send({ error: "Invalid invite code." });

            if (
                (await usersCl.findOne({
                    $or: [{ name }, { email: hash.sha256().update(email).digest("hex") }],
                })) ||
                (await verificationCl.findOne({
                    $or: [{ name }, { email }],
                }))
            )
                return res.code(409).send({ error: "Username or email already in use." });

            const code = generate({
                include: { numbers: true, upper: true, lower: true, special: false },
                digits: 30,
            });

            await mg.messages.create(mgDomain, verifyMsg({ email, code }));

            const hashedPwd = await bcrypt.hash(pwd, 10);
            await verificationCl.insertOne({
                createdAt: new Date(),
                code,
                email,
                pwd: hashedPwd,
                name,
                sex,
                type: "register",
            });

            await agenda.every(
                "1 day",
                "updateVerificationCode",
                { email },
                { startDate: new Date(new Date().getTime() + 86400 * 1000) }
            );

            res.send({ success: true });
        }
    );
    done();
};
