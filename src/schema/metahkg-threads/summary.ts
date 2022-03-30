export interface summary {
  /** mongodb object id */
  _id: string;
  /** thread id */
  id: number;
  /** original poster */
  op: string;
  /** original poster sex */
  sex: "M" | "F";
  /** number of comments */
  c: number;
  /** upvote - downvote  */
  vote: number;
  /** thread title */
  title: string;
  /** category id */
  category: number;
  /** date string */
  lastModified: string;
  /** date string */
  createdAt: string;
  /** shortened link */
  slink: string;
}
