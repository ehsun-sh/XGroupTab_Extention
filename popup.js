"use strict";

const GROUP_COLORS = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];
const COLOR_EMOJI = {
  grey: "⚪", blue: "🔵", red: "🔴", yellow: "🟡", green: "🟢",
  pink: "🩷", purple: "🟣", cyan: "🩵", orange: "🟠"
};
const NO_GROUP = -1; // chrome.tabGroups.TAB_GROUP_ID_NONE
const MAX_BADGES = 2;

const listEl = document.getElementById("list");
const titleEl = document.getElementById("title");
const summaryEl = document.getElementById("summary");
const emptyEl = document.getElementById("empty");
const filterEl = document.getElementById("filter");
const toastEl = document.getElementById("toast");
const langEl = document.getElementById("lang");
const mergeBtn = document.getElementById("merge");
const viewSiteBtn = document.getElementById("viewSite");
const viewGroupBtn = document.getElementById("viewGroup");

let sites = [];
/** نمای بر اساس گروه: هر Tab Group یک ردیف؛ groupTabCount برای نشان دادن مجموع تب‌های گروه */
let groupInfos = [];
let looseTabs = [];
const groupTabCount = new Map();
/** windowId -> شماره‌ی ترتیبی (۱، ۲، …) برای نمایش به کاربر */
let windowIndex = new Map();
let view = "site";
let totals = { tabs: 0, windows: 0, tabGroups: 0 };
/** groupId -> { id, title, color, windowId } از Tab Groupهای واقعی مرورگر */
let tabGroupById = new Map();
/** کلید دامنه‌هایی که زیرمجموعه‌شان باز است */
const expanded = new Set();

/** برچسب گروه‌بندی هر تب: دامنه‌ی سایت یا نوع صفحه‌های داخلی */
function siteKey(url) {
  try {
    const u = new URL(url);
    if (u.protocol === "http:" || u.protocol === "https:") {
      return u.hostname.replace(/^www\./, "");
    }
    if (u.protocol === "file:") return t("localFiles");
    return u.protocol.replace(":", "") + "://";
  } catch (err) {
    return t("other");
  }
}

function colorFor(key) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return GROUP_COLORS[h % GROUP_COLORS.length];
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * تازه‌سازی با تأخیر و تجمیع رویدادها. Edge بعد از هر تغییر رویدادهای پشت‌سرهم می‌فرستد؛
 * فقط آخرین را اجرا می‌کنیم. اگر منوی بازی روی صفحه است، صفحه را بازسازی نمی‌کنیم تا بسته نشود.
 */
let reloadTimer = null;
function scheduleReload(delay) {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(async () => {
    const active = document.activeElement;
    if (active && active.tagName === "SELECT" && !active.disabled) {
      scheduleReload(500);
      return;
    }
    try { await load(); } catch (err) { /* پاپ‌آپ در حال بسته شدن است */ }
  }, delay);
}

function watchBrowserChanges() {
  const bind = (target, names) => {
    for (const n of names) {
      if (target && target[n] && target[n].addListener) target[n].addListener(() => scheduleReload(200));
    }
  };
  bind(chrome.tabs, ["onCreated", "onRemoved", "onMoved", "onAttached", "onDetached"]);
  // onUpdated برای هر تغییر کوچک صفحه (بارگذاری، favicon) می‌آید؛ فقط تغییرات مهم را دنبال کن
  if (chrome.tabs.onUpdated && chrome.tabs.onUpdated.addListener) {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
      if (changeInfo && (changeInfo.groupId !== undefined || changeInfo.url !== undefined ||
          changeInfo.title !== undefined || changeInfo.pinned !== undefined)) {
        scheduleReload(200);
      }
    });
  }
  bind(chrome.tabGroups, ["onCreated", "onUpdated", "onRemoved", "onMoved"]);
}

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toastEl.hidden = true; }, 4000);
}

function applyStaticText() {
  titleEl.textContent = t("title");
  filterEl.placeholder = t("filter");
  emptyEl.textContent = t("empty");
  mergeBtn.textContent = t("merge");
  mergeBtn.title = t("mergeHint");
  viewSiteBtn.textContent = t("viewSite");
  viewGroupBtn.textContent = t("viewGroup");
}

