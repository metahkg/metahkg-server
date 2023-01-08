/*
 Copyright (C) 2022-present Metahkg Contributors

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import dotenv from "dotenv";
import MetahkgServer from "./app";
import { config } from "./lib/config";

dotenv.config();

(async () => {
    const app = await MetahkgServer();

    const port = config.PORT;
    /**
     * The port can be modified in .env
     */
    app.listen({ port, host: "0.0.0.0" }, (err: Error) => {
        if (err) throw err;
    });
})();
