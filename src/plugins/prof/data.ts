import { PluginNative } from "@utils/types";

type ProfNative = PluginNative<typeof import("./native")>;

function native(): ProfNative {
    const n = VencordNative.pluginHelpers.prof as ProfNative | undefined;
    if (!n) throw new Error("prof: native module unavailable — fully quit & reopen Discord after building.");
    return n;
}

export interface StoredProfile {
    name?: string;
    bio?: string;
    pronouns?: string;
    avatarFile?: string;
    avatarUrl?: string;
    bannerFile?: string;
    bannerUrl?: string;
}

export interface ResolvedOverride {
    name?: string;
    bio?: string;
    pronouns?: string;
    avatarUrl?: string;
    bannerUrl?: string;
}

let stored: Record<string, StoredProfile> = {};
let cache: Record<string, ResolvedOverride> = {};
const blobs: Record<string, string[]> = {};

function isEmpty(p: StoredProfile) {
    return !p.name && !p.bio && !p.pronouns && !p.avatarFile && !p.avatarUrl && !p.bannerFile && !p.bannerUrl;
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
