import dotenv from "dotenv";
import { client } from "./common";
import { setup } from "./mongo/setupmongo";
import MetahkgServer from "./app";
import { agenda } from "./lib/agenda";

dotenv.config();

(async () => {
    await client.connect();
    await setup();
    await agenda.start();

    const app = MetahkgServer();

    /**
     * The port can be modified in .env
     */
    app.listen(
        { port: Number(process.env.port) || 3200, host: "0.0.0.0" },
        (err: Error) => {
            if (err) throw err;
            console.log(`listening at port ${process.env.port || 3200}`);
        }
    );
})();
