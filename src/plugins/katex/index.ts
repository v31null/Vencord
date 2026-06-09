import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { MessageStore, SelectedChannelStore } from "@webpack/common";

declare const katex: any;

export default definePlugin({
    name: "KaTeX-Integration",
    description: "Renders LaTeX formulas in messages using KaTeX",
    authors: [{ name: "V31NULL", id: 1108761945303158784n }],

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
            this.startObserver();
        };
        document.head.appendChild(script);
    },

    stop() {
        this.observer?.disconnect();
        document.getElementById("katex-table-styles")?.remove();
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
    parseMath(
        text: string
    ): Array<{ type: "text" | "display" | "inline"; content: string }> {
        const parts: Array<{
            type: "text" | "display" | "inline";
            content: string;
        }> = [];
        let currentText = "";
        let i = 0;

        while (i < text.length) {
            if (text.startsWith("$$", i)) {
                let j = i + 2;
                let found = false;
                while (j < text.length) {
                    if (text.startsWith("$$", j)) {
                        if (currentText)
                            parts.push({ type: "text", content: currentText });
                        currentText = "";
                        parts.push({
                            type: "display",
                            content: text.slice(i + 2, j),
                        });
                        i = j + 2;
                        found = true;
                        break;
                    }
                    j++;
                }
                if (!found) {
                    currentText += "$$";
                    i += 2;
                }
            } else if (text[i] === "$") {
                let j = i + 1;
                let braces = 0;
                let escaped = false;
                let found = false;

                while (j < text.length) {
                    if (escaped) {
                        escaped = false; // Skip the escaped character
                    } else if (text[j] === "\\") {
                        escaped = true;
                    } else if (text[j] === "{") {
                        braces++; // Increase brace depth
                    } else if (text[j] === "}") {
                        braces--; // Decrease brace depth
                    } else if (text[j] === "$" && braces === 0) {
                        // Only close the math block if we aren't inside nested braces!
                        if (currentText)
                            parts.push({ type: "text", content: currentText });
                        currentText = "";
                        parts.push({
                            type: "inline",
                            content: text.slice(i + 1, j),
                        });
                        i = j + 1;
                        found = true;
                        break;
                    }
                    j++;
                }
                if (!found) {
                    currentText += "$";
                    i++;
                }
            } else {
                currentText += text[i];
                i++;
            }
        }
        if (currentText) parts.push({ type: "text", content: currentText });
        return parts;
    },
    renderInline(text: string): HTMLSpanElement {
        const container = document.createElement("span");
        const parts = this.parseMath(text);

        parts.forEach((part) => {
            if (part.type === "display" || part.type === "inline") {
                const isDisplay = part.type === "display";
                let formula = part.content
                    .replace(/\\\[/g, "\\\\[")
                    .replace(/\\(?=[\s\n]|$)/g, "\\\\");
                try {
                    const span = document.createElement("span");
                    span.innerHTML = katex.renderToString(formula, {
                        displayMode: isDisplay,
                        throwOnError: false,
                        macros: {
                            "\\vtonull":
                                "\\underline{\\raisebox{-0.74ex}{V}\\kern{-0.15em}31\\raisebox{-0.74ex}{\\kern{-0.08em}$n$}}",
                        },
                    });
                    container.appendChild(span);
                } catch (e) {
                    const delim = isDisplay ? "$$" : "$";
                    container.appendChild(
                        document.createTextNode(delim + part.content + delim)
                    );
                }
            } else {
                container.appendChild(document.createTextNode(part.content));
            }
        });
        return container;
    },

    renderTable(lines: string[]): HTMLTableElement {
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
                cell.appendChild(this.renderInline(cellText));
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

    tokenize(
        text: string
    ): Array<{ type: "table" | "katex" | "text"; content: string }> {
        const tokens: Array<{
            type: "table" | "katex" | "text";
            content: string;
        }> = [];
        const lines = text.split("\n");
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];

            if (line.trim().startsWith("|")) {
                const tableLines: string[] = [];
                while (i < lines.length && lines[i].trim().startsWith("|")) {
                    tableLines.push(lines[i]);
                    i++;
                }
                tokens.push({ type: "table", content: tableLines.join("\n") });
                continue;
            }

            const displayCount = (line.match(/\$\$/g) || []).length;
            if (displayCount % 2 !== 0) {
                const mathLines: string[] = [line];
                i++;
                while (i < lines.length) {
                    mathLines.push(lines[i]);
                    if (lines[i].includes("$$")) {
                        i++;
                        break;
                    }
                    i++;
                }
                tokens.push({ type: "katex", content: mathLines.join("\n") });
                continue;
            }

            const hasMath = this.parseMath(line).some((p) => p.type !== "text");
            if (hasMath) {
                tokens.push({ type: "katex", content: line });
            } else {
                tokens.push({ type: "text", content: line });
            }
            i++;
        }

        return tokens;
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

            const tokens = this.tokenize(text);
            msg.innerHTML = "";

            tokens.forEach((token, idx) => {
                if (token.type === "table") {
                    msg.appendChild(
                        this.renderTable(token.content.split("\n"))
                    );
                } else if (token.type === "katex") {
                    const line = this.renderInline(token.content);
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