function updateViewButtons() {
  viewSiteBtn.setAttribute("aria-pressed", String(view === "site"));
  viewGroupBtn.setAttribute("aria-pressed", String(view === "group"));
}

async function setView(next) {
  view = next === "group" ? "group" : "site";
  updateViewButtons();
  try { await chrome.storage.sync.set({ view }); } catch (err) { /* ignore */ }
  render();
}

async function loadView() {
  try {
    const stored = await chrome.storage.sync.get("view");
    if (stored && stored.view === "group") view = "group";
  } catch (err) { /* ignore */ }
  updateViewButtons();
}

/** نام نمایشی یک Tab Group؛ گروه بدون عنوان هم باید قابل تشخیص باشد */
function groupName(tg) {
  return tg && tg.title ? tg.title : t("untitledGroup");
}

function groupColorClass(tg) {
  return "gc-" + (tg && GROUP_COLORS.indexOf(tg.color) !== -1 ? tg.color : "grey");
}

async function load() {
  const [tabs, tabGroups] = await Promise.all([
    chrome.tabs.query({}),
    chrome.tabGroups.query({})
  ]);

  tabGroupById = new Map(tabGroups.map(tg => [tg.id, tg]));
  const map = new Map();

  for (const tab of tabs) {
    const key = siteKey(tab.url || tab.pendingUrl || "");
    if (!map.has(key)) {
      map.set(key, { key, tabs: [], windows: new Set(), favIconUrl: "", groupCounts: new Map(), groupedTabs: 0 });
    }
    const s = map.get(key);
    s.tabs.push(tab);
    s.windows.add(tab.windowId);
    if (!s.favIconUrl && tab.favIconUrl) s.favIconUrl = tab.favIconUrl;

    if (tab.groupId !== undefined && tab.groupId !== NO_GROUP) {
      s.groupedTabs++;
      s.groupCounts.set(tab.groupId, (s.groupCounts.get(tab.groupId) || 0) + 1);
    }
  }

  // نمای گروه‌محور: تب‌ها را بر اساس Tab Group واقعی جمع کن
  const infoById = new Map();
  looseTabs = [];
  groupTabCount.clear();
  for (const tab of tabs) {
    const gid = tab.groupId;
    if (gid === undefined || gid === NO_GROUP || !tabGroupById.has(gid)) {
      looseTabs.push(tab);
      continue;
    }
    if (!infoById.has(gid)) {
      infoById.set(gid, { id: gid, tg: tabGroupById.get(gid), tabs: [], sites: new Map(), favIcons: new Map() });
    }
    const gi = infoById.get(gid);
    gi.tabs.push(tab);
    const key = siteKey(tab.url || tab.pendingUrl || "");
    gi.sites.set(key, (gi.sites.get(key) || 0) + 1);
    if (tab.favIconUrl && !gi.favIcons.has(key)) gi.favIcons.set(key, tab.favIconUrl);
  }
  groupInfos = [...infoById.values()].sort(
    (a, b) => b.tabs.length - a.tabs.length || groupName(a.tg).localeCompare(groupName(b.tg))
  );
  groupInfos.forEach(g => groupTabCount.set(g.id, g.tabs.length));
  windowIndex = new Map(
    [...new Set(tabs.map(tb => tb.windowId))].sort((x, y) => x - y).map((w, i) => [w, i + 1])
  );

  sites = [...map.values()].sort(
    (a, b) => b.tabs.length - a.tabs.length || a.key.localeCompare(b.key)
  );
  totals = {
    tabs: tabs.length,
    windows: new Set(tabs.map(tb => tb.windowId)).size,
    tabGroups: tabGroups.length
  };

  // دامنه‌هایی که دیگر تبی ندارند از حالت باز خارج شوند
  const keys = new Set(sites.map(s => s.key));
  groupInfos.forEach(g => keys.add("g:" + g.id));
  keys.add("loose");
  for (const k of [...expanded]) if (!keys.has(k)) expanded.delete(k);

  render();
}

