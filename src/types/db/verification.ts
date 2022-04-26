export type verification =
    | {
          /** verification type */
          type: "register";
          /** mongodb object id */
          _id: string;
          /** date string (account create date) */
          createdAt: string;
          /** verification code */
          code: string;
          /** user email (unhashed) */
          email: string;
          /** user password (hashed with bcrypt) */
          pwd: string;
          /** user name */
          name: string;
          /** user sex */
          sex: "M" | "F";
      }
    | {
          /** verification type */
          type: "reset";
          /** verification code */
          code: string;
          /** user email (hashed with sha256) */
          email: string;
      };
