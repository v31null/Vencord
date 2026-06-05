import definePlugin from "@utils/types";

export default definePlugin({
    name: "Þorn",
    description: "Normalise text.",
    authors: [{ name: "V31NULL", id: 1108761945303158784n }],

    observer: null as MutationObserver | null,

    start() {
        this.walk(document.body);
        this.observer = new MutationObserver(mutations => {
            mutations.forEach(m => m.addedNodes.forEach(n => this.walk(n)));
        });
        this.observer.observe(document.body, { childList: true, subtree: true });
    },

    stop() {
        this.observer?.disconnect();
    },

    isLetter(c: string) { return /[a-zA-ZÞþÐðÆæ]/.test(c); },
    isDigit(c: string) { return /[0-9]/.test(c); },

cardinalValues: {
        zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9,
        ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15,
        sixteen:16, seventeen:17, eighteen:18, nineteen:19,
        twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90,
        hundred:100, thousand:1000, million:1000000, billion:1000000000,
    } as Record<string, number>,

    irregularOrdinals: {
        first:"one", second:"two", third:"three", fifth:"five", eighth:"eight",
        ninth:"nine", twelfth:"twelve",
        twentieth:"twenty", thirtieth:"thirty", fortieth:"forty", fiftieth:"fifty",
        sixtieth:"sixty", seventieth:"seventy", eightieth:"eighty", ninetieth:"ninety",
        hundredth:"hundred", thousandth:"thousand", millionth:"million", billionth:"billion",
    } as Record<string, string>,

    resolveOrdinalTerminal(w: string): string | null {
        if (this.irregularOrdinals[w]) return this.irregularOrdinals[w];
        if (w.endsWith("th")) {
            const stem = w.slice(0, -2);
            if (this.cardinalValues[stem] !== undefined) return stem;
        }
        return null;
    },

    parseEnglishNumber(tokens: string[]): number | null {
        let total = 0, chunk = 0;
        for (const t of tokens) {
            const v = this.cardinalValues[t];
            if (v === undefined) return null;
            if (v === 100)      chunk = (chunk || 1) * 100;
            else if (v >= 1000) { total += (chunk || 1) * v; chunk = 0; }
            else                chunk += v;
        }
        return total + chunk;
    },

    ordinalSuffix(n: number): string {
        const t = n % 10, h = n % 100;
        if (h >= 11 && h <= 13) return "ᵗʰ";
        if (t === 1) return "ˢᵗ";
        if (t === 2) return "ⁿᵈ";
        if (t === 3) return "ʳᵈ";
        return "ᵗʰ";
    },

    ordinalRe: null as RegExp | null,

    getOrdinalRe(): RegExp {
        if (this.ordinalRe) return this.ordinalRe;
        const cardPat = Object.keys(this.cardinalValues).sort((a, b) => b.length - a.length).join("|");
        const ordTerminals = [
            "first","second","third","fourth","fifth","sixth","seventh","eighth","ninth","tenth",
            "eleventh","twelfth","thirteenth","fourteenth","fifteenth","sixteenth","seventeenth",
            "eighteenth","nineteenth","twentieth","thirtieth","fortieth","fiftieth","sixtieth",
            "seventieth","eightieth","ninetieth","hundredth","thousandth","millionth","billionth",
        ].sort((a, b) => b.length - a.length).join("|");
        this.ordinalRe = new RegExp(`\\b((?:(?:${cardPat})[- ])*(?:${ordTerminals}))(ly)?\\b`, "gi");
        return this.ordinalRe;
    },

    normalizeOrdinals(text: string): string {
        return text.replace(this.getOrdinalRe(), (_, phrase: string, ly: string) => {
            const words = phrase.toLowerCase().split(/[- ]+/);
            const cardinalLast = this.resolveOrdinalTerminal(words[words.length - 1]);
            if (!cardinalLast) return _;
            const n = this.parseEnglishNumber([...words.slice(0, -1), cardinalLast]);
            if (n === null) return _;
            return n + this.ordinalSuffix(n) + (ly || "");
        });
    },

    ordinalContext(res: string) {
        if (!res.length) return false;
        const a = res[res.length - 1];
        if (this.isDigit(a)) return true;
        return false;
    },

    convertText(text: string) {
        text = this.normalizeOrdinals(text);
         text = text.replace(/\bThe /g, 'Þͤ ').replace(/\bTHE /g, 'Þͤ ').replace(/\bTHe /g, 'Þͤ ').replace(/\bthe /g, 'þͤ ');
        let res = "";
        let i = 0;
        while (i < text.length) {
            const c    = text[i];
            const next = text[i + 1] || "";
            if (this.ordinalContext(res)) {
                if ((c === "s" || c === "S") && (next === "t" || next === "T")) { res += "ˢᵗ"; i += 2; continue; }
                if ((c === "n" || c === "N") && (next === "d" || next === "D")) { res += "ⁿᵈ"; i += 2; continue; }
                if ((c === "r" || c === "R") && (next === "d" || next === "D")) { res += "ʳᵈ"; i += 2; continue; }
                if ((c === "t" || c === "T") && (next === "h" || next === "H")) { res += "ᵗʰ"; i += 2; continue; }
            }
            if ((c === "t" || c === "T") && (next === "h" || next === "H")) {
                const upper = c === "T";
                const þorn = upper ? "Þ" : "þ";
                const eð   = upper ? "Ð" : "ð";
                const prev = res.length ? res[res.length - 1] : "";
                res += !this.isLetter(prev) ? þorn : (Math.random() < 0.5 ? þorn : eð);
                i += 2;
                continue;
            }
            res += c;
            i++;
        }
        return res;
    },
walk(node: Node) {
    const el = node.nodeType === 1 ? (node as HTMLElement) : node.parentElement;
    if (el) {
        if (el.tagName === "INPUT" || 
            el.tagName === "TEXTAREA" || 
            el.tagName === "SCRIPT" || 
            el.tagName === "STYLE" || 
            el.isContentEditable || 
            !!el.closest('[contenteditable="true"]')) {
            return;
        }
    }

    if (node.nodeType === Node.TEXT_NODE) {
        const converted = this.convertText(node.textContent ?? "");
        if (converted !== node.textContent) node.textContent = converted;
        return;
    }

    node.childNodes.forEach(child => this.walk(child));
}
});