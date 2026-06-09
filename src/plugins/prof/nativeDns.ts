import { findByProps } from "@webpack";

import { getOverride, ResolvedOverride } from "./data";

let EffectEnum: Record<string, number> | undefined;
function effects(): Record<string, number> | undefined {
    return EffectEnum ??= findByProps("SOLID", "TOON", "NEON", "GRADIENT", "GLOW", "POP");
}

function hexToInt(hex: string): number {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    return m ? parseInt(m[1], 16) : 0;
}

const EFFECT_KEY: Record<string, string> = {
    solid: "SOLID",
    toon: "TOON",
    neon: "NEON",
    gradient: "GRADIENT",
    perchar: "GRADIENT"
};

const dnsCache = new WeakMap<object, any>();

export function nativeDns(o?: ResolvedOverride): any {
    if (!o) return null;
    if (dnsCache.has(o)) return dnsCache.get(o);

    const colors = (o.nameColors?.length ? o.nameColors : o.nameColor ? [o.nameColor] : []).map(hexToInt);
    let result: any = null;
    if (colors.length) {
        const e = effects();
        const key = EFFECT_KEY[o.nameEffect ?? "solid"] ?? "SOLID";
        const effectId = e?.[key] ?? e?.SOLID ?? 0;
        result = { effectId, colors, fontId: 0 };
    }

    dnsCache.set(o, result);
    return result;
}

export function installDnsAccessor(user: any) {
    if (!user || user.__profDns) return;
    try {
        let backing = user.displayNameStyles;
        Object.defineProperty(user, "displayNameStyles", {
            configurable: true,
            enumerable: true,
            get() {
                try {
                    return nativeDns(getOverride(user.id)) ?? backing;
                } catch {
                    return backing;
                }
            },
            set(v) { backing = v; }
        });
        Object.defineProperty(user, "__profDns", { value: true, configurable: true, enumerable: false });
    } catch { }
}
