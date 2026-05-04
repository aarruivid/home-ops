/**
 * FinanzOps v3.1 — Lucide SVG icon set (monochrome, single stroke).
 *
 * Replacements for the colorful emoji category icons. All icons are
 * 24x24 viewBox, stroke=currentColor, stroke-width=2, no fill. Render
 * size is controlled by the wrapper element (default: 16px inside a
 * 32px circle with --muted background).
 *
 * Source: lucide.dev (ISC license). Paths inlined to avoid network fetch.
 */

const LUCIDE_SVG = {
    // Categories (14)
    "shopping-cart": '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    "bus":           '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>',
    "utensils":      '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    "repeat":        '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    "heart-pulse":   '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
    "home":          '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    "film":          '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/>',
    "dumbbell":      '<path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>',
    "tv":            '<rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>',
    "briefcase":     '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
    "key-round":     '<path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>',
    "wifi":          '<path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" x2="12.01" y1="20" y2="20"/>',
    "phone":         '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    "shirt":         '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',

    // UI affordances (used by status pills, nav, etc.)
    "check":         '<polyline points="20 6 9 17 4 12"/>',
    "x":             '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    "alert-circle":  '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
    "info":          '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    "trending-up":   '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    "trending-down": '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
    "minus":         '<line x1="5" x2="19" y1="12" y2="12"/>',
    "plus":          '<path d="M5 12h14"/><path d="M12 5v14"/>',
};

const CATEGORY_ICON_MAP = {
    1: "shopping-cart",   // Groceries
    2: "bus",             // Transport
    3: "utensils",        // Eating Out
    4: "repeat",          // Subscriptions
    5: "heart-pulse",     // Health
    6: "home",            // Household
    7: "film",            // Entertainment
    8: "dumbbell",        // Gym
    9: "tv",              // Rundfunkbeitrag
    10: "briefcase",      // Empresa
    11: "key-round",      // Rent
    12: "wifi",           // Internet
    13: "phone",          // Phone
    14: "shirt",          // Clothing
};

/**
 * Render a Lucide icon as inline SVG string.
 * @param {string} name - Lucide icon name (e.g. "shopping-cart")
 * @param {object} opts - {size: 16, strokeWidth: 2, className: ''}
 * @returns {string} SVG markup
 */
function lucideIcon(name, opts = {}) {
    const paths = LUCIDE_SVG[name];
    if (!paths) {
        // graceful fallback: blank circle
        return `<svg width="${opts.size || 16}" height="${opts.size || 16}" viewBox="0 0 24 24" class="${opts.className || ''}"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="${opts.strokeWidth || 2}"/></svg>`;
    }
    const size = opts.size || 16;
    const sw = opts.strokeWidth || 2;
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" class="${opts.className || ''}" aria-hidden="true">${paths}</svg>`;
}

/**
 * Convenience: get the Lucide icon for a category id, wrapped in a 32px circle.
 * @param {number} categoryId
 * @param {object} opts - {size: 32, iconSize: 16}
 * @returns {string} HTML markup for the icon-in-circle
 */
function categoryIcon(categoryId, opts = {}) {
    // Coerce to number — API JSON sometimes returns ids as strings.
    const id = Number(categoryId);
    const name = (Number.isFinite(id) && CATEGORY_ICON_MAP[id]) || "shopping-cart";
    const size = opts.size || 32;
    const iconSize = opts.iconSize || 16;
    return `<span class="cat-icon" style="width:${size}px; height:${size}px;">${lucideIcon(name, { size: iconSize })}</span>`;
}

window.lucideIcon = lucideIcon;
window.categoryIcon = categoryIcon;
window.CATEGORY_ICON_MAP = CATEGORY_ICON_MAP;