function renderSummary() {
  summaryEl.textContent = t("summary", {
    tabs: fmtNum(totals.tabs),
    windows: fmtNum(totals.windows),
    sites: fmtNum(sites.length),
    groups: fmtNum(totals.tabGroups)
  });
}

function makeFavicon(url) {
  const img = document.createElement("img");
  img.className = "favicon";
  img.alt = "";
  if (url) img.src = url;
  img.addEventListener("error", () => { img.removeAttribute("src"); });
  return img;
}

function badgeTitleFor(tg) {
  return t("badgeTitle", { name: groupName(tg), n: fmtNum(tg ? groupTabCount.get(tg.id) || 0 : 0) });
}

/** برچسب رنگی Tab Group: نقطه‌ی هم‌رنگ گروه در مرورگر + نام گروه */
function makeBadge(tg, extraText) {
  const badge = document.createElement("span");
  badge.className = "gbadge " + groupColorClass(tg);
  badge.title = badgeTitleFor(tg);

  const dot = document.createElement("i");
  dot.className = "gdot";

  const name = document.createElement("span");
  name.className = "gname";
  name.textContent = groupName(tg) + (extraText ? " · " + extraText : "");

  badge.append(dot, name);

  const merge = buildGroupMergeSelect(tg);
  if (merge) badge.append(merge);
  return badge;
}

/** منوی کوچک روی برچسب: همه‌ی تب‌های این گروه را به گروه دلخواه دیگری ببر */
function buildGroupMergeSelect(tg) {
  if (!tg) return null;
  const others = [...tabGroupById.values()]
    .filter(g => g.id !== tg.id)
    .sort((a, b) => groupName(a).localeCompare(groupName(b)));
  if (!others.length) return null;

  const sel = document.createElement("select");
  sel.className = "gmerge";
  sel.title = t("mergeGroupTitle");
  sel.setAttribute("aria-label", t("mergeGroupTitle"));

  const face = document.createElement("option");
  face.value = "";
  face.textContent = "\u21c4";
  face.hidden = true;
  face.selected = true;
  sel.append(face);

  const header = document.createElement("option");
  header.value = "";
  header.textContent = t("mergeGroupHeader");
  header.disabled = true;
  sel.append(header);

  for (const g of others) {
    const opt = document.createElement("option");
    opt.value = String(g.id);
    opt.textContent = (COLOR_EMOJI[g.color] || COLOR_EMOJI.grey) + " " + groupName(g);
    sel.append(opt);
  }

  sel.addEventListener("change", async () => {
    if (!sel.value) return;
    sel.disabled = true;
    try {
      const msg = await mergeGroups(tg.id, Number(sel.value));
      await load();
      toast(msg);
      scheduleReload(600);
    } catch (err) {
      toast(t("error", { message: err && err.message ? err.message : String(err) }));
      sel.disabled = false;
      sel.selectedIndex = 0;
    }
  });
  return sel;
}

/** همه‌ی تب‌های گروه مبدأ را به گروه مقصد منتقل می‌کند؛ گروه مبدأ خالی و توسط مرورگر حذف می‌شود */
async function mergeGroups(fromId, toId) {
  const from = tabGroupById.get(fromId);
  const to = tabGroupById.get(toId);
  if (!from || !to) throw new Error("group not found");

  const tabs = await chrome.tabs.query({ groupId: fromId });
  const ids = tabs.map(tb => tb.id);
  if (!ids.length) throw new Error("group is empty");

  // گروه مقصد در پنجره‌ی دیگری است: اول تب‌ها را به همان پنجره ببر
  if (from.windowId !== to.windowId) {
    await chrome.tabs.move(ids, { windowId: to.windowId, index: -1 });
  }
  await chrome.tabs.group({ groupId: toId, tabIds: ids });

  // Edge وضعیت نوار تب را با کمی تأخیر اعمال می‌کند؛ اگر چیزی در گروه مبدأ مانده، دوباره تلاش کن
  for (let attempt = 0; attempt < 3; attempt++) {
    await sleep(150);
    const left = await chrome.tabs.query({ groupId: fromId });
    if (!left.length) break;
    await chrome.tabs.group({ groupId: toId, tabIds: left.map(tb => tb.id) });
  }

  return t("groupsMerged", { count: fmtNum(ids.length), from: groupName(from), to: groupName(to) });
}

