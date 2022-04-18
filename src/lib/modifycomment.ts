import parse from "node-html-parser";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";
const jsdomwindow: any = new JSDOM("").window;
const DOMPurify = createDOMPurify(jsdomwindow);

export function modifycomment(comment: string) {
    comment = DOMPurify.sanitize(comment);
    let parsed = parse(comment);
    // eslint-disable-next-line no-loop-func
    parsed.querySelectorAll("a").forEach((item) => {
        linkinnewtab(item);
    });
    parsed.querySelectorAll("img").forEach((item) => {
        const height = Number(item.getAttribute("height"));
        if (height > 400) item.setAttribute("height", "400");
        if (height > 400 || !height) item.setAttribute("width", "auto");
    });
    return parsed.toString();
}

/**
 * It takes an HTML node and
 * sets its attributes to open in a new tab
 * @param item - The node to be modified.
 */
function linkinnewtab(item: import("node-html-parser/dist/nodes/html").default) {
    item.setAttribute("target", "_blank");
    item.setAttribute("rel", "noreferrer");
}
