export type user = {
    id: number;
    createdAt: Date;
    email: string;
    pwd: string;
    name: string;
    sex: userSex;
};

export type userSex = "M" | "F";
export type userRole = "admin" | "user";