/** ردیف نشانگرها زیر نام سایت: این سایت الان در کدام Tab Group است */
function buildBadges(s) {
  if (s.groupCounts.size === 0) return null;

  const wrap = document.createElement("div");
  wrap.className = "badges";

  const entries = [...s.groupCounts.entries()].sort((a, b) => b[1] - a[1]);
  const partial = s.groupedTabs < s.tabs.length;

  entries.slice(0, MAX_BADGES).forEach(([gid, count]) => {
    const tg = tabGroupById.get(gid);
    const showCount = partial || entries.length > 1;
    wrap.append(makeBadge(tg, showCount ? t("badgeCount", { n: fmtNum(count), total: fmtNum(s.tabs.length) }) : ""));
  });

  if (entries.length > MAX_BADGES) {
    const more = document.createElement("span");
    more.className = "gmore";
    more.textContent = "+" + fmtNum(entries.length - MAX_BADGES);
    wrap.append(more);
  }
  return wrap;
}

function buildSublist(s) {
  const ul = document.createElement("ul");
  ul.className = "sublist";

  for (const tab of s.tabs) {
    const li = document.createElement("li");
    li.className = "subrow";
    if (tab.active) li.classList.add("is-active");

    const go = document.createElement("button");
    go.className = "tab-btn";
    go.title = t("goTab") + " — " + (tab.title || tab.url || "");
    go.addEventListener("click", () => focusTab(tab));

    const tabTitle = document.createElement("span");
    tabTitle.className = "tab-title";
    tabTitle.textContent = tab.title || tab.url || t("noTitle");

    go.append(makeFavicon(tab.favIconUrl), tabTitle);

    if (tab.groupId !== undefined && tab.groupId !== NO_GROUP) {
      const tg = tabGroupById.get(tab.groupId);
      const dot = document.createElement("i");
      dot.className = "gdot tab-gdot " + groupColorClass(tg);
      dot.title = badgeTitleFor(tg);
      go.append(dot);
    }

    const x = document.createElement("button");
    x.className = "tab-close";
    x.textContent = "×";
    x.title = t("closeTab");
    x.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      await chrome.tabs.remove(tab.id);
      await load();
      toast(t("closedOne"));
    });

    li.append(go, buildMoveSelect(tab), x);
    ul.append(li);
  }
  return ul;
}

async function focusTab(tab) {
  await chrome.tabs.update(tab.id, { active: true });
  await chrome.windows.update(tab.windowId, { focused: true });
  window.close(); // پاپ‌آپ بسته شود تا تب دیده شود
}

/**
 * گروهی که تب‌های این سایت باید در آن جمع شوند: گروهی که بیشترین تب سایت را دارد؛
 * در تساوی، گروه پنجره‌ی فعلی، و بعد گروه قدیمی‌تر.
 */
function pickTargetGroup(s, currentWindowId) {
  const cands = [...s.groupCounts.entries()]
    .map(([id, count]) => ({ tg: tabGroupById.get(id), count }))
    .filter(c => c.tg);
  if (!cands.length) return null;
  cands.sort((a, b) =>
    b.count - a.count ||
    (b.tg.windowId === currentWindowId) - (a.tg.windowId === currentWindowId) ||
    a.tg.id - b.tg.id
  );
  return cands[0].tg;
}

/** همه‌ی تب‌های سایت از قبل داخل یک Tab Group و یک پنجره‌اند؟ */
function isFullyGrouped(s) {
  return s.groupedTabs === s.tabs.length && s.groupCounts.size === 1 && s.windows.size === 1;
}

