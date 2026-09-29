"use strict";

/** دیکشنری زبان‌ها — برای افزودن زبان جدید کافی است یک کلید تازه اضافه شود. */
const STRINGS = {
  fa: {
    _name: "فارسی",
    _dir: "rtl",
    _locale: "fa-IR",
    title: "تب‌های باز به تفکیک سایت",
    loading: "در حال بارگذاری…",
    summary: "{tabs} تب در {windows} پنجره — {sites} سایت — {groups} گروه",
    filter: "جستجوی دامنه…",
    merge: "ادغام پنجره‌ها",
    merging: "در حال ادغام…",
    mergeHint: "انتقال تب‌های همه‌ی پنجره‌ها به پنجره‌ی فعلی",
    merged: "{count} تب از {windows} پنجره به این پنجره منتقل شد.",
    mergedPrivate: "{count} تب منتقل شد؛ {skipped} پنجره‌ی خصوصی (Incognito/InPrivate) جدا ماند.",
    mergeNothing: "همه‌ی تب‌ها از قبل در یک پنجره هستند.",
    btnGroup: "گروه‌بندی",
    btnJoin: "افزودن به گروه",
    btnUnify: "ادغام گروه‌ها",
    titleJoin: "تب‌های آزاد {site} را به گروه «{name}» اضافه کن",
    titleUnify: "همه‌ی تب‌های {site} را در گروه «{name}» جمع کن",
    joined: "{count} تب {site} در گروه «{name}» جمع شد.",
    moveTab: "انتقال به گروه دیگر",
    moveHeader: "انتقال به گروه:",
    moveNew: "＋ گروه جدید",
    moveNone: "✕ خروج از گروه",
    tabMoved: "تب به گروه «{name}» منتقل شد.",
    tabUngrouped: "تب از گروه خارج شد.",
    tabNewGroup: "یک گروه جدید برای این تب ساخته شد.",
    mergeGroupTitle: "ادغام این گروه در گروه دیگر",
    mergeGroupHeader: "ادغام این گروه در:",
    groupsMerged: "{count} تب از گروه «{from}» به گروه «{to}» منتقل شد.",
    viewSite: "بر اساس سایت",
    viewGroup: "بر اساس گروه",
    ungrouped: "بدون گروه",
    groupMeta: "{tabs} تب · {sites} سایت",
    btnUngroup: "لغو گروه",
    titleUngroup: "تب‌ها بمانند ولی از گروه «{name}» خارج شوند",
    titleCloseGroup: "بستن همه‌ی {count} تب گروه «{name}»",
    ungroupedDone: "گروه «{name}» لغو شد؛ {count} تب آزاد شد.",
    closedGroup: "{count} تب گروه «{name}» بسته شد.",
    inWindow: "پنجره {n}",
    btnGrouped: "گروه شده",
    titleGrouped: "همه‌ی تب‌های {site} از قبل در یک Tab Group هستند",
    untitledGroup: "گروه بدون نام",
    badgeTitle: "Tab Group: {name} — {n} تب",
    badgeCount: "{n} از {total}",
    btnClose: "بستن همه",
    titleGroup: "انتقال تب‌های {site} به یک Tab Group",
    titleClose: "بستن همه‌ی {count} تب {site}",
    titleExpand: "نمایش تب‌های این سایت",
    rowMeta: "{tabs} تب در {windows} پنجره",
    empty: "سایتی برای نمایش وجود ندارد.",
    localFiles: "فایل‌های محلی",
    other: "سایر",
    noTitle: "بدون عنوان",
    goTab: "رفتن به این تب",
    closeTab: "بستن این تب",
    closed: "{count} تب از {site} بسته شد.",
    closedOne: "تب بسته شد.",
    grouped: "{count} تب {site} گروه‌بندی شد.",
    groupedMoved: "{count} تب {site} گروه‌بندی شد ({moved} تب از پنجره‌های دیگر منتقل شد).",
    error: "خطا: {message}",
    langLabel: "زبان"
  },
  en: {
    _name: "English",
    _dir: "ltr",
    _locale: "en-US",
    title: "Open tabs by site",
    loading: "Loading…",
    summary: "{tabs} tabs in {windows} windows — {sites} sites — {groups} groups",
    filter: "Search domain…",
    merge: "Merge windows",
    merging: "Merging…",
    mergeHint: "Move tabs from every window into the current window",
    merged: "Moved {count} tabs from {windows} windows into this window.",
    mergedPrivate: "Moved {count} tabs; {skipped} private (Incognito) windows left separate.",
    mergeNothing: "All tabs are already in one window.",
    btnGroup: "Group",
    btnJoin: "Add to group",
    btnUnify: "Merge groups",
    titleJoin: "Add the loose {site} tabs to group \"{name}\"",
    titleUnify: "Gather all {site} tabs into group \"{name}\"",
    joined: "Gathered {count} {site} tabs into group \"{name}\".",
    moveTab: "Move to another group",
    moveHeader: "Move to group:",
    moveNew: "+ New group",
    moveNone: "✕ Remove from group",
    tabMoved: "Tab moved to group \"{name}\".",
    tabUngrouped: "Tab removed from its group.",
    tabNewGroup: "Created a new group for this tab.",
    mergeGroupTitle: "Merge this group into another group",
    mergeGroupHeader: "Merge this group into:",
    groupsMerged: "Moved {count} tabs from group \"{from}\" into group \"{to}\".",
    viewSite: "By site",
    viewGroup: "By group",
    ungrouped: "Ungrouped",
    groupMeta: "{tabs} tabs · {sites} sites",
    btnUngroup: "Ungroup",
    titleUngroup: "Keep the tabs but take them out of group \"{name}\"",
    titleCloseGroup: "Close all {count} tabs of group \"{name}\"",
    ungroupedDone: "Ungrouped \"{name}\"; {count} tabs are now loose.",
    closedGroup: "Closed {count} tabs of group \"{name}\".",
    inWindow: "window {n}",
    btnGrouped: "Grouped",
    titleGrouped: "All {site} tabs are already in one Tab Group",
    untitledGroup: "Unnamed group",
    badgeTitle: "Tab Group: {name} — {n} tabs",
    badgeCount: "{n} of {total}",
    btnClose: "Close all",
    titleGroup: "Move all {site} tabs into a Tab Group",
    titleClose: "Close all {count} {site} tabs",
    titleExpand: "Show tabs for this site",
    rowMeta: "{tabs} tabs in {windows} windows",
    empty: "No sites to show.",
    localFiles: "Local files",
    other: "Other",
    noTitle: "Untitled",
    goTab: "Go to this tab",
    closeTab: "Close this tab",
    closed: "Closed {count} tabs from {site}.",
    closedOne: "Tab closed.",
    grouped: "Grouped {count} {site} tabs.",
    groupedMoved: "Grouped {count} {site} tabs ({moved} moved from other windows).",
    error: "Error: {message}",
    langLabel: "Language"
  }
};

