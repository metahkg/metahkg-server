import { ObjectId } from "mongodb";
import { userSex } from "./user";

export type Verification = (
    | {
          type: "register";
          createdAt: Date;
          /** hashed password (bcrypt) **/
          password: string;
          /** username */
          name: string;
          sex: userSex;
      }
    | {
          type: "reset";
      }
) & {
    _id?: ObjectId;
    /** hashed email (sha256) */
    email: string;
    /** verification code (60-digit) */
    code: string;
};
