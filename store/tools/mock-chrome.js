// Fake chrome.* API with demo data, used only to render store screenshots.
(function () {
  const fav = (letter, bg) => "data:image/svg+xml," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect width='16' height='16' rx='4' fill='${bg}'/><text x='8' y='12' font-family='Arial' font-weight='700' font-size='10' fill='#fff' text-anchor='middle'>${letter}</text></svg>`);
  const F = {
    gh: fav("G", "#24292f"), yt: fav("▶", "#ff0033"), gd: fav("D", "#1a73e8"),
    so: fav("S", "#f48024"), rd: fav("r", "#ff4500"), hn: fav("Y", "#ff6600"),
    wk: fav("W", "#636466"), fg: fav("F", "#a259ff")
  };
  const groups = [
    { id: 11, title: "Work", color: "blue", windowId: 1, collapsed: false },
    { id: 12, title: "Research", color: "green", windowId: 1, collapsed: false },
    { id: 13, title: "Music", color: "red", windowId: 2, collapsed: false },
    { id: 14, title: "Design", color: "purple", windowId: 1, collapsed: false }
  ];
  let id = 100;
  const T = (url, title, favIconUrl, groupId = -1, windowId = 1, extra = {}) =>
    Object.assign({ id: id++, url, title, favIconUrl, groupId, windowId, pinned: false, active: false, index: 0 }, extra);
  const tabs = [
    T("https://github.com/acme/api/pulls", "Pull requests · acme/api", F.gh, 11, 1, { active: true }),
    T("https://github.com/acme/api/issues/482", "Fix token refresh race · Issue #482", F.gh, 11),
    T("https://github.com/acme/web", "acme/web: Frontend monorepo", F.gh, 11),
    T("https://github.com/trending", "Trending repositories on GitHub today", F.gh, -1, 2),
    T("https://github.com/notifications", "Notifications", F.gh, -1, 2),
    T("https://docs.google.com/document/d/1", "Q4 Roadmap — Google Docs", F.gd, 11),
    T("https://docs.google.com/spreadsheets/d/2", "Budget 2026 — Google Sheets", F.gd, 11),
    T("https://docs.google.com/document/d/3", "Meeting notes — Google Docs", F.gd, -1, 2),
    T("https://www.youtube.com/watch?v=1", "Lo-fi beats to code to", F.yt, 13, 2),
    T("https://www.youtube.com/watch?v=2", "Deep focus — 3 hour mix", F.yt, 13, 2),
    T("https://www.youtube.com/watch?v=3", "Chrome extension tutorial (MV3)", F.yt, -1, 1),
    T("https://stackoverflow.com/q/1", "How to group tabs with chrome.tabs.group?", F.so, 12),
    T("https://stackoverflow.com/q/2", "Manifest V3 service worker lifecycle", F.so, 12),
    T("https://stackoverflow.com/q/3", "CSS grid auto-fit vs auto-fill", F.so, -1, 2),
    T("https://en.wikipedia.org/wiki/Tab_(interface)", "Tab (interface) - Wikipedia", F.wk, 12),
    T("https://en.wikipedia.org/wiki/Web_browser", "Web browser - Wikipedia", F.wk, 12),
    T("https://www.reddit.com/r/chrome", "r/chrome", F.rd, -1, 1),
    T("https://www.reddit.com/r/webdev", "r/webdev", F.rd, -1, 2),
    T("https://www.reddit.com/r/productivity", "r/productivity", F.rd, -1, 2),
    T("https://news.ycombinator.com/", "Hacker News", F.hn, -1, 1),
    T("https://www.figma.com/file/1", "Landing page — Figma", F.fg, 14),
    T("https://www.figma.com/file/2", "Design system — Figma", F.fg, 14)
  ];
  const ev = { addListener() {} };
  const events = { onCreated: ev, onRemoved: ev, onMoved: ev, onAttached: ev, onDetached: ev, onUpdated: ev };
  const params = new URLSearchParams(location.search);
  const store = { lang: params.get("lang") || "en", view: params.get("view") || "site" };
  window.chrome = {
    tabs: Object.assign({ query: async () => tabs.slice(), remove: async () => {}, update: async () => {}, move: async () => {}, group: async () => 1, ungroup: async () => {} }, events),
    tabGroups: Object.assign({ query: async () => groups.slice(), update: async () => {} }, events),
    windows: { getCurrent: async () => ({ id: 1 }), getAll: async () => [], update: async () => {} },
    storage: { sync: { get: async (k) => ({ [k]: store[k] }), set: async () => {} } },
    i18n: { getUILanguage: () => "en" }
  };
})();
