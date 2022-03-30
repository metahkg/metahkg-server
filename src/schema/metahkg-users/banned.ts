/** banned ips (no account creation allowed) */
export interface banned {
    /** mongodb object id */
    _id: string;
    /** ip address (e.g. 1.1.1.1) */
    ip: string;
}