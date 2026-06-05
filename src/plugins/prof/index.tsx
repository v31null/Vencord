import "./styles.css";

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import definePlugin from "@utils/types";
import { User } from "@vencord/discord-types";
import { IconUtils, Menu, UsernameUtils } from "@webpack/common";

import { getOverride, loadOverrides } from "./data";
import { openEditProfileModal } from "./EditProfileModal";

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
        }
    ],
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
        wrap(UsernameUtils, "getName", orig => (...args) => getOverride(findUserId(args))?.name || orig(...args));
        wrap(UsernameUtils, "useName", orig => (...args) => {
            const real = orig(...args);
            return getOverride(findUserId(args))?.name || real;
        });
        wrap(IconUtils, "getUserAvatarURL", orig => (user, ...rest) => getOverride(user?.id)?.avatarUrl || orig(user, ...rest));
        wrap(IconUtils, "getUserBannerURL", orig => (data, ...rest) => getOverride(data?.id)?.bannerUrl || orig(data, ...rest));
    },
    stop() {
        for (const restore of restorers.splice(0)) restore();
    }
});
