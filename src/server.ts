import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import { autodecrement } from "./router/menu/autodecrement";
import router from "./router";
import updateVerificationCode from "./router/users/updateVerificationCode";
import { client, usersCl } from "./common";
import { setup } from "./mongo/setupmongo";
import morgan from "morgan";
import cors from "cors";
import verifyUser from "./lib/auth/verify";
import User from "./models/user";
import { createToken } from "./lib/auth/createtoken";

dotenv.config();
const app = express();
/**
 * Decrease count by one in collection "viral" every 2 hours
 */
setInterval(() => {
    setTimeout(autodecrement, 7200 * 1000);
}, 7200 * 1000);
setInterval(updateVerificationCode, 3600 * 1000);
app.disable("x-powered-by");
/**
 * Get client ip from cloudflare
 */
app.set("trust proxy", true);
/**
 * Set content security policy
 */
app.use(function (req, res, next) {
    res.setHeader(
        "Content-Security-Policy",
        "script-src 'self' https://www.gstatic.com/recaptcha/ https://www.google.com/recaptcha/ https://sa.metahkg.org https://static.cloudflareinsights.com https://cdnjs.cloudflare.com"
    );
    return next();
});

process.env.cors && app.use(cors());

app.use(morgan("dev"));

app.use(cookieParser());

app.use(async (req, res, next) => {
    const user = verifyUser(req.headers.authorization);

    if (user) {
        const userData = (await usersCl.findOne({ id: user.id })) as User;
        if (userData.name !== user.name || userData.sex !== user.sex) {
            const newToken = createToken(
                userData.id,
                userData.name,
                userData.sex,
                userData.role
            );
            req.headers.authorization = `Bearer ${newToken}`;
            res.setHeader("token", newToken);
        }
    }

    return next();
});

app.use(router);

app.use(async (req, res, next) => {
    if (req.path.startsWith("/api")) {
        res.status(404);
        res.send({ error: "Route not found." });
        return;
    }
    return next();
});

(async () => {
    await client.connect();
    await setup();
    /**
     * The port can be modified in .env
     */
    app.listen(Number(process.env.port) || 3200, () => {
        console.log(`listening at port ${process.env.port || 3200}`);
    });
})();
