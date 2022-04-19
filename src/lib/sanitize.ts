import sanitizeHtml from "sanitize-html";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";
const jsdomwindow: any = new JSDOM("").window;
const DOMPurify = createDOMPurify(jsdomwindow);
export default function sanitize(html: string) {
    html = DOMPurify.sanitize(html);
    const clean = sanitizeHtml(html, {
        allowedTags: [
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "blockquote",
            "p",
            "a",
            "ul",
            "ol",
            "nl",
            "li",
            "i",
            "strong",
            "em",
            "strike",
            "code",
            "hr",
            "br",
            "table",
            "tbody",
            "tr",
            "th",
            "td",
            "pre",
            "img",
            "span",
            "u",
            "s",
            "sub",
            "sup",
            "q",
            "span",
            "video",
            "source",
            "div",
        ],
        allowedAttributes: {
            a: ["href", "name", "target", "rel"],
            img: ["src", "alt", "height", "width", "style"],
            i: ["src", "alt", "height", "width", "style"],
            video: ["src", "poster", "controls", "preload", "width", "height", "style"],
            source: ["src", "type"],
            span: ["style"],
            table: ["style", "border"],
            tr: ["style"],
            td: ["style"],
            th: ["style"],
            pre: ["class"],
            code: ["class"],
            q: ["cite"],
        },
        allowedSchemes: ["https", "mailto"],
        allowedSchemesByTag: {
            img: ["https", "data"],
            i: ["https", "data"],
        },
        transformTags: {
            a: (tagName: string, attribs: sanitizeHtml.Attributes) => {
                if (attribs.href) {
                    attribs.target = "_blank";
                    attribs.rel = "noreferrer";
                }
                return { tagName: tagName, attribs: attribs };
            },
            img: transfromImage,
            i: transfromImage,
            video: transfromImage,
        },
        allowedStyles: {
            span: {
                color: [/^#[\d\w]+$/],
                "background-color": [/^#[\d\w]+$/],
                "text-decoration": [/^(underline|line-through)$/],
            },
            img: {
                width: [/^\d+$/],
                height: [/^\d+$/],
                float: [/^(left|center|right)$/],
                display: [/^block$/],
            },
            i: {
                width: [/^\d+$/],
                height: [/^\d+$/],
                float: [/^(left|center|right)$/],
                display: [/^block$/],
            },
            video: {
                width: [/^\d+$/],
                height: [/^\d+$/],
                float: [/^(left|center|right)$/],
                display: [/^block$/],
            },
            td: {
                width: [/^\d+$/],
                height: [/^\d+$/],
            },
            tr: {
                width: [/^\d+$/],
                height: [/^\d+$/],
            },
            th: {
                width: [/^\d+$/],
                height: [/^\d+$/],
            },
            table: {
                width: [/^\d+$/],
                height: [/^\d+$/],
                "border-collapse": [/^(collapse|separate)$/],
            },
            "*": {
                "text-align": [/^(left|center|right|justify)$/],
                "vertical-align": [/^(top|middle|bottom)$/],
                "font-weight": [
                    /^(normal|bold|bolder|lighter|100|200|300|400|500|600|700|800|900)$/,
                ],
                "font-style": [/^(normal|italic|oblique)$/],
                "text-transform": [/^(none|capitalize|uppercase|lowercase)$/],
                "letter-spacing": [/^[\d\.]+$/],
                "word-spacing": [/^[\d\.]+$/],
                "line-height": [/^[\d\.]+$/],
                "list-style-type": [
                    /^(none|disc|circle|square|decimal|decimal-leading-zero|lower-roman|upper-roman|lower-greek|lower-latin|upper-latin|armenian|georgian|cjk-ideographic|hebrew|hiragana|hiragana-iroha|katakana|katakana-iroha|lower-alpha|upper-alpha|none|inherit)$/,
                ],
                "table-layout": [/^(auto|fixed)$/],
            },
        },
        allowedClasses: {
            code: [/^language-.+$/],
            pre: [/^language-.+$/],
        },
    });
    return clean;
}

function transfromImage(tagName: string, attribs: sanitizeHtml.Attributes) {
    const height = Number(attribs.height);
    if (height > 400) attribs.height = "400";
    if (height > 400 || !height) attribs.width = "auto";
    return { tagName: tagName, attribs: attribs };
}
