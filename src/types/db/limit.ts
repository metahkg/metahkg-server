export type limitType = "resend" | "reset" | "create";
export interface limits {
    /** mongodb object id */
    _id: string;
    /** type of limit (resend verification email / reset password / create topics) */
    type: limitType;
    /** user email (for resend / reset) (hashed with sha256 if is reset) */
    email?: string;
    /** user id (for create) */
    id?: number;
}
