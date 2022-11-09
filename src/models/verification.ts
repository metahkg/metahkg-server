import { userSex } from "./user";

export type Verification = (
    | {
          type: "register";
          createdAt: Date;
          // hashed password (bcrypt)
          password: string;
          // username
          name: string;
          sex: userSex;
      }
    | {
          type: "reset";
      }
) & {
    // hashed email (sha256)
    email: string;
    // verification code (30-digit)
    code: string;
};
