export function error404(res: any) {
  res.status(404);
  res.send({ error: "Not found." });
}
