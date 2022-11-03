import { Type } from "@sinclair/typebox";

export const ReasonSchemaUser = Type.String({
    maxLength: 100,
});

export const ReasonSchemaAdmin = Type.String({
    minLength: 1,
    maxLength: 100,
});

export const RTokenSchema = Type.String({ minLength: 1, maxLength: 100 });

export const TitleSchema = Type.String({ minLength: 1, maxLength: 100 });
export const CommentContentSchema = Type.Object({
    type: Type.Literal("html"),
    html: Type.String({ minLength: 1, maxLength: 10000 }),
});

export const VoteSchema = Type.Union([Type.Literal("U"), Type.Literal("D")]);

export const UserNameSchema = Type.RegEx(/^\S{1,15}$/);
export const EmailSchema = Type.String({ format: "email", maxLength: 100 });
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
