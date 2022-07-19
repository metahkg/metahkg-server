import dotenv from "dotenv";
import updateVerificationCode from "./lib/updateVerificationCode";
import { client } from "./common";
import { setup } from "./mongo/setupmongo";
import MetahkgServer from "./app";
import fastify from "fastify";

dotenv.config();

setInterval(updateVerificationCode, 3600 * 1000);

(async () => {
    await client.connect();
    await setup();

    const app = MetahkgServer();

    console.log("got app")

    /**
     * The port can be modified in .env
     */
    app.listen(
        { port: Number(process.env.port) || 3200, host: "0.0.0.0" },
        (err: Error) => {
            if (err) console.log(err);
            console.log(`listening at port ${process.env.port || 3200}`);
        }
    );
})();
