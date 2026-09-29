# X Group Tab — Chrome Web Store listing

Copy each field into the Chrome Web Store Developer Dashboard (https://chrome.google.com/webstore/devconsole).

---

## Package

- Upload: `store/dist/x-group-tab-2.0.0.zip`
- Version: `2.0.0` (bump `version` in `manifest.json` for every new upload)

## Store listing tab

**Name** (from manifest): `X Group Tab`

**Summary** (from manifest, max 132 chars):
> See open tabs per site, group them into Tab Groups, merge groups & windows, or close a whole site in one click.

**Category:** Productivity → Tools (or "Workflow & Planning")

**Language:** English (the extension UI also includes Persian)

**Description:**

```
Too many tabs? X Group Tab shows you exactly what's open — counted by website — and lets you group, merge or close them in one click.

★ SEE EVERYTHING
• Every open tab counted by site, across all your windows
• Tab and window count for each website
• Live Tab Group badges in their real browser colors, e.g. "Work · 3 of 5"
• Instant domain search
• Expand any site to see its tabs; click to jump to one

★ GROUP A SITE IN ONE CLICK
• "Group" pulls every tab of a site — even from other windows — into a named, colored Tab Group
• "Add to group" gathers loose tabs into the group the site already uses
• "Merge groups" combines a site's tabs that are scattered across several groups
• Move any single tab to another group, into a new group, or out of its group

★ MANAGE YOUR TAB GROUPS
• "By group" view: every Tab Group is one row with its color, tab count, sites and window
• Merge any two groups
• Ungroup while keeping the tabs
• Close an entire group at once

★ CLEAN UP FAST
• "Close all" closes every tab of a site in all windows
• "Merge windows" moves every tab into the current window — pinned tabs stay pinned, empty windows close themselves, private windows are left alone

★ THOUGHTFUL DETAILS
• Automatic light and dark theme
• English and Persian (right-to-left) interface
• Updates live as your tabs change

★ PRIVATE BY DESIGN
No accounts, no analytics, no network requests. Your tab data never leaves your browser.
```

## Graphic assets

| Field | File |
| --- | --- |
| Store icon (128×128) | `icons/icon128.png` |
| Screenshots (1280×800, up to 5) | `store/assets/screenshot-1.png` … `screenshot-5.png` |
| Small promo tile (440×280) | `store/assets/promo-small-440x280.png` |
| Marquee promo tile (1400×560) | `store/assets/promo-marquee-1400x560.png` |
| Promo video (YouTube URL) | Upload `store/assets/promo-video-1280x720.mp4` to YouTube (Public or Unlisted) and paste the link |

## Privacy practices tab

**Single purpose:**
> X Group Tab helps users organize their open tabs: it counts open tabs per website and lets the user group, merge, move or close those tabs and Tab Groups.

**Permission justifications:**

- `tabs` — Needed to read the URL, title and favicon of open tabs so the popup can count them per website, and to move, group, focus and close tabs when the user clicks a button.
- `tabGroups` — Needed to read existing Tab Groups (name, color, window) to show them in the popup, and to create, rename, merge and ungroup Tab Groups at the user's request.
- `storage` — Stores two user preferences: interface language and view mode ("By site" / "By group").

**Remote code:** No, I am not using remote code. (All JavaScript is bundled in the package.)

**Data usage:** tick nothing in the "collects" list — the extension collects no user data. Then certify all three statements:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:** https://ehsun-sh.github.io/x-group-tab-privacy/  (source: https://github.com/ehsun-sh/x-group-tab-privacy — edit `index.html` there to update it)

## Distribution tab

- Visibility: Public
- Regions: All regions
- Pricing: Free
