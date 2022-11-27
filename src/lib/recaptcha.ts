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

import axios from "axios";

/**
 * It verifies that the user is a human.
 * @param {string} secret - The secret key that you got from the Google reCAPTCHA site
 * @param {string} token - The token you got from the user's browser.
 * @returns The `verify` function returns a promise that resolves to a boolean.
 */
export async function verifyCaptcha(secret: string, token: string) {
    try {
        const { data } = await axios.get<{
            success: boolean;
            /** timestamp */
            challenge_ts: string;
            hostname: string;
            error_codes?: number[];
        }>(
            `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`
        );
        return data.success;
    } catch {
        return false;
    }
}
