import { buildGradient, computeDnsVars, perCharColors, ResolvedOverride } from "./data";

export function renderStyledName(text: string, o?: ResolvedOverride): React.ReactNode {
    if (!o?.nameColor && !o?.nameColors?.length) return text;

    const effect = o.nameEffect ?? "solid";
    const colors = o.nameColors?.length ? o.nameColors : (o.nameColor ? [o.nameColor] : []);

    if (effect === "perchar") {
        const per = perCharColors(text, colors);
        return (
            <span className="vc-prof-dns vc-prof-dns-perchar" style={{ ["--vc-prof-dns-main" as any]: colors[0] }}>
                {[...text].map((ch, i) => <span key={i} style={{ color: per[i] }}>{ch}</span>)}
            </span>
        );
    }

    if (effect === "gradient") {
        const stops = colors.length >= 2 ? colors : [colors[0], colors[0]];
        return (
            <span className="vc-prof-dns vc-prof-dns-gradient" style={{ backgroundImage: buildGradient(stops), ["--vc-prof-dns-main" as any]: colors[0] }}>
                {text}
            </span>
        );
    }

    const base = o.nameColor ?? colors[0];
    return <span className={`vc-prof-dns vc-prof-dns-${effect}`} style={computeDnsVars(base) as any}>{text}</span>;
}
