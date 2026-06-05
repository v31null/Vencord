import { fetchUserProfile, openUserProfile } from "@utils/discord";
import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { RenderModalProps } from "@vencord/discord-types";
import { findByCodeLazy, findByPropsLazy, findComponentByCodeLazy } from "@webpack";
import { Button, FluxDispatcher, IconUtils, Parser, Text, TextInput, Toasts, useEffect, useRef, UserProfileStore, UserStore, useState } from "@webpack/common";
import { applyPalette, GIFEncoder, quantize } from "gifenc";
import type { ChangeEvent } from "react";

import { deleteImageFile, getOverride, getStored, ResolvedOverride, saveImageFile, saveOverride, setLivePreview, StoredProfile } from "./data";

const ChatInputTypes = findByPropsLazy("FORM", "USER_PROFILE");
const ChannelTextArea = findComponentByCodeLazy("editorClassName", "CHANNEL_TEXT_AREA");
const createChannelRecordFromServer = findByCodeLazy(".GUILD_TEXT]", "fromServer)");

const MRoot = ModalRoot as unknown as React.FC<any>;
const MHeader = ModalHeader as unknown as React.FC<any>;
const MContent = ModalContent as unknown as React.FC<any>;
const MFooter = ModalFooter as unknown as React.FC<any>;
const MClose = ModalCloseButton as unknown as React.FC<any>;

function toast(message: string, type: any) {
    Toasts.show({ message, type, id: Toasts.genId(), options: { position: Toasts.Position.BOTTOM } });
}

function nudgeRerender(userId: string) {
    try {
        const user = UserStore.getUser(userId);
        if (user) FluxDispatcher.dispatch({ type: "USER_UPDATE", user });
    } catch { }
}

type Pending = { base64: string; ext: string; } | null;

function toDataUrl(url: string): Promise<string> {
    if (url.startsWith("data:")) return Promise.resolve(url);
    return fetch(url).then(r => r.blob()).then(b => new Promise<string>((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result as string);
        fr.onerror = () => rej(new Error("read failed"));
        fr.readAsDataURL(b);
    }));
}

function extFromDataUrl(d: string): string {
    const mime = d.slice(5, d.indexOf(";"));
    return (mime.split("/")[1] || "png").replace(/[^a-z0-9]/gi, "").toLowerCase() || "png";
}

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(new Error("file read failed"));
        r.readAsDataURL(file);
    });
}

function bytesToBase64(bytes: Uint8Array): string {
    let bin = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk)
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[]);
    return btoa(bin);
}

async function cropGif(src: string, offset: { x: number; y: number; }, scale: number, frameW: number, frameH: number, targetW: number, targetH: number): Promise<string> {
    const buf = await (await fetch(src)).arrayBuffer();
    const dec = new (window as any).ImageDecoder({ data: buf, type: "image/gif" });
    await dec.tracks.ready;
    const count = dec.tracks.selectedTrack?.frameCount ?? 1;

    const m = Math.max(targetW, targetH);
    const k = m > 256 ? 256 / m : 1;
    const gw = Math.max(1, Math.round(targetW * k));
    const gh = Math.max(1, Math.round(targetH * k));

    const canvas = document.createElement("canvas");
    canvas.width = gw;
    canvas.height = gh;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const gif = GIFEncoder();

    for (let i = 0; i < count; i++) {
        const { image } = await dec.decode({ frameIndex: i });
        ctx.clearRect(0, 0, gw, gh);
        ctx.drawImage(image, -offset.x / scale, -offset.y / scale, frameW / scale, frameH / scale, 0, 0, gw, gh);
        const { data } = ctx.getImageData(0, 0, gw, gh);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        const delay = image.duration ? Math.max(20, Math.round(image.duration / 1000)) : 100;
        gif.writeFrame(index, gw, gh, { palette, delay });
        image.close();
    }

    gif.finish();
    return `data:image/gif;base64,${bytesToBase64(gif.bytes())}`;
}

