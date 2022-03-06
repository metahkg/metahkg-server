import axios from "axios";
export async function verify(secret: string, token: string) {
  const verify = await axios.get(
    `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`
  );
  return verify.data.success;
}
