import dotenv from "dotenv";
import MetahkgServer from "./app";

dotenv.config();

(async () => {
    const app = await MetahkgServer();

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
