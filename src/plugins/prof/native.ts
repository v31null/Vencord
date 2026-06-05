import { IpcMainInvokeEvent } from "electron";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { homedir } from "os";
import { extname, join } from "path";

const MIME: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp"
};

function baseDir() {
    const base =
        process.env.LOCALAPPDATA ||
        (process.platform === "darwin"
            ? join(homedir(), "Library", "Application Support")
            : process.env.XDG_DATA_HOME || join(homedir(), ".local", "share"));
    return join(base, "Vencord", "prof");
}

function imagesDir() {
    return join(baseDir(), "images");
}

function profFile() {
    return join(baseDir(), "profiles.json");
}

export async function loadProfiles(_: IpcMainInvokeEvent): Promise<string> {
    try {
        return readFileSync(profFile(), "utf8");
    } catch {
        return "{}";
    }
}

export async function saveProfiles(_: IpcMainInvokeEvent, json: string): Promise<boolean> {
    try {
        mkdirSync(baseDir(), { recursive: true });
        writeFileSync(profFile(), json, "utf8");
        return true;
    } catch {
        return false;
    }
}

export async function saveImage(_: IpcMainInvokeEvent, userId: string, kind: string, base64: string, ext: string): Promise<string | null> {
    try {
        mkdirSync(imagesDir(), { recursive: true });
        const safeExt = (ext || "png").replace(/[^a-z0-9]/gi, "").toLowerCase() || "png";
        const file = `${userId}-${kind}.${safeExt}`;
        for (const e of Object.keys(MIME)) {
            if (e === safeExt) continue;
            const stale = join(imagesDir(), `${userId}-${kind}.${e}`);
            try { if (existsSync(stale)) rmSync(stale); } catch { }
        }
        writeFileSync(join(imagesDir(), file), Buffer.from(base64, "base64"));
        return file;
    } catch {
        return null;
    }
}

export async function readImageDataUrl(_: IpcMainInvokeEvent, file: string): Promise<string | null> {
    try {
        const buf = readFileSync(join(imagesDir(), file));
        const ext = extname(file).slice(1).toLowerCase();
        const mime = MIME[ext] || "image/png";
        return `data:${mime};base64,${buf.toString("base64")}`;
    } catch {
        return null;
    }
}

export async function deleteImage(_: IpcMainInvokeEvent, file: string): Promise<void> {
    try { rmSync(join(imagesDir(), file)); } catch { }
}

export async function getProfilesPath(_: IpcMainInvokeEvent): Promise<string> {
    return profFile();
}
