import type { MessageObject } from "@api/MessageEvents";
import { spans } from "@plugins/katex/parse";
import definePlugin from "@utils/types";
import { MessageActions, UserStore } from "@webpack/common";

const EmptyStart = /^\p{White_Space}/u;

function getLimit() {
    return UserStore.getCurrentUser().premiumType === 2 ? 4000 : 2000;
}

function getPartLimit(text: string, limit: number) {
    return EmptyStart.test(text) ? limit - 1 : limit;
}

function split(text: string, limit: number) {
    const ranges = spans(text).map(s => [s.start, s.end] as const);
    const inside = (i: number) => ranges.find(([a, b]) => a < i && i < b);
    const chunks: string[] = [];
    let pos = 0;

    while (pos < text.length) {
        const max = getPartLimit(text.slice(pos), limit);
        if (text.length - pos <= max) {
            chunks.push(text.slice(pos));
            break;
        }

        let newline = text.lastIndexOf("\n", pos + max);
        while (newline > pos && inside(newline)) newline = text.lastIndexOf("\n", newline - 1);
        if (newline > pos) {
            chunks.push(text.slice(pos, newline));
            pos = newline + 1;
            continue;
        }

        let end = pos + max;
        if (/^[\uDC00-\uDFFF]$/.test(text[end]) && /^[\uD800-\uDBFF]$/.test(text[end - 1])) end--;
        const atom = inside(end);
        if (atom) end = atom[0];
        if (end <= pos) return null;
        chunks.push(text.slice(pos, end));
        pos = end;
    }

    return chunks.filter(Boolean).map(chunk => EmptyStart.test(chunk) ? `\u200D${chunk}` : chunk);
}

export default definePlugin({
    name: "Split",
    description: "No txt.",
    authors: [{ name: "V31NULL", id: 1108761945303158784n }],
    patches: [
        {
            find: "Message Too Long Alert",
            replacement: [
                {
                    match: /let (\i)=(\i\?\i\.\i:\i\.\i);if\((\i)\.length>\1\)/,
                    replace: "let $1=$self.getMaxLength($3,$2);if($3.length>$1)"
                },
                {
                    match: /if\(\i\|\|null==\i\)(?=\{var \i;\i=\i\.length)/,
                    replace: "if(!0)"
                }
            ]
        },
        {
            find: "convertedStringToFile",
            replacement: {
                match: /\.uploadLongMessages\?\i\?\?\i:null/,
                replace: ".uploadLongMessages?null:null"
            }
        }
    ],
    getMaxLength(content: string, max: number) {
        return content.length <= max || split(content, getLimit()) ? 1e9 : max;
    },
    onBeforeMessageSend(channelId, message) {
        const limit = getLimit();
        if (message.content.length <= limit) return;

        const chunks = split(message.content, limit);
        if (!chunks) return { cancel: true };
        message.content = chunks.shift()!;
        setTimeout(() => this.send(channelId, message, chunks));
    },
    async send(channelId: string, message: MessageObject, chunks: string[]) {
        for (const content of chunks) {
            await MessageActions.sendMessage(channelId, { ...message, content }, false, {});
        }
    }
});
