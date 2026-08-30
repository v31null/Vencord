import type { MessageObject } from "@api/MessageEvents";
import definePlugin from "@utils/types";
import { MessageActions, UserStore } from "@webpack/common";

const EmptyStart = /^\p{White_Space}/u;

function getLimit() {
    return UserStore.getCurrentUser().premiumType === 2 ? 4000 : 2000;
}

function getPartLimit(text: string, limit: number) {
    return EmptyStart.test(text) ? limit - 1 : limit;
}

function cut(text: string, limit: number) {
    let end = limit;
    if (/^[\uDC00-\uDFFF]$/.test(text[end]) && /^[\uD800-\uDBFF]$/.test(text[end - 1])) end--;
    return [text.slice(0, end), text.slice(end)] as const;
}

function split(text: string, limit: number) {
    const chunks: string[] = [];
    let current: string | null = null;

    for (let line of text.split("\n")) {
        if (line.length > getPartLimit(line, limit)) {
            if (current) chunks.push(current);
            current = null;
            while (line.length > getPartLimit(line, limit)) {
                const [part, rest] = cut(line, getPartLimit(line, limit));
                chunks.push(part);
                line = rest;
            }
            if (line) current = line;
            continue;
        }

        const next = current === null ? line : `${current}\n${line}`;
        if (next.length <= getPartLimit(next, limit)) {
            current = next;
        } else {
            if (current) chunks.push(current);
            current = line;
        }
    }

    if (current) chunks.push(current);
    return chunks.map(chunk => EmptyStart.test(chunk) ? `\u200D${chunk}` : chunk);
}

export default definePlugin({
    name: "Split",
    description: "No txt.",
    authors: [{ name: "V31NULL", id: 1108761945303158784n }],
    patches: [
        {
            find: "Message Too Long Alert",
            replacement: {
                match: /let (\i)=\i\?\i\.\i:\i\.\i;/,
                replace: "let $1=1e9;"
            }
        },
        {
            find: "convertedStringToFile",
            replacement: {
                match: /\.uploadLongMessages\?\i\?\?\i:null/,
                replace: ".uploadLongMessages?null:null"
            }
        }
    ],
    onBeforeMessageSend(channelId, message) {
        const limit = getLimit();
        if (message.content.length <= limit) return;

        const chunks = split(message.content, limit);
        message.content = chunks.shift()!;
        setTimeout(() => this.send(channelId, message, chunks));
    },
    async send(channelId: string, message: MessageObject, chunks: string[]) {
        for (const content of chunks) {
            await MessageActions.sendMessage(channelId, { ...message, content }, false, {});
        }
    }
});
