import { ObjectId } from "mongodb";
import type { userSex, userRole } from "../models/user";

export type Thread =
    | { _id?: ObjectId; id: number; removed: true }
    | {
          id: number;
          title: string;
          op: publicUserType;
          category: number;
          count: number;
          conversation: commentType[];
          score: number;
          lastModified: Date;
          createdAt: Date;
          slink: string;
          images: { src: string; cid: number }[];
          pin?: commentType;
          _id?: ObjectId;
          admin?: Admin;
      };

export type publicUserType = {
    id: number;
    name: string;
    role: userRole;
    sex: userSex;
};

export type commentContentType =
    | {
          type: "html";
          html: string;
          text: string;
      }
    | {
          type: "image";
          src: string;
      }
    | {
          type: "video";
          src: string;
      }
    | {
          type: "poll";
          pollId: string;
      };

export type commentType =
    /** if removed */
    | { id: number; removed: true }
    | {
          /** comment id */
          id: number;
          /** user id */
          user: publicUserType;
          /** html string */
          content: commentContentType;
          /** comment converted to text */
          text: string;
          /** date string */
          createdAt: Date;
          /** shortened link */
          slink: string;
          images: string[];
          /** upvotes */
          U?: number;
          /** downvotes */
          D?: number;
          /** replies */
          replies?: number[];
          /** quote **/
          quote?: commentType;
          emotions?: Emotion[];
          admin?: Admin;
      };

export interface Emotion {
    user: number;
    emotion: string /* must be emoji */;
}

export interface Admin {
    edits?: [{ admin: AdminUser; reason: string; date: Date }];
    replies?: [{ admin: AdminUser; reply: string; date: Date }];
}

export type AdminUser = publicUserType & { role: "admin" };

export default Thread;
export type threadType = Thread;
