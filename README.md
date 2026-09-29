<p align="center">
  <img src="icons/icon128.png" width="96" alt="X Group Tab icon">
</p>

<h1 align="center">X Group Tab</h1>

<p align="center">Count, group, merge &amp; close your tabs by site — in one click.<br>
A Manifest V3 extension for Chrome and Edge.</p>

<p align="center">
  <img src="store/assets/promo.gif" alt="X Group Tab promo animation" width="800">
  <br>
  <a href="store/assets/promo-video-1280x720.mp4">▶ Watch the full-quality video (MP4)</a>
</p>

## Features

### See everything
- Every open tab counted by site, across all windows, with a tab and window count for each site.
- Live Tab Group badges in their real browser colors, e.g. `Work · 3 of 5`. If a site's tabs are spread over several groups, up to two badges are shown, plus `+N`.
- When **all** tabs of a site are in one group and one window, the row's edge takes the group color and the button changes to **✓ Grouped**.
- Instant domain search. Click a site to expand its tabs: click a tab to jump to it, or use **×** to close it.
- The summary line shows total tabs, windows, sites and Tab Groups.

### Group a site in one click
The group button adapts to the site's current state:

| Site state | Button | What it does |
| --- | --- | --- |
| No tabs grouped | Group | Creates a group named after the domain (or joins a same-named group in the current window) |
| Some tabs in one group, others loose | Add to group | Brings the loose tabs into that group, even if its name differs from the domain |
| Tabs spread over several groups | Merge groups | Gathers everything into the group holding most of the site's tabs (ties: current window's group, then the older group). Emptied groups disappear |
| All in one group and one window | ✓ Grouped | Disabled |

Tabs from other windows are moved to the target group's window. Pinned tabs are unpinned first, because pinned tabs can't be grouped.

### Move a single tab
In a site's tab list, the **⇄** button next to each tab moves it to any existing group, into a new group, or out of its group.

### Manage Tab Groups
- **By site / By group** toggle (your choice is remembered).
- In **By group** view, every Tab Group is one row with its color, name, tab count, sites and window number. From there you can:
  - **⇄** merge the group into another group (they don't have to share a site; the target keeps its name and color),
  - **Ungroup** — keep the tabs, remove the group,
  - **Close all** tabs in the group.
- Tabs outside any group are collected in a final **Ungrouped** row.
- Unnamed groups show as “Unnamed group”. Hover a group name to see its internal `id`, which helps tell apart same-named groups in different windows.

### Close & merge
- **Close all** closes every tab of a site in every window.
- **Merge windows** moves the tabs from every window into the current one. Pinned tabs stay pinned at the front and emptied windows close. Private (Incognito/InPrivate) windows can't be merged and are reported instead. Tab Groups in the source windows are dissolved during the move, so re-group with the site's **Group** button afterwards.

### Details
- Automatic light and dark theme.
- English and Persian (RTL) interface, switchable from the popup. The choice is saved in `chrome.storage.sync`; without one, the browser UI language is used. Persian uses the bundled **Vazirmatn** font, since MV3's CSP blocks CDN fonts.
- Live refresh: the popup listens to tab and Tab Group events, so the list stays current after every action.
- Internal browser pages are grouped under their protocol (e.g. `chrome://`). Subdomains are counted separately; only `www.` is stripped.

## Privacy

X Group Tab collects no data, makes no network requests, and has no analytics. See the [privacy policy](https://ehsun-sh.github.io/x-group-tab-privacy/).

Permissions: `tabs` and `tabGroups` to read and organize your tabs, and `storage` for the language and view preference.

## Install (developer mode)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select this folder.
4. Pin the extension icon in the toolbar.

After changing the code, click **Reload** on the extension's card.

## Adding a language

Add a new key to `STRINGS` in `i18n.js`. The language menu is built from that object automatically.

## Project structure

| Path | Description |
| --- | --- |
| `manifest.json` | Extension definition and the `tabs`, `tabGroups`, `storage` permissions |
| `popup.html` | Popup UI |
| `popup.css` | Styles, with light/dark themes and both RTL/LTR directions |
| `i18n.js` | Language dictionary, saved choice, number formatting |
| `popup.js` | Tab counting, Tab Group badges, close / group / merge logic |
| `icons/` | Icons from 16 to 128 px |
| `fonts/` | Vazirmatn variable font (woff2) and its OFL license |
| `store/` | Chrome Web Store listing text, screenshots, promo tiles, video, privacy policy |
| `store/tools/` | Scripts that render the icons, screenshots and promo video with headless Chrome |

## Rebuilding store assets

Requires Node.js 22+, Google Chrome and ffmpeg.

```bash
cd store/tools
node make-icons.mjs    # icons/*.png from icon.svg
node snap-popup.mjs    # renders the real popup with demo data
node make-store.mjs    # screenshots and promo tiles
node record.mjs        # promo video (store/promo/promo.html -> MP4)
```

## License

The Vazirmatn font is licensed under the SIL Open Font License (`fonts/OFL.txt`).
