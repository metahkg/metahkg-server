import { parse } from "node-html-parser";
import validUrl from "valid-url";

export default function findimages(comment: string) {
    const parsed = parse(comment);
    const images: string[] = [];
    parsed.querySelectorAll("img").forEach((item) => {
        const src = item.getAttribute("src");
        if (validUrl.isHttpsUri(src)) {
            images.push(src);
        }
    });
    return images;
}
