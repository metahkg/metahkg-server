export interface user {
    /** mongodb object id */
    _id: string;
    /** user id */
    id: number;
    /** date string */
    createdAt: string;
    /** user email, hashed with sha256 */
    email: string;
    /** user password, hashed with bcrypt */
    pwd: string;
    /** user name */
    user: string;
    /** user sex */
    sex: "M" | "F";
    /** access key */
    key: string;
}
