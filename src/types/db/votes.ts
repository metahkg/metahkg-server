interface votes {
    _id: string;
    // mongodb object id
    id: number;
    //user id (number)
    [threadId: number]: {
        [commentId: number]: "U" | "D";
    };
}
