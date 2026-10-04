export function parseMath(
    text: string
): Array<{ type: "text" | "display" | "inline"; content: string }> {
    const parts: Array<{
        type: "text" | "display" | "inline";
        content: string;
    }> = [];
    let currentText = "";
    let i = 0;

    while (i < text.length) {
        if (text[i] === "\\" && i + 1 < text.length) {
            currentText += text.slice(i, i + 2);
            i += 2;
        } else if (text.startsWith("$$", i)) {
            let j = i + 2;
            let found = false;
            while (j < text.length) {
                if (text[j] === "\n" && /^[^\S\n]*(\n|$)/.test(text.slice(j + 1))) break;
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
            let close = -1;
            let first = -1;

            while (j < text.length) {
                if (text[j] === "\n" && /^[^\S\n]*(\n|$)/.test(text.slice(j + 1))) {
                    break;
                } else if (escaped) {
                    escaped = false;
                } else if (text[j] === "\\") {
                    escaped = true;
                } else if (text[j] === "{") {
                    braces++;
                } else if (text[j] === "}") {
                    braces--;
                } else if (text[j] === "$") {
                    if (first < 0) first = j;
                    if (braces === 0) {
                        close = j;
                        break;
                    }
                }
                j++;
            }
            if (close < 0) close = first;
            if (close >= 0) {
                if (currentText)
                    parts.push({ type: "text", content: currentText });
                currentText = "";
                parts.push({
                    type: "inline",
                    content: text.slice(i + 1, close),
                });
                i = close + 1;
            } else {
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
}

export function tokenize(
    text: string
): Array<{ type: "table" | "katex" | "text"; content: string }> {
    const tokens: Array<{
        type: "table" | "katex" | "text";
        content: string;
    }> = [];
    const lines = text.split("\n");
    const lineOf: number[] = [];
    lines.forEach((line, n) => {
        for (let c = 0; c <= line.length; c++) lineOf.push(n);
    });

    const isRow = (n: number) =>
        n < lines.length && /^\|(?!\|)/.test(lines[n].trim());
    const isSeparator = (line: string) => {
        const cells = line.trim().split("|").slice(1, -1).map((c) => c.trim());
        return cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c));
    };
    const inTable = lines.map(() => false);
    for (let n = 0; n < lines.length; n++) {
        if (inTable[n] || !isRow(n) || !isRow(n + 1) || !isSeparator(lines[n + 1])) continue;
        for (let m = n; isRow(m); m++) inTable[m] = true;
    }

    const masked = lines
        .map((line, n) => (inTable[n] ? " ".repeat(line.length) : line))
        .join("\n");
    const joined = lines.map((_, n) => n);
    const hasMath = lines.map(() => false);
    let pos = 0;
    parseMath(masked).forEach((part) => {
        const len =
            part.content.length +
            (part.type === "display" ? 4 : part.type === "inline" ? 2 : 0);
        if (part.type !== "text") {
            const first = joined[lineOf[pos]];
            const last = lineOf[pos + len - 1];
            for (let n = first; n <= last; n++) {
                joined[n] = first;
                hasMath[n] = true;
            }
        }
        pos += len;
    });

    let i = 0;
    while (i < lines.length) {
        if (inTable[i]) {
            const tableLines: string[] = [];
            while (i < lines.length && inTable[i]) {
                tableLines.push(lines[i]);
                i++;
            }
            tokens.push({ type: "table", content: tableLines.join("\n") });
            continue;
        }

        const groupLines = [lines[i]];
        const start = i;
        i++;
        while (i < lines.length && joined[i] === start) {
            groupLines.push(lines[i]);
            i++;
        }
        tokens.push({
            type: hasMath[start] ? "katex" : "text",
            content: groupLines.join("\n"),
        });
    }

    return tokens;
}

export function spans(
    text: string
): Array<{ type: "table" | "display" | "inline"; start: number; end: number; content: string; }> {
    const out: Array<{ type: "table" | "display" | "inline"; start: number; end: number; content: string; }> = [];
    let offset = 0;
    for (const token of tokenize(text)) {
        if (token.type === "table") {
            out.push({ type: "table", start: offset, end: offset + token.content.length, content: token.content });
        } else if (token.type === "katex") {
            let pos = offset;
            for (const part of parseMath(token.content)) {
                const len = part.content.length + (part.type === "display" ? 4 : part.type === "inline" ? 2 : 0);
                if (part.type !== "text") out.push({ type: part.type, start: pos, end: pos + len, content: part.content });
                pos += len;
            }
        }
        offset += token.content.length + 1;
    }
    return out;
}
