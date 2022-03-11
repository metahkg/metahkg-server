import axios from "axios";
/**
 * It verifies that the user is a human.
 * @param {string} secret - The secret key that you got from the Google reCAPTCHA site
 * @param {string} token - The token you got from the user's browser.
 * @returns The `verify` function returns a promise that resolves to a boolean.
 */
export async function verify(secret: string, token: string) {
  const verify = await axios.get(
    `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`,
  );
  return verify.data.success;
}