function render() {
  renderSummary();
  if (view === "group") { renderGroups(); return; }

  const q = filterEl.value.trim().toLowerCase();
  const visible = q ? sites.filter(s => s.key.toLowerCase().includes(q)) : sites;

  listEl.textContent = "";
  emptyEl.hidden = visible.length > 0;

  for (const s of visible) {
    const li = document.createElement("li");
    li.className = "item";

    const row = document.createElement("div");
    row.className = "row";

    // اگر همه‌ی تب‌ها در یک گروه‌اند، لبه‌ی ردیف به رنگ همان گروه در می‌آید
    if (isFullyGrouped(s)) {
      const only = tabGroupById.get([...s.groupCounts.keys()][0]);
      row.classList.add("is-grouped", groupColorClass(only));
    }

    const isOpen = expanded.has(s.key);

    const toggle = document.createElement("button");
    toggle.className = "toggle";
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.title = t("titleExpand");

    const caret = document.createElement("span");
    caret.className = "caret" + (isOpen ? " open" : "");
    caret.textContent = "▾";

    const info = document.createElement("div");
    info.className = "info";

    const host = document.createElement("div");
    host.className = "host";
    host.textContent = s.key;
    host.title = s.key;

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = t("rowMeta", { tabs: fmtNum(s.tabs.length), windows: fmtNum(s.windows.size) });

    info.append(host, meta);

    toggle.append(caret, makeFavicon(s.favIconUrl), info);
    toggle.addEventListener("click", () => {
      if (expanded.has(s.key)) expanded.delete(s.key); else expanded.add(s.key);
      render();
    });

    const actions = document.createElement("div");
    actions.className = "actions";

    const groupBtn = document.createElement("button");
    groupBtn.className = "group";
    if (isFullyGrouped(s)) {
      groupBtn.classList.add("done");
      groupBtn.textContent = "✓ " + t("btnGrouped");
      groupBtn.title = t("titleGrouped", { site: s.key });
      groupBtn.disabled = true;
    } else {
      if (s.groupCounts.size === 0) {
        groupBtn.textContent = t("btnGroup");
        groupBtn.title = t("titleGroup", { site: s.key });
      } else {
        // از قبل گروهی دارد: دکمه تب‌های آزاد را به همان گروه می‌آورد یا چند گروه را یکی می‌کند
        const tgt = pickTargetGroup(s, null);
        const many = s.groupCounts.size > 1;
        groupBtn.textContent = t(many ? "btnUnify" : "btnJoin");
        groupBtn.title = t(many ? "titleUnify" : "titleJoin", { site: s.key, name: groupName(tgt) });
      }
      groupBtn.addEventListener("click", () => run(row, () => groupTabs(s)));
    }

    const closeBtn = document.createElement("button");
    closeBtn.className = "close";
    closeBtn.textContent = t("btnClose");
    closeBtn.title = t("titleClose", { count: fmtNum(s.tabs.length), site: s.key });
    closeBtn.addEventListener("click", () => run(row, () => closeTabs(s)));

    actions.append(groupBtn, closeBtn);
    row.append(toggle, actions);
    li.append(row);

    const badges = buildBadges(s);
    if (badges) li.append(badges);

    if (isOpen) li.append(buildSublist(s));
    listEl.append(li);
  }
}

/** یک ردیف بازشونده (برای گروه یا تب‌های بدون گروه) */
function buildToggle(key, isOpen, lead, info) {
  const toggle = document.createElement("button");
  toggle.className = "toggle";
  toggle.setAttribute("aria-expanded", String(isOpen));

  const caret = document.createElement("span");
  caret.className = "caret" + (isOpen ? " open" : "");
  caret.textContent = "\u25be";

  toggle.append(caret, lead, info);
  toggle.addEventListener("click", () => {
    if (expanded.has(key)) expanded.delete(key); else expanded.add(key);
    render();
  });
  return toggle;
}

