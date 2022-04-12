export interface category {
    /** mongodb assigned object id */
    _id: string;
    /** category id */
    id: number;
    /** category name */
    name: string;
    /** hide from not logged in users and category 1 */
    hidden?: boolean;
}