function CropModal({ src, isGif, frameW, frameH, targetW, targetH, onApply, props }: { src: string; isGif: boolean; frameW: number; frameH: number; targetW: number; targetH: number; onApply: (d: string, ext: string) => void; props: RenderModalProps; }) {
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [nat, setNat] = useState<{ w: number; h: number; } | null>(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [busy, setBusy] = useState(false);
    const drag = useRef<{ x: number; y: number; ox: number; oy: number; } | null>(null);

    useEffect(() => {
        const img = new Image();
        img.onload = () => { imgRef.current = img; setNat({ w: img.width, h: img.height }); };
        img.src = src;
    }, [src]);

    const baseScale = nat ? Math.max(frameW / nat.w, frameH / nat.h) : 1;
    const scale = baseScale * zoom;
    const dispW = nat ? nat.w * scale : 0;
    const dispH = nat ? nat.h * scale : 0;

    function clamp(o: { x: number; y: number; }) {
        return {
            x: Math.min(0, Math.max(frameW - dispW, o.x)),
            y: Math.min(0, Math.max(frameH - dispH, o.y))
        };
    }

    useEffect(() => {
        if (!nat) return;
        const bs = Math.max(frameW / nat.w, frameH / nat.h);
        setOffset({ x: (frameW - nat.w * bs) / 2, y: (frameH - nat.h * bs) / 2 });
    }, [nat]);

    useEffect(() => { setOffset(o => clamp(o)); }, [zoom]);

    function down(e: any) {
        drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
        e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    function move(e: any) {
        if (!drag.current) return;
        setOffset(clamp({ x: drag.current.ox + (e.clientX - drag.current.x), y: drag.current.oy + (e.clientY - drag.current.y) }));
    }
    function up() { drag.current = null; }

    async function apply() {
        const img = imgRef.current;
        if (!img) return;
        if (isGif) {
            setBusy(true);
            try {
                onApply(await cropGif(src, offset, scale, frameW, frameH, targetW, targetH), "gif");
            } catch (e) {
                console.error("[prof] gif crop failed:", e);
                onApply(src, "gif");
            }
            props.onClose();
            return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, -offset.x / scale, -offset.y / scale, frameW / scale, frameH / scale, 0, 0, targetW, targetH);
        onApply(canvas.toDataURL("image/webp", 0.92), "webp");
        props.onClose();
    }

    const circle = frameW === frameH;

    return (
        <MRoot {...props} size={ModalSize.SMALL}>
            <MHeader>
                <Text variant="heading-lg/semibold" style={{ flexGrow: 1 }}>Crop image</Text>
                <MClose onClick={props.onClose} />
            </MHeader>
            <MContent>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "8px 0 4px" }}>
                    <div className="vc-prof-crop-area" style={{ width: frameW, height: frameH }} onPointerDown={down} onPointerMove={move} onPointerUp={up}>
                        {nat && <img src={src} alt="" draggable={false} style={{ position: "absolute", left: offset.x, top: offset.y, width: dispW, height: dispH, maxWidth: "none", userSelect: "none" }} />}
                        <div className={circle ? "vc-prof-crop-overlay vc-prof-crop-circle" : "vc-prof-crop-overlay"} />
                    </div>
                    <input className="vc-prof-crop-zoom" type="range" min={1} max={3} step={0.01} value={zoom} onChange={e => setZoom(parseFloat((e.target as HTMLInputElement).value))} />
                </div>
            </MContent>
            <MFooter>
                <div className="vc-prof-footer">
                    <Button color={Button.Colors.PRIMARY} look={Button.Looks.LINK} onClick={() => props.onClose()} disabled={busy}>Cancel</Button>
                    <Button color={Button.Colors.BRAND} onClick={apply} disabled={busy}>{busy ? "Processing…" : "Apply"}</Button>
                </div>
            </MFooter>
        </MRoot>
    );
}

function BioEditor({ value, onChange }: { value: string; onChange: (s: string) => void; }) {
    const channel = useRef(createChannelRecordFromServer({ id: "0", type: 1 })).current;
    const type = ChatInputTypes.FORM;
    type.disableAutoFocus = true;
    return (
        <div className="vc-prof-bio-wrap">
            <ChannelTextArea
                className="vc-prof-bio-native"
                channel={channel}
                type={type}
                disableThemedBackground={true}
                placeholder="About me…"
                textValue={value}
                maxCharacterCount={190}
                onChange={(...args: any[]) => {
                    const next = args.find(a => typeof a === "string");
                    if (next != null) onChange(next.slice(0, 190));
                }}
            />
        </div>
    );
}

