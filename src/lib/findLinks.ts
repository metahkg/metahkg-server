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

import { parse } from "node-html-parser";
import validUrl from "valid-url";
import { HMACSign } from "./hmac";

export default function findLinks(comment: string) {
    const parsed = parse(comment);
    const links: { url: string; signature: string }[] = [];
    parsed.querySelectorAll("a").forEach((item) => {
        const url = item.getAttribute("href");
        if (validUrl.isHttpsUri(url) || validUrl.isHttpUri(url)) {
            links.push({ url: url, signature: HMACSign(url) });
        }
    });
    return links;
}
