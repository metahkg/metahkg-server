/*
 Copyright (C) 2022-present Metahkg Contributors

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { ObjectId } from "mongodb";
import type { userSex, userRole } from "./user";

export type Thread =
    | { id: number; removed: true }
    | {
          id: number;
          title: string;
          op: publicUserType;
          category: number;
          count: number;
          conversation: Comment[];
          score: number;
          lastModified: Date;
          createdAt: Date;
          slink: string;
          images: Images;
          pin?: Comment;
          _id?: ObjectId;
          admin?: Admin;
      };

export type publicUserType = {
    id: number;
    name: string;
    role: userRole;
    sex: userSex;
};

export type Image = { src: string; cid: number };
export type Images = Image[];

export type Comment =
    /** if removed */
    | { id: number; removed: true }
    | {
          /** comment id */
          id: number;
          /** user id */
          user: publicUserType;
          /** html string */
          comment: string;
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
          quote?: Comment;
          emotions?: Emotion[];
          admin?: Admin;
      };

export interface Emotion {
    user: number;
    emotion: string /* must be emoji */;
}

export interface Admin {
    edits?: { admin: AdminUser; reason: string; date: Date }[];
    replies?: { admin: AdminUser; reply: string; date: Date }[];
}

export type AdminUser = publicUserType & { role: "admin" };

export default Thread;
export type threadType = Thread;
