import { PluginNative } from "@utils/types";
import { FluxDispatcher, UserStore } from "@webpack/common";

type ProfNative = PluginNative<typeof import("./native")>;

function native(): ProfNative {
    const n = VencordNative.pluginHelpers.prof as ProfNative | undefined;
    if (!n) throw new Error("prof: native module unavailable — fully quit & reopen Discord after building.");
    return n;
}

export type NameEffect = "solid" | "toon" | "neon" | "gradient" | "perchar";

export interface StoredProfile {
    name?: string;
    bio?: string;
    pronouns?: string;
    avatarFile?: string;
    avatarUrl?: string;
    bannerFile?: string;
    bannerUrl?: string;
    nameColor?: string;
    nameEffect?: NameEffect;
    nameColors?: string[];
    /** @deprecated migrated to nameColors */
    nameColor2?: string;
}

export interface ResolvedOverride {
    name?: string;
    bio?: string;
    pronouns?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    nameColor?: string;
    nameEffect?: NameEffect;
    nameColors?: string[];
}

let stored: Record<string, StoredProfile> = {};
let cache: Record<string, ResolvedOverride> = {};
const blobs: Record<string, string[]> = {};

function isEmpty(p: StoredProfile) {
    return !p.name && !p.bio && !p.pronouns && !p.avatarFile && !p.avatarUrl && !p.bannerFile && !p.bannerUrl && !p.nameColor && !p.nameColors?.length;
}

function hexToHsl(hex: string): [number, number, number] | null {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (d !== 0) {
        s = d / (1 - Math.abs(2 * l - 1));
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
        if (h < 0) h += 360;
    }
    return [h, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
    return `#${to(r)}${to(g)}${to(b)}`;
}

function parseRgb(hex: string): [number, number, number] {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    const n = m ? parseInt(m[1], 16) : 0;
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
    const to = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
    return `#${to(r)}${to(g)}${to(b)}`;
}

export function buildGradient(colors: string[]): string {
    const stops = colors.length ? colors : ["#ffffff"];
    return `linear-gradient(90deg, ${stops.join(", ")})`;
}

export function perCharColors(text: string, colors: string[]): string[] {
    const chars = [...text];
    const N = chars.length;
    const K = colors.length;
    if (N === 0) return [];
    if (K <= 1) return chars.map(() => colors[0] ?? "#ffffff");
    const rgbs = colors.map(parseRgb);
    const out: string[] = [];
    for (let i = 0; i < N; i++) {
        const a = i * K / N;
        const b = (i + 1) * K / N;
        const len = b - a;
        let r = 0, g = 0, bl = 0, x = a;
        while (x < b - 1e-9) {
            const block = Math.min(K - 1, Math.floor(x + 1e-9));
            const next = Math.min(b, block + 1);
            const w = (next - x) / len;
            r += rgbs[block][0] * w;
            g += rgbs[block][1] * w;
            bl += rgbs[block][2] * w;
            x = next;
        }
        out.push(rgbToHex(r, g, bl));
    }
    return out;
}

export function computeDnsVars(hex: string): Record<string, string> {
    const hsl = hexToHsl(hex);
    if (!hsl) return { "--vc-prof-dns-main": hex };
    const [h, s, l] = hsl;
    const shade = (dl: number) => hslToHex(h, s, l + dl);
    return {
        "--vc-prof-dns-main": hslToHex(h, s, l),
        "--vc-prof-dns-light-1": shade(12),
        "--vc-prof-dns-light-2": shade(36),
        "--vc-prof-dns-dark-1": shade(-24),
        "--vc-prof-dns-dark-2": shade(-48),
        "--vc-prof-dns-toon-stroke": shade(-36),
        "--vc-prof-dns-neon-stroke": hslToHex(h, s, l)
    };
}

function revoke(userId: string) {
    for (const u of blobs[userId] ?? []) {
        try { URL.revokeObjectURL(u); } catch { }
    }
    delete blobs[userId];
}

function toBlobUrl(userId: string, dataUrl: string): string {
    const comma = dataUrl.indexOf(",");
    const mime = dataUrl.slice(5, dataUrl.indexOf(";"));
    const bin = atob(dataUrl.slice(comma + 1));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: mime || "image/png" }));
    (blobs[userId] ??= []).push(url);
    return url;
}

async function resolve(userId: string, p: StoredProfile): Promise<ResolvedOverride> {
    const r: ResolvedOverride = {};
    if (p.name) r.name = p.name;
    if (p.bio) r.bio = p.bio;
    if (p.pronouns) r.pronouns = p.pronouns;
    if (p.nameColor) r.nameColor = p.nameColor;
    if (p.nameEffect) r.nameEffect = p.nameEffect;
    if (p.nameColors?.length) r.nameColors = p.nameColors;
    else if (p.nameColor2) r.nameColors = [p.nameColor!, p.nameColor2].filter(Boolean);
    if (p.avatarFile) {
        const d = await native().readImageDataUrl(p.avatarFile);
        if (d) r.avatarUrl = toBlobUrl(userId, d);
    } else if (p.avatarUrl) r.avatarUrl = p.avatarUrl;
    if (p.bannerFile) {
        const d = await native().readImageDataUrl(p.bannerFile);
        if (d) r.bannerUrl = toBlobUrl(userId, d);
    } else if (p.bannerUrl) r.bannerUrl = p.bannerUrl;
    return r;
}

export async function loadOverrides() {
    try {
        for (const id of Object.keys(blobs)) revoke(id);
        stored = JSON.parse(await native().loadProfiles()) ?? {};
        cache = {};
        for (const [id, p] of Object.entries(stored))
            cache[id] = await resolve(id, p);
    } catch (e) {
        console.error("[prof] failed to load overrides:", e);
        stored = {};
        cache = {};
    }
}

export function getOverride(userId?: string | null): ResolvedOverride | undefined {
    return userId ? cache[userId] : undefined;
}

export function getOverrideIds(): string[] {
    return Object.keys(cache);
}

export function refreshUser(userId: string) {
    try {
        const user = UserStore.getUser(userId);
        if (user) FluxDispatcher.dispatch({ type: "USER_UPDATE", user });
    } catch { }
}

export function refreshAll() {
    for (const id of Object.keys(cache)) refreshUser(id);
}

export function getStored(userId: string): StoredProfile | undefined {
    return stored[userId];
}

export async function saveOverride(userId: string, p: StoredProfile) {
    revoke(userId);
    if (isEmpty(p)) {
        delete stored[userId];
        delete cache[userId];
    } else {
        stored[userId] = p;
        cache[userId] = await resolve(userId, p);
    }
    const ok = await native().saveProfiles(JSON.stringify(stored));
    if (!ok) throw new Error("prof: failed to write profiles.json to AppData.");
}

export function setLivePreview(id: string, resolved: ResolvedOverride | undefined) {
    if (resolved && Object.keys(resolved).length) cache[id] = resolved;
    else delete cache[id];
}

export function saveImageFile(userId: string, kind: "avatar" | "banner", base64: string, ext: string) {
    return native().saveImage(userId, kind, base64, ext);
}

export function deleteImageFile(file: string) {
    return native().deleteImage(file);
}
