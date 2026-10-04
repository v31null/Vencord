import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { MessageStore, SelectedChannelStore } from "@webpack/common";

import { parseMath, spans, tokenize } from "./parse";

declare const katex: any;

function pad(text: string) {
    const math = new Array<boolean>(text.length).fill(false);
    const mark = (start: number, source: string) => {
        let pos = start;
        for (const part of parseMath(source)) {
            const len = part.content.length + (part.type === "display" ? 4 : part.type === "inline" ? 2 : 0);
            if (part.type !== "text") math.fill(true, pos, pos + len);
            pos += len;
        }
    };
    for (const span of spans(text)) {
        if (span.type !== "table") {
            math.fill(true, span.start, span.end);
            continue;
        }
        let offset = span.start;
        for (const line of span.content.split("\n")) {
            let cell = offset;
            for (const part of line.split("|")) {
                mark(cell, part);
                cell += part.length + 1;
            }
            offset += line.length + 1;
        }
    }
    let out = "";
    for (let i = 0; i < text.length; i++) {
        out += text[i];
        if (text[i] === ":" && math[i] && text[i + 1] !== "\u2060") out += "\u2060";
    }
    return out;
}

export default definePlugin({
    name: "KaTeX-Integration",
    description: "Renders LaTeX formulas in messages using KaTeX",
    authors: [{ name: "V31NULL", id: 1108761945303158784n }],
    patches: [
        {
            find: ".handleSendMessage,onResize:",
            replacement: {
                match: /(let \i=\i\.\i\.parse\(\i,)(\i)\)/,
                replace: "$1$self.pad($2))"
            }
        }
    ],

    pad,

    observer: null as MutationObserver | null,

    start() {
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href =
            "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
        document.head.appendChild(style);

        const tableStyle = document.createElement("style");
        tableStyle.id = "katex-table-styles";
        tableStyle.textContent = `
            table { width: 100% !important; }
            td { text-align: center !important; }
            th { text-align: center !important; }
            tr:nth-child(even) td { background-color: rgba(0, 0, 0, 0.3) !important; }
        `;
        document.head.appendChild(tableStyle);

        const script = document.createElement("script");
        script.src =
            "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
        script.onload = () => {
            console.log("KaTeX loaded");
            const mhchem = document.createElement("script");
            mhchem.src =
                "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/mhchem.min.js";
            mhchem.onload = mhchem.onerror = () => this.startObserver();
            document.head.appendChild(mhchem);
        };
        document.head.appendChild(script);

        document.addEventListener("paste", this.onPaste, true);
    },

    stop() {
        this.observer?.disconnect();
        document.getElementById("katex-table-styles")?.remove();
        document.removeEventListener("paste", this.onPaste, true);
    },

    onPaste(event: ClipboardEvent) {
        const target = event.target as HTMLElement | null;
        if (!event.isTrusted || !target?.closest?.('[role="textbox"]')) return;
        const text = event.clipboardData?.getData("text/plain");
        if (!text) return;
        const padded = pad(text);
        if (padded === text) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        const data = new DataTransfer();
        data.setData("text/plain", padded);
        target.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    },

    startObserver() {
        this.observer = new MutationObserver(() => {
            this.processMessages();
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        this.processMessages();
    },

    extractRawText(node: Node): string {
        if (node.nodeType === 3) return node.textContent ?? "";
        if (node.nodeType === 1) {
            const el = node as HTMLElement;
            if (el.tagName === "BR") return "\n";
            if (el.tagName === "IMG" && el.hasAttribute("alt"))
                return el.getAttribute("alt") || "";

            const inner = Array.from(el.childNodes)
                .map((c) => this.extractRawText(c))
                .join("");

            if (el.tagName === "EM") return "*" + inner + "*";
            if (el.tagName === "STRONG") return "**" + inner + "**";
            if (el.tagName === "U") return "__" + inner + "__";
            if (el.tagName === "S") return "~~" + inner + "~~";
            return inner;
        }
        return "";
    },
    getStoredContent(msg: Element): string | null {
        const m = msg.id?.match(/^message-content-(\d+)$/);
        if (!m) return null;
        try {
            const channelId = SelectedChannelStore.getChannelId();
            const stored = MessageStore.getMessage(channelId, m[1]);
            return stored?.content ?? null;
        } catch {
            return null;
        }
    },
    newMacros(): Record<string, string> {
        return {
            "\\vtonull":
                "\\underline{\\raisebox{-0.74ex}{V}\\kern{-0.15em}31\\raisebox{-0.74ex}{\\kern{-0.08em}$n$}}",
        };
    },

    renderMath(content: string, isDisplay: boolean, raw: boolean, macros: Record<string, string>): Node {
        const unpadded = content.replace(/:\u2060/g, ":");
        const formula = raw
            ? unpadded
            : unpadded
                .replace(/\\\[/g, "\\\\[")
                .replace(/\\(?=[\s\n]|$)/g, "\\\\");
        try {
            const span = document.createElement("span");
            span.innerHTML = katex.renderToString(formula, {
                displayMode: isDisplay,
                throwOnError: false,
                trust: (ctx: { command: string; protocol?: string; }) =>
                    (ctx.command === "\\href" || ctx.command === "\\url") &&
                    /^https?$/.test(ctx.protocol ?? ""),
                macros,
                maxSize: 10,
            });
            const clamp = (el: HTMLElement, prop: "marginRight" | "bottom", min: number) => {
                const value = parseFloat(el.style[prop]);
                if (value < min) el.style[prop] = `${min}em`;
            };
            span.querySelectorAll<HTMLElement>(".mspace").forEach((el) => clamp(el, "marginRight", -2));
            span.querySelectorAll<HTMLElement>(".rule").forEach((el) => clamp(el, "bottom", -10));
            return span;
        } catch (e) {
            const delim = isDisplay ? "$$" : "$";
            return document.createTextNode(delim + content + delim);
        }
    },

    renderInline(text: string, raw: boolean, macros: Record<string, string>): HTMLSpanElement {
        const container = document.createElement("span");
        const parts = parseMath(text);

        parts.forEach((part) => {
            if (part.type === "display" || part.type === "inline") {
                container.appendChild(
                    this.renderMath(part.content, part.type === "display", raw, macros)
                );
            } else {
                container.appendChild(document.createTextNode(part.content));
            }
        });
        return container;
    },

    renderFormatted(text: string, raw: boolean, macros: Record<string, string>): HTMLSpanElement {
        const math = new Map<
            number,
            { end: number; content: string; display: boolean; }
        >();
        let pos = 0;
        parseMath(text).forEach((part) => {
            const len =
                part.content.length +
                (part.type === "display" ? 4 : part.type === "inline" ? 2 : 0);
            if (part.type !== "text")
                math.set(pos, {
                    end: pos + len,
                    content: part.content,
                    display: part.type === "display",
                });
            pos += len;
        });

        const markers = [
            { open: "**", close: "**", tag: "strong" },
            { open: "__", close: "__", tag: "u" },
            { open: "~~", close: "~~", tag: "s" },
            { open: "*", close: "*", tag: "em" },
            { open: "_", close: "_", tag: "em" },
            ...["b", "strong", "i", "em", "u", "s", "del", "sub", "sup"].map(
                (t) => ({ open: `<${t}>`, close: `</${t}>`, tag: t })
            ),
        ];

        const word = /[\p{L}\p{N}]/u;
        const at = (i: number, s: string) =>
            text.slice(i, i + s.length).toLowerCase() === s;
        const canOpen = (s: string, i: number) =>
            at(i, s) &&
            (s.length > 1 || (!!text[i + 1] && !/\s/.test(text[i + 1]))) &&
            (s !== "_" || !word.test(text[i - 1] ?? ""));
        const canClose = (s: string, i: number) =>
            at(i, s) &&
            (s.length > 1 || (!!text[i - 1] && !/\s/.test(text[i - 1]))) &&
            (s !== "_" || !word.test(text[i + 1] ?? ""));

        const failed = new Set<string>();
        const parse = (
            start: number,
            close: string | null
        ): { nodes: Node[]; end: number; closed: boolean; } => {
            const nodes: Node[] = [];
            let buf = "";
            let i = start;
            const flush = () => {
                if (buf) nodes.push(document.createTextNode(buf));
                buf = "";
            };

            while (i < text.length) {
                const m = math.get(i);
                if (m) {
                    flush();
                    nodes.push(this.renderMath(m.content, m.display, raw, macros));
                    i = m.end;
                    continue;
                }

                const closing = close !== null && canClose(close, i);
                const candidates = closing
                    ? markers.filter(
                        (k) =>
                            k.open.length > close!.length &&
                            k.open.startsWith(close!)
                    )
                    : markers;

                let opened: { el: HTMLElement; end: number; } | null = null;
                for (const k of candidates) {
                    const key = `${i + k.open.length}|${k.close}`;
                    if (!canOpen(k.open, i) || failed.has(key)) continue;
                    const inner = parse(i + k.open.length, k.close);
                    if (!inner.closed || !inner.nodes.length) {
                        if (!inner.closed) failed.add(key);
                        continue;
                    }
                    const el = document.createElement(k.tag);
                    el.append(...inner.nodes);
                    opened = { el, end: inner.end };
                    break;
                }
                if (opened) {
                    flush();
                    nodes.push(opened.el);
                    i = opened.end;
                    continue;
                }

                if (closing) {
                    flush();
                    return { nodes, end: i + close!.length, closed: true };
                }

                buf += text[i];
                i++;
            }

            flush();
            return { nodes, end: i, closed: false };
        };

        const container = document.createElement("span");
        container.append(...parse(0, null).nodes);
        return container;
    },

    renderTable(lines: string[], raw: boolean, macros: Record<string, string>): HTMLTableElement {
        const table = document.createElement("table");
        table.style.cssText =
            "border-collapse:collapse;margin:8px 0;width:100%;";

        const rows = lines.filter((l) => l.trim().startsWith("|"));
        let headerParsed = false;

        rows.forEach((line, i) => {
            const cells = line
                .split("|")
                .slice(1, -1)
                .map((c) => c.trim());
            const isSeparator = cells.every((c) => /^:?-+:?$/.test(c));
            if (isSeparator) return;

            const tr = document.createElement("tr");
            const isHeader = !headerParsed;

            cells.forEach((cellText) => {
                const cell = document.createElement(isHeader ? "th" : "td");
                cell.style.cssText =
                    "border:1px solid #4e4e5a;padding:6px 12px;text-align:left;";
                if (isHeader) cell.style.background = "#2b2d31";
                cell.appendChild(this.renderFormatted(cellText, raw, macros));
                tr.appendChild(cell);
            });

            if (isHeader) {
                const thead = document.createElement("thead");
                thead.appendChild(tr);
                table.appendChild(thead);
                headerParsed = true;
            } else {
                let tbody = table.querySelector("tbody");
                if (!tbody) {
                    tbody = document.createElement("tbody");
                    table.appendChild(tbody);
                }
                const rowIndex = tbody.querySelectorAll("tr").length;
                if (rowIndex % 2 === 1) tr.style.background = "rgba(0,0,0,0.3)";
                tbody.appendChild(tr);
            }
        });

        return table;
    },

    renderInPlace(msg: Element, raw: string) {
        const found = spans(raw);
        if (!found.length) return;

        const texts: Text[] = [];
        const walker = document.createTreeWalker(msg, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) texts.push(walker.currentNode as Text);

        const positions = (ch: string) => {
            const out: Array<[Text, number]> = [];
            texts.forEach((t) => {
                for (let i = 0; i < t.data.length; i++)
                    if (t.data[i] === ch) out.push([t, i]);
            });
            return out;
        };
        const masked = raw.replace(/```[\s\S]*?```|`[^`\n]*`/g, (m) => " ".repeat(m.length));
        const spoiler = new Set<number>();
        for (const m of masked.matchAll(/\|\|([\s\S]+?)\|\|/g)) {
            const end = m.index! + m[0].length;
            [m.index!, m.index! + 1, end - 2, end - 1].forEach((n) => spoiler.add(n));
        }
        const indices = (ch: string) => {
            const out: number[] = [];
            for (let i = 0; i < raw.length; i++)
                if (raw[i] === ch && !(ch === "|" && spoiler.has(i))) out.push(i);
            return out;
        };
        const rawAt = { "$": indices("$"), "|": indices("|") };
        const dom = { "$": positions("$"), "|": positions("|") };
        const before = (ch: "$" | "|", pos: number) => rawAt[ch].filter((n) => n < pos).length;
        const inCode = (n: Node) => !!n.parentElement?.closest("code, pre");

        const macros = this.newMacros();
        const jobs: Array<{
            node: Node;
            table: boolean;
            start: [Text, number];
            end: [Text, number];
            rawEnd: number;
        }> = [];
        for (const span of found) {
            const ch = span.type === "table" ? "|" : "$";
            if (dom[ch].length !== rawAt[ch].length) continue;
            const start = dom[ch][before(ch, span.start)];
            const end = dom[ch][before(ch, span.end) - 1];
            if (!start || !end || inCode(start[0]) || inCode(end[0])) continue;
            const node =
                span.type === "table"
                    ? this.renderTable(span.content.split("\n"), true, macros)
                    : this.renderMath(span.content, span.type === "display", true, macros);
            jobs.push({ node, table: span.type === "table", start, end, rawEnd: span.end });
        }

        jobs.reverse().forEach(({ node, table, start, end, rawEnd }) => {
            const range = document.createRange();
            range.setStart(start[0], start[1]);
            const after = end[1] + 1;
            range.setEnd(
                end[0],
                table && end[0].data[after] === "\n" ? after + 1 : after
            );
            const link = end[0].parentElement?.closest("a");
            if (link && msg.contains(link)) {
                const rest = document.createRange();
                rest.setStart(end[0], after);
                rest.setEndAfter(link);
                const leftover = rest.toString();
                if (leftover && !raw.startsWith(leftover, rawEnd)) range.setEndAfter(link);
            }
            range.deleteContents();
            range.insertNode(node);
        });
    },

    processMessages() {
        const rawTargets = document.querySelectorAll(
            '[id^="message-content-"], [id^="message-username-"] > span,div[data-text-variant]'
        );

        const targets = Array.from(rawTargets).filter((node) => {
            let parent = node.parentElement;
            while (parent) {
                if (Array.from(rawTargets).includes(parent)) return false;
                parent = parent.parentElement;
            }
            return true;
        });

        targets.forEach((msg: Element) => {
            if (msg.getAttribute("data-katex-processed")) return;

            const stored = this.getStoredContent(msg);
            const text = stored != null ? stored : this.extractRawText(msg);
            if (!text.includes("$") && !text.includes("|")) return;

            if (stored != null) {
                this.renderInPlace(msg, stored);
                msg.setAttribute("data-katex-processed", "true");
                return;
            }

            const tokens = tokenize(text);
            const macros = this.newMacros();
            msg.innerHTML = "";

            tokens.forEach((token, idx) => {
                if (token.type === "table") {
                    msg.appendChild(
                        this.renderTable(token.content.split("\n"), false, macros)
                    );
                } else if (token.type === "katex") {
                    const line = this.renderInline(token.content, false, macros);
                    msg.appendChild(line);
                    if (idx < tokens.length - 1)
                        msg.appendChild(document.createElement("br"));
                } else {
                    msg.appendChild(document.createTextNode(token.content));
                    if (idx < tokens.length - 1)
                        msg.appendChild(document.createElement("br"));
                }
            });

            msg.setAttribute("data-katex-processed", "true");
        });
    },
});
