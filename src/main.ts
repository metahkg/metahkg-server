import dotenv from "dotenv";
import updateVerificationCode from "./lib/updateVerificationCode";
import { client } from "./common";
import { setup } from "./mongo/setupmongo";
import MetahkgServer from "./app";

dotenv.config();

setInterval(updateVerificationCode, 3600 * 1000);

(async () => {
    await client.connect();
    await setup();

    const app = await MetahkgServer();

    /**
     * The port can be modified in .env
     */
    await app.listen(Number(process.env.port) || 3200, "0.0.0.0", (err: Error) => {
        if (err) console.log(err);
        console.log(`listening at port ${process.env.port || 3200}`);
    });
})();