const DEFAULT_LANG = "fa";
let currentLang = DEFAULT_LANG;

function setLang(lang) {
  currentLang = STRINGS[lang] ? lang : DEFAULT_LANG;
  document.documentElement.lang = currentLang;
  document.documentElement.dir = STRINGS[currentLang]._dir;
  return currentLang;
}

/** ترجمه با جایگذاری {placeholder} */
function t(key, vars) {
  let s = (STRINGS[currentLang] && STRINGS[currentLang][key]) || STRINGS[DEFAULT_LANG][key] || key;
  if (vars) {
    for (const k of Object.keys(vars)) s = s.split("{" + k + "}").join(vars[k]);
  }
  return s;
}

function fmtNum(n) {
  return new Intl.NumberFormat(STRINGS[currentLang]._locale).format(n);
}

async function loadLang() {
  try {
    const { lang } = await chrome.storage.sync.get("lang");
    if (lang) return setLang(lang);
  } catch (err) { /* storage در دسترس نیست */ }
  const ui = (chrome.i18n && chrome.i18n.getUILanguage && chrome.i18n.getUILanguage()) || "";
  return setLang(ui.indexOf("fa") === 0 ? "fa" : "en");
}

async function saveLang(lang) {
  setLang(lang);
  try { await chrome.storage.sync.set({ lang: currentLang }); } catch (err) { /* ignore */ }
}
