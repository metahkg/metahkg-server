export function error400(res: any) {
    res.status(400);
    res.send({ error: "Bad request." });
}
