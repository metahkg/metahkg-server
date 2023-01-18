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

import sanitizeHtml from "sanitize-html";
import DOMPurify from "isomorphic-dompurify";
import { parse, TextNode } from "node-html-parser";

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
            p: ["style"],
            a: ["href", "name", "target", "rel"],
            img: ["src", "alt", "height", "width", "style"],
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
        allowedSchemes: ["http", "https", "mailto"],
        allowedSchemesByTag: {
            img: ["http", "https", "data"],
        },
        transformTags: {
            a: (tagName: string, attribs: sanitizeHtml.Attributes) => {
                if (attribs.href) {
                    attribs.target = "_blank";
                    attribs.rel = "noreferrer";
                }
                return { tagName, attribs };
            },
        },
        allowedStyles: {
            span: {
                color: [
                    /^#[\d\w]+$/,
                    /^rgb\(\d{1,3}\, ?\d{1,3}\, ?\d{1,3}\)$/,
                    /^rgba\(\d{1,3}\, ?\d{1,3}\, ?\d{1,3}\, ?\d{1,3})$/,
                ],
                "background-color": [
                    /^#[\d\w]+$/,
                    /^rgb\(\d{1,3}\, ?\d{1,3}\, ?\d{1,3}\)$/,
                    /^rgba\(\d{1,3}\, ?\d{1,3}\, ?\d{1,3}\, ?\d{1,3})$/,
                ],
                "text-decoration": [/^(underline|line-through)$/],
            },
            img: {
                width: [/^\d+$/],
                height: [/^\d+$/],
                float: [/^(left|center|right)$/],
                display: [/^block$/],
                "margin-left": [/^auto$/],
                "margin-right": [/^auto$/],
            },
            video: {
                width: [/^\d+$/],
                height: [/^\d+$/],
                float: [/^(left|center|right)$/],
                display: [/^block$/],
                "margin-left": [/^auto$/],
                "margin-right": [/^auto$/],
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
                "font-size": [/^\d{1,2}(pt|px)$/],
                "font-style": [/^(normal|italic|oblique)$/],
                "text-transform": [/^(none|capitalize|uppercase|lowercase)$/],
                "letter-spacing": [/^[\d.]+$/],
                "word-spacing": [/^[\d.]+$/],
                "line-height": [/^[\d.]+$/],
                "list-style-type": [
                    /^(disc|circle|square|decimal|decimal-leading-zero|lower-roman|upper-roman|lower-greek|lower-latin|upper-latin|armenian|georgian|cjk-ideographic|hebrew|hiragana|hiragana-iroha|katakana|katakana-iroha|lower-alpha|upper-alpha|none|inherit)$/,
                ],
                "table-layout": [/^(auto|fixed)$/],
            },
        },
        allowedClasses: {
            code: [/^language-.+$/],
            pre: [/^language-.+$/],
        },
    });
    const parsed = parse(clean);
    if (parsed.firstChild instanceof TextNode || parsed.lastChild instanceof TextNode) {
        const marginTop = parsed.firstChild instanceof TextNode ? "15px" : "0px";
        const marginBottom = parsed.lastChild instanceof TextNode ? "15px" : "0px";

        return `<p style="margin-top: ${marginTop}; margin-bottom: ${marginBottom};">${parsed.toString()}</p>`;
    }
    return clean;
}
