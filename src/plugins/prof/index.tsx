import "./styles.css";

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import definePlugin from "@utils/types";
import { User } from "@vencord/discord-types";
import { IconUtils, Menu, UsernameUtils, UserStore } from "@webpack/common";

import { getOverride, getOverrideIds, loadOverrides, refreshAll } from "./data";
import { openEditProfileModal } from "./EditProfileModal";
import { renderStyledName } from "./nameStyle";
import { installDnsAccessor } from "./nativeDns";

const restorers: Array<() => void> = [];

function wrap(obj: any, key: string, make: (orig: (...args: any[]) => any) => (...args: any[]) => any) {
    if (!obj || typeof obj[key] !== "function") return;
    const orig = obj[key];
    obj[key] = make(orig);
    restorers.push(() => { obj[key] = orig; });
}

function findUserId(args: any[]): string | undefined {
    const u = args.find(a => a && typeof a === "object" && typeof a.id === "string");
    return u?.id;
}

const UserContext: NavContextMenuPatchCallback = (children, { user }: { user?: User; }) => {
    if (!user) return;
    const group = findGroupChildrenByChildId("user-profile", children) ?? children;
    group.push(
        <Menu.MenuItem
            id="vc-prof-edit"
            label="Edit Local Profile"
            action={() => openEditProfileModal(user)}
        />
    );
};

export default definePlugin({
    name: "prof",
    description: "Custom profile.",
    authors: [{ name: "V31NULL", id: 1108761945303158784n }],
    contextMenus: {
        "user-context": UserContext
    },
    patches: [
        {
            find: "UserProfileStore",
            replacement: {
                match: /getUserProfile\((\i)\){return (.+?)(?=})/,
                replace: "getUserProfile($1){return $self.profileHook($2,$1)"
            }
        },
        {
            find: ':"SHOULD_LOAD");',
            replacement: {
                match: /\i(?:\?)?\.getPreviewBanner\(\i,\i,\i\)(?=.{0,100}"COMPLETE")/,
                replace: "$self.bannerUrlHook(arguments[0])||$&"
            }
        },
        {
            find: ".handleImageLoad)",
            replacement: {
                match: /getSrc\(\i\)\{/,
                replace: '$&{const s=this?.props?.src;if(typeof s==="string"&&(s.startsWith("blob:")||s.startsWith("data:")))return s;}'
            }
        },
        // Chat message author name — full effect
        {
            find: '="SYSTEM_TAG"',
            replacement: {
                match: /(?<=onContextMenu:\i,children:)\i\?(?=.{0,100}?user[Nn]ame:)/,
                replace: "$self.renderAuthorName(arguments[0]),_vcProfOld:$&"
            }
        },
        // User mentions — color
        {
            find: ".USER_MENTION)",
            replacement: {
                match: /(?<=user:(\i),guildId:([^,]+?),.{0,100}?children:\i=>\i)\((\i)\)/,
                replace: "({...$3,color:$self.mentionColor($1?.id)})"
            }
        },
        // Voice users — color
        {
            find: "#{intl::GUEST_NAME_SUFFIX})]",
            replacement: {
                match: /#{intl::GUEST_NAME_SUFFIX}.{0,50}?""\](?<=guildId:(\i),.+?user:(\i).+?)/,
                replace: "$&,style:$self.voiceStyle($2.id),"
            }
        },
        // Member list — color
        {
            find: "#{intl::GUILD_OWNER}),children:",
            replacement: {
                match: /(?<=roleName:\i,)colorString:/,
                replace: "colorString:$self.listColor(arguments[0])||"
            }
        }
    ],
    renderAuthorName(props: any) {
        try {
            const author = props?.author;
            const user = props?.userOverride ?? props?.message?.author;
            const id = user?.id ?? author?.authorId;
            const prefix = props?.withMentionPrefix ? "@" : "";
            const name = author?.nick ?? user?.globalName ?? user?.username ?? "";
            return <>{prefix}{renderStyledName(name, getOverride(id))}</>;
        } catch {
            return <>{props?.author?.nick ?? ""}</>;
        }
    },
    mentionColor(userId?: string) {
        const o = getOverride(userId);
        const c = o?.nameColor ?? o?.nameColors?.[0];
        if (!c) return null;
        const n = parseInt(c.replace("#", ""), 16);
        return Number.isNaN(n) ? null : n;
    },
    voiceStyle(userId?: string) {
        const o = getOverride(userId);
        const color = o?.nameColor ?? o?.nameColors?.[0];
        return color ? { color } : undefined;
    },
    listColor(context: any) {
        const o = getOverride(context?.user?.id);
        return o?.nameColor ?? o?.nameColors?.[0] ?? null;
    },
    profileHook(profile: any, userId?: string) {
        const o = getOverride(userId ?? profile?.userId ?? profile?.id);
        if (!profile || !o || (o.bio == null && o.pronouns == null)) return profile;
        return {
            ...profile,
            ...(o.bio != null ? { bio: o.bio } : {}),
            ...(o.pronouns != null ? { pronouns: o.pronouns } : {})
        };
    },
    bannerUrlHook({ displayProfile }: any) {
        return getOverride(displayProfile?.userId)?.bannerUrl;
    },
    async start() {
        await loadOverrides();
        wrap(UsernameUtils, "getName", orig => (...args) => {
            const id = findUserId(args);
            const o = getOverride(id);
            if (o) installDnsAccessor(args.find(a => a && a.id === id));
            return o?.name || orig(...args);
        });
        wrap(UsernameUtils, "useName", orig => (...args) => {
            const real = orig(...args);
            const id = findUserId(args);
            const o = getOverride(id);
            if (o) installDnsAccessor(args.find(a => a && a.id === id));
            return o?.name || real;
        });
        wrap(IconUtils, "getUserAvatarURL", orig => (user, ...rest) => getOverride(user?.id)?.avatarUrl || orig(user, ...rest));
        wrap(IconUtils, "getUserBannerURL", orig => (data, ...rest) => getOverride(data?.id)?.bannerUrl || orig(data, ...rest));

        const me = UserStore.getCurrentUser();
        let proto = me ? Object.getPrototypeOf(me) : null;
        while (proto && !Object.prototype.hasOwnProperty.call(proto, "getAvatarURL"))
            proto = Object.getPrototypeOf(proto);
        if (proto)
            wrap(proto, "getAvatarURL", orig => function (this: any, ...args: any[]) {
                return getOverride(this?.id)?.avatarUrl || orig.apply(this, args);
            });

        for (const id of getOverrideIds()) installDnsAccessor(UserStore.getUser(id));

        refreshAll();
    },
    stop() {
        for (const restore of restorers.splice(0)) restore();
    }
});
