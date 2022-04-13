export type user = {
    id: number;
    createdAt: Date;
    email: string;
    pwd: string;
    name: string;
    sex: "M" | "F";
};

export type userSexType = "M" | "F";