function ReplicaCard({ name, realName, username, pronouns, avatarPreview, bannerPreview, bio }: any) {
    return (
        <div className="vc-prof-card">
            <div className="vc-prof-inner">
                <div className="vc-prof-header">
                    <div className="vc-prof-banner" style={bannerPreview ? { backgroundImage: `url(${JSON.stringify(bannerPreview)})` } : undefined} />
                    <div className="vc-prof-avatar">
                        <img src={avatarPreview} alt="" />
                    </div>
                </div>
                <div className="vc-prof-body">
                    <div>
                        <div className="vc-prof-name-row">
                            <div className="vc-prof-name">{name || realName}</div>
                        </div>
                        <div className="vc-prof-user-row">
                            <span className="vc-prof-usertag">{username}</span>
                            {pronouns && <>
                                <div className="vc-prof-dot" />
                                <span className="vc-prof-usertag vc-prof-pronouns">{pronouns}</span>
                            </>}
                        </div>
                    </div>
                    {bio && (
                        <section>
                            <div className="vc-prof-bio">{Parser.parseGuildEventDescription(bio)}</div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

function EditProfileModal({ user, props }: { user: any; props: RenderModalProps; }) {
    const rec = getStored(user.id) ?? {};
    const resolved = getOverride(user.id) ?? {};
    const [profile, setProfile] = useState<any>(() => UserProfileStore.getUserProfile?.(user.id));

    const realName: string = user.globalName || user.username;
    const realAvatar: string = IconUtils.getUserAvatarURL(user, true, 512);
    const realBanner: string = profile?.banner
        ? IconUtils.getUserBannerURL?.({ id: user.id, banner: profile.banner, canAnimate: true, size: 1024 }) ?? ""
        : "";
    const realBio: string = profile?.bio ?? "";
    const realPronouns: string = profile?.pronouns ?? "";

    const [name, setName] = useState<string>(rec.name ?? realName ?? "");
    const [bio, setBio] = useState<string>(rec.bio ?? realBio ?? "");
    const [pronouns, setPronouns] = useState<string>(rec.pronouns ?? realPronouns ?? "");
    const [avatarPreview, setAvatarPreview] = useState<string>(resolved.avatarUrl ?? realAvatar ?? "");
    const [bannerPreview, setBannerPreview] = useState<string>(resolved.bannerUrl ?? realBanner ?? "");
    const [bioKey, setBioKey] = useState(0);

    const avatarUpload = useRef<Pending>(null);
    const bannerUpload = useRef<Pending>(null);
    const avatarTouched = useRef(false);
    const bannerTouched = useRef(false);
    const avatarInput = useRef<HTMLInputElement>(null);
    const bannerInput = useRef<HTMLInputElement>(null);
    const importInput = useRef<HTMLInputElement>(null);

    const originalOverride = useRef(getOverride(user.id));
    const committed = useRef(false);
    const prefilled = useRef(false);

    useEffect(() => {
        let cancelled = false;
        fetchUserProfile(user.id)
            .then(p => { if (!cancelled && p) setProfile(p); })
            .catch(e => console.error("[prof] fetch profile failed:", e));
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!profile || prefilled.current) return;
        prefilled.current = true;
        if (rec.bio == null && bio === "" && profile.bio) {
            setBio(profile.bio);
            setBioKey(k => k + 1);
        }
        if (rec.pronouns == null && pronouns === "" && profile.pronouns) setPronouns(profile.pronouns);
        const hasBannerOverride = !!resolved.bannerUrl || !!rec.bannerFile || !!rec.bannerUrl;
        if (!hasBannerOverride && bannerPreview === "" && realBanner) setBannerPreview(realBanner);
    }, [profile]);

    function currentResolved(): ResolvedOverride {
        const r: ResolvedOverride = {};
        if (name.trim() && name.trim() !== realName) r.name = name.trim();
        if (bio.trim() && bio !== realBio) r.bio = bio;
        if (pronouns.trim() && pronouns.trim() !== realPronouns) r.pronouns = pronouns.trim();
        const avatarChanged = avatarTouched.current ? !!avatarUpload.current : (!!rec.avatarFile || !!rec.avatarUrl);
        if (avatarChanged) r.avatarUrl = avatarPreview;
        const bannerChanged = bannerTouched.current ? !!bannerUpload.current : (!!rec.bannerFile || !!rec.bannerUrl);
        if (bannerChanged) r.bannerUrl = bannerPreview;
        return r;
    }

    useEffect(() => {
        setLivePreview(user.id, currentResolved());
    }, [name, bio, pronouns, avatarPreview, bannerPreview]);

    useEffect(() => () => {
        if (!committed.current) {
            setLivePreview(user.id, originalOverride.current);
            nudgeRerender(user.id);
        }
    }, []);

    function onPick(setPreview: (s: string) => void, uploadRef: { current: Pending; }, touchedRef: { current: boolean; }, tw: number, th: number, fw: number, fh: number) {
        return async (e: ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            let raw: string;
            try {
                raw = await readFileAsDataUrl(file);
            } catch (err) {
                console.error("[prof] image read failed:", err);
                toast("Could not read that image", Toasts.Type.FAILURE);
                return;
            }
            openModal(p => (
                <CropModal
                    src={raw}
                    isGif={file.type === "image/gif"}
                    frameW={fw}
                    frameH={fh}
                    targetW={tw}
                    targetH={th}
                    props={p}
                    onApply={(d, ext) => {
                        uploadRef.current = { base64: d.split(",")[1], ext };
                        touchedRef.current = true;
                        setPreview(d);
                    }}
                />
            ));
        };
    }

    function removeImage(setPreview: (s: string) => void, real: string, uploadRef: { current: Pending; }, touchedRef: { current: boolean; }) {
        uploadRef.current = null;
        touchedRef.current = true;
        setPreview(real);
    }

    async function resolveSlot(kind: "avatar" | "banner", touched: boolean, upload: Pending, existingFile: string | undefined, existingUrl: string | undefined, out: StoredProfile) {
        if (touched) {
            if (upload) {
                const f = await saveImageFile(user.id, kind, upload.base64, upload.ext);
                if (f) (out as any)[`${kind}File`] = f;
            } else if (existingFile) {
                await deleteImageFile(existingFile);
            }
        } else if (existingFile) {
            (out as any)[`${kind}File`] = existingFile;
        } else if (existingUrl) {
            (out as any)[`${kind}Url`] = existingUrl;
        }
    }

    async function save() {
        try {
            const out: StoredProfile = {};
            if (name.trim() && name.trim() !== realName) out.name = name.trim();
            if (bio.trim() && bio !== realBio) out.bio = bio;
            if (pronouns.trim() && pronouns.trim() !== realPronouns) out.pronouns = pronouns.trim();

            await resolveSlot("avatar", avatarTouched.current, avatarUpload.current, rec.avatarFile, rec.avatarUrl, out);
            await resolveSlot("banner", bannerTouched.current, bannerUpload.current, rec.bannerFile, rec.bannerUrl, out);

            committed.current = true;
            await saveOverride(user.id, out);
            nudgeRerender(user.id);
            toast("Local profile saved", Toasts.Type.SUCCESS);
            props.onClose();
        } catch (e: any) {
            committed.current = false;
            console.error("[prof] save failed:", e);
            toast(e?.message ?? "Save failed", Toasts.Type.FAILURE);
        }
    }

    async function resetAll() {
        try {
            if (rec.avatarFile) await deleteImageFile(rec.avatarFile);
            if (rec.bannerFile) await deleteImageFile(rec.bannerFile);
            committed.current = true;
            await saveOverride(user.id, {});
            nudgeRerender(user.id);
            toast("Reset to real profile", Toasts.Type.SUCCESS);
            props.onClose();
        } catch (e: any) {
            committed.current = false;
            console.error("[prof] reset failed:", e);
            toast(e?.message ?? "Reset failed", Toasts.Type.FAILURE);
        }
    }

    function openNative() {
        setLivePreview(user.id, currentResolved());
        nudgeRerender(user.id);
        try { openUserProfile(user.id); } catch (e) { console.error("[prof] openUserProfile failed:", e); }
    }

    async function exportProfile() {
        try {
            const r = currentResolved();
            const bundle: any = { v: 1, name: r.name, pronouns: r.pronouns, bio: r.bio };
            if (r.avatarUrl) bundle.avatar = await toDataUrl(r.avatarUrl);
            if (r.bannerUrl) bundle.banner = await toDataUrl(r.bannerUrl);
            const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `prof-${user.username}.json`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            toast("Profile exported", Toasts.Type.SUCCESS);
        } catch (e: any) {
            console.error("[prof] export failed:", e);
            toast(e?.message ?? "Export failed", Toasts.Type.FAILURE);
        }
    }

    async function importProfile(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        try {
            const bundle = JSON.parse(await file.text());
            if (bundle.name != null) setName(String(bundle.name));
            if (bundle.pronouns != null) setPronouns(String(bundle.pronouns));
            if (bundle.bio != null) {
                setBio(String(bundle.bio));
                setBioKey(k => k + 1);
            }
            if (typeof bundle.avatar === "string") {
                avatarUpload.current = { base64: bundle.avatar.split(",")[1], ext: extFromDataUrl(bundle.avatar) };
                avatarTouched.current = true;
                setAvatarPreview(bundle.avatar);
            }
            if (typeof bundle.banner === "string") {
                bannerUpload.current = { base64: bundle.banner.split(",")[1], ext: extFromDataUrl(bundle.banner) };
                bannerTouched.current = true;
                setBannerPreview(bundle.banner);
            }
            toast("Profile imported — review, then Save", Toasts.Type.SUCCESS);
        } catch (err: any) {
            console.error("[prof] import failed:", err);
            toast("Could not read that file", Toasts.Type.FAILURE);
        }
    }

    return (
        <MRoot {...props} size={ModalSize.LARGE} className="vc-prof-modal">
            <MHeader>
                <Text variant="heading-lg/semibold" style={{ flexGrow: 1 }}>Local Profile — {user.username}</Text>
                <MClose onClick={props.onClose} />
            </MHeader>

            <MContent>
                <div className="vc-prof-layout">
                    <div className="vc-prof-form">
                        <div className="vc-prof-section">
                            <div className="vc-prof-eyebrow-row">
                                <h5 className="vc-prof-eyebrow">Display name</h5>
                                <span className="vc-prof-field-count">{name.length}/32</span>
                            </div>
                            <TextInput value={name} onChange={setName} placeholder={realName} maxLength={32} />
                        </div>

                        <div className="vc-prof-section">
                            <h5 className="vc-prof-eyebrow">Pronouns</h5>
                            <TextInput value={pronouns} onChange={setPronouns} placeholder={realPronouns || "Add your pronouns"} maxLength={40} />
                        </div>

                        <div className="vc-prof-section">
                            <h5 className="vc-prof-eyebrow">Avatar</h5>
                            <div className="vc-prof-btn-row">
                                <Button size={Button.Sizes.SMALL} onClick={() => avatarInput.current?.click()}>Change avatar</Button>
                                <Button size={Button.Sizes.SMALL} color={Button.Colors.PRIMARY} look={Button.Looks.LINK} onClick={() => removeImage(setAvatarPreview, realAvatar, avatarUpload, avatarTouched)}>Remove</Button>
                            </div>
                            <input ref={avatarInput} type="file" accept="image/*" style={{ display: "none" }} onChange={onPick(setAvatarPreview, avatarUpload, avatarTouched, 512, 512, 280, 280)} />
                        </div>

                        <div className="vc-prof-section">
                            <h5 className="vc-prof-eyebrow">Banner</h5>
                            <div className="vc-prof-btn-row">
                                <Button size={Button.Sizes.SMALL} onClick={() => bannerInput.current?.click()}>Change banner</Button>
                                <Button size={Button.Sizes.SMALL} color={Button.Colors.PRIMARY} look={Button.Looks.LINK} onClick={() => removeImage(setBannerPreview, realBanner, bannerUpload, bannerTouched)}>Remove</Button>
                            </div>
                            <input ref={bannerInput} type="file" accept="image/*" style={{ display: "none" }} onChange={onPick(setBannerPreview, bannerUpload, bannerTouched, 600, 240, 300, 120)} />
                        </div>

                        <div className="vc-prof-section">
                            <h5 className="vc-prof-eyebrow">Bio</h5>
                            <BioEditor key={bioKey} value={bio} onChange={setBio} />
                        </div>
                    </div>

                    <div className="vc-prof-preview-col">
                        <h5 className="vc-prof-eyebrow" style={{ alignSelf: "flex-start" }}>Preview</h5>
                        <ReplicaCard name={name} realName={realName} username={user.username} pronouns={pronouns} avatarPreview={avatarPreview} bannerPreview={bannerPreview} bio={bio} />
                        <Button size={Button.Sizes.SMALL} look={Button.Looks.LINK} color={Button.Colors.PRIMARY} onClick={openNative}>
                            Open in real Discord profile ↗
                        </Button>
                    </div>
                </div>
            </MContent>

            <MFooter>
                <div className="vc-prof-footer">
                    <div className="vc-prof-footer-left">
                        <Button size={Button.Sizes.SMALL} color={Button.Colors.PRIMARY} look={Button.Looks.LINK} onClick={() => importInput.current?.click()}>Import</Button>
                        <Button size={Button.Sizes.SMALL} color={Button.Colors.PRIMARY} look={Button.Looks.LINK} onClick={exportProfile}>Export</Button>
                        <input ref={importInput} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={importProfile} />
                    </div>
                    <Button color={Button.Colors.PRIMARY} look={Button.Looks.LINK} onClick={() => props.onClose()}>Cancel</Button>
                    <Button color={Button.Colors.PRIMARY} look={Button.Looks.LINK} onClick={resetAll}>Reset to real profile</Button>
                    <Button color={Button.Colors.BRAND} onClick={save}>Save</Button>
                </div>
            </MFooter>
        </MRoot>
    );
}

export function openEditProfileModal(user: any) {
    openModal(props => <EditProfileModal user={user} props={props} />);
}