function renderGroups() {
  const q = filterEl.value.trim().toLowerCase();
  const matchGroup = (g) => !q ||
    groupName(g.tg).toLowerCase().indexOf(q) !== -1 ||
    [...g.sites.keys()].some(k => k.toLowerCase().indexOf(q) !== -1);
  const visible = groupInfos.filter(matchGroup);
  const looseVisible = q
    ? looseTabs.filter(tb => siteKey(tb.url || tb.pendingUrl || "").toLowerCase().indexOf(q) !== -1)
    : looseTabs;

  listEl.textContent = "";
  emptyEl.hidden = visible.length > 0 || looseVisible.length > 0;

  for (const g of visible) {
    const key = "g:" + g.id;
    const isOpen = expanded.has(key);
    const name = groupName(g.tg);

    const li = document.createElement("li");
    li.className = "item";

    const row = document.createElement("div");
    row.className = "row is-grouped " + groupColorClass(g.tg);

    const dot = document.createElement("i");
    dot.className = "gdot gdot-lg";

    const info = document.createElement("div");
    info.className = "info";

    const title = document.createElement("div");
    title.className = "gtitle";
    title.textContent = name;
    title.title = name + "  (id " + g.id + ")";

    const siteList = [...g.sites.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]);
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = t("groupMeta", { tabs: fmtNum(g.tabs.length), sites: fmtNum(siteList.length) }) +
      (windowIndex.size > 1 ? " \u00b7 " + t("inWindow", { n: fmtNum(windowIndex.get(g.tg.windowId) || 0) }) : "");

    const sitesLine = document.createElement("div");
    sitesLine.className = "meta sites-line";
    sitesLine.textContent = siteList.join(" \u00b7 ");
    sitesLine.title = siteList.join("\n");

    info.append(title, meta, sitesLine);

    const toggle = buildToggle(key, isOpen, dot, info);
    toggle.title = t("titleExpand");

    const actions = document.createElement("div");
    actions.className = "actions";

    const merge = buildGroupMergeSelect(g.tg);
    if (merge) actions.append(merge);

    const ungroupBtn = document.createElement("button");
    ungroupBtn.className = "group";
    ungroupBtn.textContent = t("btnUngroup");
    ungroupBtn.title = t("titleUngroup", { name });
    ungroupBtn.addEventListener("click", () => run(row, () => ungroupGroup(g)));

    const closeBtn = document.createElement("button");
    closeBtn.className = "close";
    closeBtn.textContent = t("btnClose");
    closeBtn.title = t("titleCloseGroup", { count: fmtNum(g.tabs.length), name });
    closeBtn.addEventListener("click", () => run(row, () => closeGroup(g)));

    actions.append(ungroupBtn, closeBtn);
    row.append(toggle, actions);
    li.append(row);
    if (isOpen) li.append(buildSublist({ tabs: g.tabs }));
    listEl.append(li);
  }

  if (looseVisible.length) {
    const isOpen = expanded.has("loose");
    const li = document.createElement("li");
    li.className = "item";

    const row = document.createElement("div");
    row.className = "row";

    const dot = document.createElement("i");
    dot.className = "gdot gdot-lg gdot-empty";

    const info = document.createElement("div");
    info.className = "info";
    const title = document.createElement("div");
    title.className = "gtitle";
    title.textContent = t("ungrouped");
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = t("groupMeta", {
      tabs: fmtNum(looseVisible.length),
      sites: fmtNum(new Set(looseVisible.map(tb => siteKey(tb.url || tb.pendingUrl || ""))).size)
    });
    info.append(title, meta);

    const toggle = buildToggle("loose", isOpen, dot, info);
    toggle.title = t("titleExpand");
    row.append(toggle);
    li.append(row);

    if (isOpen) {
      const sorted = [...looseVisible].sort((a, b) =>
        siteKey(a.url || a.pendingUrl || "").localeCompare(siteKey(b.url || b.pendingUrl || "")));
      li.append(buildSublist({ tabs: sorted }));
    }
    listEl.append(li);
  }
}

async function closeGroup(g) {
  const ids = g.tabs.map(tb => tb.id);
  await chrome.tabs.remove(ids);
  return t("closedGroup", { count: fmtNum(ids.length), name: groupName(g.tg) });
}

async function ungroupGroup(g) {
  const ids = g.tabs.map(tb => tb.id);
  await chrome.tabs.ungroup(ids);
  return t("ungroupedDone", { count: fmtNum(ids.length), name: groupName(g.tg) });
}

