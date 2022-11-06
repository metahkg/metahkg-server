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

import { Type } from "@sinclair/typebox";

export const ReasonSchemaUser = Type.String({
    maxLength: 100,
});

export const ReasonSchemaAdmin = Type.String({
    minLength: 1,
    maxLength: 100,
});

export const RTokenSchema = Type.String({ minLength: 1, maxLength: 1000 });

export const TitleSchema = Type.String({ minLength: 1, maxLength: 500 });
export const CommentSchema = Type.String({ minLength: 1, maxLength: 50000 });
export const VoteSchema = Type.Union([Type.Literal("U"), Type.Literal("D")]);

export const UserNameSchema = Type.RegEx(/^\S{1,15}$/);
export const EmailSchema = Type.String({ format: "email", maxLength: 150 });
export const SexSchema = Type.Union([Type.Literal("M"), Type.Literal("F")]);
export const UserRoleSchema = Type.Union([Type.Literal("user"), Type.Literal("admin")]);

export const DateSchema = Type.String({ format: "date-time" });

export const PasswordSchema = Type.RegEx(/^[a-f0-9]{64}$/i);
export const CodeSchema = Type.String({ minLength: 30, maxLength: 30 });

export const CategoryNameSchema = Type.String({ maxLength: 15 });
export const CategoryTagsSchema = Type.Array(Type.String({ maxLength: 15 }));

export const SessionIdSchema = Type.String({ minLength: 30, maxLength: 30 });

export const IntegerSchema = Type.Integer({ minimum: 1, maximum: 9999999999 });

export const InviteCodeSchema = Type.RegEx(/^[a-zA-Z0-9]{10}$/);