async function run(row, fn) {
  const buttons = row.querySelectorAll(".actions button");
  buttons.forEach(b => { b.disabled = true; });
  try {
    const msg = await fn();
    await load();
    toast(msg);
    scheduleReload(600);
  } catch (err) {
    toast(t("error", { message: err && err.message ? err.message : String(err) }));
    buttons.forEach(b => { b.disabled = false; });
  }
}

async function closeTabs(s) {
  const ids = s.tabs.map(tb => tb.id);
  await chrome.tabs.remove(ids);
  return t("closed", { count: fmtNum(ids.length), site: s.key });
}

async function groupTabs(s) {
  const [current] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentWindowId = current ? current.windowId : s.tabs[0].windowId;

  // اگر تب‌های این سایت الان در گروهی هستند، همان را هدف بگیر (نه گروه تازه)
  let target = pickTargetGroup(s, currentWindowId);
  const targetWindowId = target ? target.windowId : currentWindowId;

  // تب‌های پین‌شده قابل گروه‌بندی نیستند
  for (const tb of s.tabs) {
    if (tb.pinned) await chrome.tabs.update(tb.id, { pinned: false });
  }

  // انتقال تب‌های سایر پنجره‌ها به پنجره‌ی گروه هدف
  const foreign = s.tabs.filter(tb => tb.windowId !== targetWindowId).map(tb => tb.id);
  if (foreign.length) await chrome.tabs.move(foreign, { windowId: targetWindowId, index: -1 });

  const ids = s.tabs.map(tb => tb.id);

  // گروهی از قبل نیست: اگر گروهی هم‌نام دامنه در این پنجره هست از همان استفاده کن
  if (!target) {
    const named = await chrome.tabGroups.query({ windowId: targetWindowId, title: s.key });
    if (named.length) target = named[0];
  }

  if (target) {
    await chrome.tabs.group({ groupId: target.id, tabIds: ids });
    return t("joined", { count: fmtNum(ids.length), site: s.key, name: groupName(target) });
  }

  const groupId = await chrome.tabs.group({ tabIds: ids, createProperties: { windowId: targetWindowId } });
  await chrome.tabGroups.update(groupId, { title: s.key, color: colorFor(s.key) });

  return foreign.length
    ? t("groupedMoved", { count: fmtNum(ids.length), site: s.key, moved: fmtNum(foreign.length) })
    : t("grouped", { count: fmtNum(ids.length), site: s.key });
}

/** جابه‌جایی یک تب: به گروه موجود، گروه تازه، یا بیرون از گروه */
async function moveTab(tab, value) {
  if (tab.pinned) await chrome.tabs.update(tab.id, { pinned: false });

  if (value === "none") {
    await chrome.tabs.ungroup(tab.id);
    return t("tabUngrouped");
  }

  if (value === "new") {
    const gid = await chrome.tabs.group({ tabIds: [tab.id] });
    await chrome.tabGroups.update(gid, {
      title: siteKey(tab.url || tab.pendingUrl || ""),
      color: colorFor(String(tab.id))
    });
    return t("tabNewGroup");
  }

  const tg = tabGroupById.get(Number(value));
  if (!tg) throw new Error("group not found");
  // گروه در پنجره‌ی دیگری است: اول تب را به همان پنجره ببر
  if (tab.windowId !== tg.windowId) {
    await chrome.tabs.move(tab.id, { windowId: tg.windowId, index: -1 });
  }
  await chrome.tabs.group({ groupId: tg.id, tabIds: [tab.id] });
  return t("tabMoved", { name: groupName(tg) });
}

/** منوی کوچک کنار هر تب برای انتقال به گروه دیگر */
function buildMoveSelect(tab) {
  const sel = document.createElement("select");
  sel.className = "tab-move";
  sel.title = t("moveTab");
  sel.setAttribute("aria-label", t("moveTab"));

  const face = document.createElement("option");
  face.value = "";
  face.textContent = "⇄";
  face.hidden = true;
  face.selected = true;
  sel.append(face);

  const header = document.createElement("option");
  header.value = "";
  header.textContent = t("moveHeader");
  header.disabled = true;
  sel.append(header);

  const others = [...tabGroupById.values()]
    .filter(tg => tg.id !== tab.groupId)
    .sort((a, b) => groupName(a).localeCompare(groupName(b)));
  for (const tg of others) {
    const opt = document.createElement("option");
    opt.value = String(tg.id);
    opt.textContent = (COLOR_EMOJI[tg.color] || COLOR_EMOJI.grey) + " " + groupName(tg);
    sel.append(opt);
  }

  const optNew = document.createElement("option");
  optNew.value = "new";
  optNew.textContent = t("moveNew");
  sel.append(optNew);

  if (tab.groupId !== undefined && tab.groupId !== NO_GROUP) {
    const optNone = document.createElement("option");
    optNone.value = "none";
    optNone.textContent = t("moveNone");
    sel.append(optNone);
  }

  sel.addEventListener("change", async () => {
    if (!sel.value) return;
    sel.disabled = true;
    try {
      const msg = await moveTab(tab, sel.value);
      await load();
      toast(msg);
      scheduleReload(600);
    } catch (err) {
      toast(t("error", { message: err && err.message ? err.message : String(err) }));
      sel.disabled = false;
      sel.selectedIndex = 0;
    }
  });
  return sel;
}

/* ---------- ادغام پنجره‌ها ---------- */

async function mergeWindows() {
  mergeBtn.disabled = true;
  mergeBtn.textContent = t("merging");
  try {
    const targetWin = await chrome.windows.getCurrent();
    const wins = await chrome.windows.getAll({ populate: true, windowTypes: ["normal"] });

    // پنجره‌های InPrivate با پنجره‌ی عادی قابل ادغام نیستند
    const sources = wins.filter(w => w.id !== targetWin.id && w.incognito === targetWin.incognito);
    const skipped = wins.filter(w => w.id !== targetWin.id && w.incognito !== targetWin.incognito).length;

    let moved = 0;
    for (const w of sources) {
      const pinned = w.tabs.filter(tb => tb.pinned).map(tb => tb.id);
      const rest = w.tabs.filter(tb => !tb.pinned).map(tb => tb.id);
      // تب‌های پین‌شده باید در ابتدای نوار بمانند، بقیه به انتها می‌روند
      if (pinned.length) await chrome.tabs.move(pinned, { windowId: targetWin.id, index: 0 });
      if (rest.length) await chrome.tabs.move(rest, { windowId: targetWin.id, index: -1 });
      moved += w.tabs.length;
    }

    await chrome.windows.update(targetWin.id, { focused: true });
    await load();

    if (!moved) {
      toast(t("mergeNothing"));
    } else if (skipped) {
      toast(t("mergedPrivate", { count: fmtNum(moved), skipped: fmtNum(skipped) }));
    } else {
      toast(t("merged", { count: fmtNum(moved), windows: fmtNum(sources.length) }));
    }
  } catch (err) {
    toast(t("error", { message: err && err.message ? err.message : String(err) }));
  } finally {
    mergeBtn.disabled = false;
    mergeBtn.textContent = t("merge");
  }
}

/* ---------- راه‌اندازی ---------- */

function buildLangSelect() {
  langEl.textContent = "";
  for (const code of Object.keys(STRINGS)) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = STRINGS[code]._name;
    langEl.append(opt);
  }
}

filterEl.addEventListener("input", render);
mergeBtn.addEventListener("click", mergeWindows);
viewSiteBtn.addEventListener("click", () => setView("site"));
viewGroupBtn.addEventListener("click", () => setView("group"));
langEl.addEventListener("change", async () => {
  await saveLang(langEl.value);
  applyStaticText();
  await load(); // برچسب‌های وابسته به زبان مثل «فایل‌های محلی» دوباره ساخته شوند
});

(async function init() {
  const lang = await loadLang();
  buildLangSelect();
  langEl.value = lang;
  applyStaticText();
  await loadView();
  summaryEl.textContent = t("loading");
  await load();
  watchBrowserChanges();
})();
