// StoryKeeper detailed tracking: data helpers.
//
// Everything here is additive. Existing keys (sk_statuses_*, sk_dates_*, sk_sessions_*)
// keep their meaning, so older builds on another device still read them. New data lives
// in new keys, all of which are in the cloud sync list:
//   sk_reads_<type>  past read-throughs per book  { [bookKey]: [{ startDate, endDate, outcome, rating }] }
//   sk_dnf_<type>    did-not-finish details       { [bookKey]: { date, stoppedPage, stoppedPct, pagesRead, reason, note, mightReturn } }
//   sk_goals         reading goals by year        { [year]: { books, pages, hours }, restDays }
//   sk_achievements  unlock dates                 { [achievementId]: isoDate }
// Sessions (sk_sessions_<type>) gain optional fields: startTime, endTime, fromPage, toPage,
// pagesRead, mood, place, manual.

export const MEDIA_TYPES = ["ebooks", "audiobooks", "physical"];
export const FORMAT_LABELS = { ebooks: "eBooks", audiobooks: "Audiobooks", physical: "Physical" };

// The same key the book screen uses for statuses, dates and ratings.
export const bookKey = (book) => (book && (book.isbn || book.title)) || "";

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === "undefined") return fallback;
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch { return fallback; }
};
const writeJSON = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  // Lets the backup/sync code notice the change without the book list changing.
  try { window.dispatchEvent(new CustomEvent("sk-tracking-changed", { detail: { key } })); } catch {}
};

// ── Read-throughs ──────────────────────────────────────────────────────────

export const getReads = (type) => readJSON(`sk_reads_${type}`, {});
export const getBookReads = (type, key) => (getReads(type)[key] || []);

// Files the current read (from sk_dates) into history and starts a fresh one.
export function startReread(type, key, rating) {
  const reads = getReads(type);
  const dates = readJSON(`sk_dates_${type}`, {});
  const current = dates[key] || {};
  const entry = {
    startDate: current.startDate || null,
    endDate: current.endDate || null,
    outcome: "finished",
    ...(rating ? { rating } : {}),
  };
  reads[key] = [...(reads[key] || []), entry];
  writeJSON(`sk_reads_${type}`, reads);
  return entry;
}

export function removeRead(type, key, index) {
  const reads = getReads(type);
  const list = [...(reads[key] || [])];
  list.splice(index, 1);
  if (list.length) reads[key] = list; else delete reads[key];
  writeJSON(`sk_reads_${type}`, reads);
}

// ── DNF / paused ───────────────────────────────────────────────────────────

export const DNF_REASONS = ["Too slow", "Not for me", "Content", "Writing style", "Lost interest", "Too long", "Other"];

export const getDnfs = (type) => readJSON(`sk_dnf_${type}`, {});
export const getDnf = (type, key) => getDnfs(type)[key] || null;

export function saveDnf(type, key, record) {
  const all = getDnfs(type);
  all[key] = { ...record, date: record.date || new Date().toISOString() };
  writeJSON(`sk_dnf_${type}`, all);
}

export function clearDnf(type, key) {
  const all = getDnfs(type);
  if (!all[key]) return;
  delete all[key];
  writeJSON(`sk_dnf_${type}`, all);
}

// ── Sessions ───────────────────────────────────────────────────────────────

export const MOODS = [
  { id: "gripped", label: "Gripped", emoji: "🤩" },
  { id: "cozy", label: "Cozy", emoji: "☕" },
  { id: "emotional", label: "Emotional", emoji: "🥲" },
  { id: "tense", label: "Tense", emoji: "😬" },
  { id: "laughing", label: "Laughing", emoji: "😂" },
  { id: "curious", label: "Curious", emoji: "🤔" },
  { id: "bored", label: "Bored", emoji: "🥱" },
  { id: "sleepy", label: "Sleepy", emoji: "😴" },
];
export const PLACES = [
  { id: "bed", label: "Bed", emoji: "🛏️" },
  { id: "couch", label: "Couch", emoji: "🛋️" },
  { id: "commute", label: "Commute", emoji: "🚆" },
  { id: "cafe", label: "Café", emoji: "☕" },
  { id: "bath", label: "Bath", emoji: "🛁" },
  { id: "outdoors", label: "Outdoors", emoji: "🌳" },
  { id: "work", label: "Work break", emoji: "💼" },
  { id: "travel", label: "Travel", emoji: "✈️" },
  { id: "other", label: "Elsewhere", emoji: "📍" },
];
export const moodById = Object.fromEntries(MOODS.map(m => [m.id, m]));
export const placeById = Object.fromEntries(PLACES.map(p => [p.id, p]));

export const getSessions = (type) => {
  const s = readJSON(`sk_sessions_${type}`, []);
  return Array.isArray(s) ? s : [];
};

// Fills in optional details on the most recent session for this book.
export function updateLatestSession(type, key, details) {
  const sessions = getSessions(type);
  const idx = sessions.findIndex(s => s.isbn === key);
  if (idx === -1) return null;
  sessions[idx] = { ...sessions[idx], ...details };
  writeJSON(`sk_sessions_${type}`, sessions);
  return sessions[idx];
}

// A session logged by hand (no timer): for physical books read away from the phone.
export function addManualSession(type, book, { date, minutes, fromPage, toPage, mood, place }) {
  const key = bookKey(book);
  const pagesRead = fromPage != null && toPage != null && toPage > fromPage ? toPage - fromPage : 0;
  const session = {
    isbn: key,
    title: book.title,
    date: date || new Date().toISOString(),
    minutes: Math.max(0, Math.round(minutes || 0)),
    pages: toPage || 0,
    chapters: 0,
    manual: true,
    ...(fromPage != null ? { fromPage } : {}),
    ...(toPage != null ? { toPage } : {}),
    ...(pagesRead ? { pagesRead } : {}),
    ...(mood ? { mood } : {}),
    ...(place ? { place } : {}),
  };
  const sessions = getSessions(type);
  sessions.unshift(session);
  sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
  writeJSON(`sk_sessions_${type}`, sessions);
  if (session.minutes > 0) {
    const k = `sk_lifetime_minutes_${type}`;
    localStorage.setItem(k, String((parseInt(localStorage.getItem(k) || "0", 10) || 0) + session.minutes));
  }
  if (pagesRead > 0) {
    localStorage.setItem("sk_lifetime_pages", String((parseInt(localStorage.getItem("sk_lifetime_pages") || "0", 10) || 0) + pagesRead));
  }
  return session;
}

// ── Goals and streaks ──────────────────────────────────────────────────────

export const getGoals = () => readJSON("sk_goals", {});
export function saveYearGoal(year, goal) {
  const goals = getGoals();
  goals[year] = { ...(goals[year] || {}), ...goal };
  writeJSON("sk_goals", goals);
}
export function saveRestDays(n) {
  const goals = getGoals();
  goals.restDays = Math.max(0, Math.min(3, n | 0));
  writeJSON("sk_goals", goals);
}

const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

// Days with any reading activity: a logged session, or a finish date.
export function readingDays() {
  const days = new Set();
  MEDIA_TYPES.forEach(type => {
    getSessions(type).forEach(s => { if (s.date) days.add(dayKey(s.date)); });
    Object.values(readJSON(`sk_dates_${type}`, {})).forEach(d => { if (d?.endDate) days.add(dayKey(d.endDate)); });
  });
  return days;
}

// Current and longest streak. Each Monday–Sunday week may skip up to `restDays` days
// without breaking the streak; rest days don't add to the count. Today not being logged
// yet never breaks it.
export function computeStreaks(days = readingDays(), restDays = getGoals().restDays || 0) {
  if (days.size === 0) return { current: 0, longest: 0, readToday: false };
  const weekId = (d) => { const x = new Date(d); const dow = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dow); return dayKey(x); };
  const sorted = [...days].sort();
  const first = new Date(sorted[0] + "T12:00:00");
  const today = new Date(); today.setHours(12, 0, 0, 0);

  let current = 0, longest = 0, run = 0;
  const missedInWeek = {};
  for (let d = new Date(first); d <= today; d.setDate(d.getDate() + 1)) {
    const k = dayKey(d);
    const isToday = k === dayKey(today);
    if (days.has(k)) { run++; }
    else if (isToday) { /* not logged yet today: leave the streak alone */ }
    else {
      const w = weekId(d);
      missedInWeek[w] = (missedInWeek[w] || 0) + 1;
      if (missedInWeek[w] > restDays) run = 0;
    }
    longest = Math.max(longest, run);
  }
  current = run;
  return { current, longest, readToday: days.has(dayKey(today)) };
}

// ── Stats engine ───────────────────────────────────────────────────────────

const inRange = (iso, from, to) => {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return !isNaN(t) && t >= from && t < to;
};

const typeOf = (b) => b.type || (b.mediaType === "audiobook" ? "audiobooks" : b.mediaType === "physical" ? "physical" : "ebooks");

// One record per finished read-through (current reads plus re-read history), per DNF, and
// per session, all for the given time range. `books` is the reader's own library.
export function collectActivity(books, from, to) {
  const finishes = [], dnfs = [], sessions = [];
  const byKey = {};
  books.forEach(b => { byKey[`${typeOf(b)}::${bookKey(b)}`] = b; });

  MEDIA_TYPES.forEach(type => {
    const statuses = readJSON(`sk_statuses_${type}`, {});
    const dates = readJSON(`sk_dates_${type}`, {});
    const reads = getReads(type);
    const dnfMap = getDnfs(type);
    const ratings = readJSON("sk_ratings", {});

    Object.entries(statuses).forEach(([key, status]) => {
      const book = byKey[`${type}::${key}`];
      if (!book) return;
      const d = dates[key] || {};
      if (status === "finished" && inRange(d.endDate, from, to)) {
        finishes.push({ book, type, key, startDate: d.startDate, endDate: d.endDate, rating: ratings[key] || 0, reread: (reads[key] || []).length > 0 });
      }
    });
    Object.entries(reads).forEach(([key, list]) => {
      const book = byKey[`${type}::${key}`];
      if (!book) return;
      // The first entry is the original read; later ones are re-reads.
      list.forEach((r, i) => {
        if (r.outcome === "finished" && inRange(r.endDate, from, to)) {
          finishes.push({ book, type, key, startDate: r.startDate, endDate: r.endDate, rating: r.rating || 0, reread: i > 0, past: true });
        }
      });
    });
    Object.entries(dnfMap).forEach(([key, rec]) => {
      const book = byKey[`${type}::${key}`];
      if (!book || !inRange(rec.date, from, to)) return;
      if (!["dnf", "paused"].includes(statuses[key])) return;
      dnfs.push({ book, type, key, ...rec, paused: statuses[key] === "paused" });
    });
    getSessions(type).forEach(s => {
      if (inRange(s.date, from, to)) sessions.push({ ...s, type, book: byKey[`${type}::${s.isbn}`] || null });
    });
  });
  return { finishes, dnfs, sessions };
}

const pageCountOf = (b) => b?._totalPages || b?.pageCount || b?.pages || 0;

export function computeStats(books, from, to) {
  const { finishes, dnfs, sessions } = collectActivity(books, from, to);
  const ratingsAll = readJSON("sk_ratings", {});
  const spice = readJSON("sk_spice", {}), cry = readJSON("sk_cry_factor", {}), dark = readJSON("sk_dark_factor", {});

  const byFormat = Object.fromEntries(MEDIA_TYPES.map(t => [t, 0]));
  finishes.forEach(f => { byFormat[f.type]++; });

  const genreCounts = {};
  finishes.forEach(f => { const g = f.book.genre || "Other"; genreCounts[g] = (genreCounts[g] || 0) + 1; });
  const genres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);

  // Pages: whole books finished (when the page count is known), pages read before a DNF,
  // and pages logged in sessions for books not finished or DNF'd in this period (so a
  // book's pages are never counted twice).
  const finishedPages = finishes.reduce((a, f) => a + (f.type === "audiobooks" ? 0 : pageCountOf(f.book)), 0);
  const dnfPages = dnfs.reduce((a, d) => a + (d.pagesRead || 0), 0);
  const countedKeys = new Set([...finishes, ...dnfs].map(x => `${x.type}::${x.key}`));
  const sessionPages = sessions.reduce((a, s) => a + (countedKeys.has(`${s.type}::${s.isbn}`) ? 0 : (s.pagesRead || 0)), 0);
  const minutes = sessions.reduce((a, s) => a + (s.minutes || 0), 0);
  const minutesByFormat = Object.fromEntries(MEDIA_TYPES.map(t => [t, 0]));
  sessions.forEach(s => { minutesByFormat[s.type] += s.minutes || 0; });

  // Reading speed: pages per hour, from sessions that recorded both pages and time.
  // Sessions under 5 minutes are skipped: a quick log of "30 pages in 1 minute" would
  // otherwise swamp the average.
  const timed = sessions.filter(s => s.pagesRead > 0 && s.minutes >= 5 && s.type !== "audiobooks");
  const speed = timed.length ? Math.round(timed.reduce((a, s) => a + s.pagesRead, 0) / (timed.reduce((a, s) => a + s.minutes, 0) / 60)) : null;

  // Days to finish, for reads with both dates.
  const spans = finishes.filter(f => f.startDate && f.endDate).map(f => Math.max(1, Math.round((new Date(f.endDate) - new Date(f.startDate)) / 86400000)));
  const avgDays = spans.length ? Math.round(spans.reduce((a, b) => a + b, 0) / spans.length) : null;

  // Time of day, from each session's start time (or its saved time for older sessions).
  const timeOfDay = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
  sessions.forEach(s => {
    const h = new Date(s.startTime || s.date).getHours();
    const slot = h >= 5 && h < 12 ? "Morning" : h >= 12 && h < 17 ? "Afternoon" : h >= 17 && h < 22 ? "Evening" : "Night";
    timeOfDay[slot] += s.minutes || 1;
  });

  const tally = (field) => {
    const c = {};
    sessions.forEach(s => { if (s[field]) c[s[field]] = (c[s[field]] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  };

  const ratingDist = [0, 0, 0, 0, 0];
  finishes.forEach(f => { const r = f.rating || ratingsAll[f.key]; if (r >= 1 && r <= 5) ratingDist[Math.round(r) - 1]++; });
  const rated = finishes.map(f => f.rating || ratingsAll[f.key]).filter(r => r >= 1);
  const avgRating = rated.length ? Math.round((rated.reduce((a, b) => a + b, 0) / rated.length) * 10) / 10 : null;

  const scaleAvg = (map) => {
    const vals = finishes.map(f => map[f.key]).filter(v => v > 0);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  };

  const dnfReasons = {};
  dnfs.forEach(d => { const r = d.reason || "No reason"; dnfReasons[r] = (dnfReasons[r] || 0) + 1; });

  const months = Array.from({ length: 12 }, () => 0);
  finishes.forEach(f => { const d = new Date(f.endDate); if (d.getFullYear() === new Date(from).getFullYear()) months[d.getMonth()]++; });

  const longest = finishes.filter(f => f.type !== "audiobooks" && pageCountOf(f.book) > 0).sort((a, b) => pageCountOf(b.book) - pageCountOf(a.book))[0] || null;
  const fastest = finishes.filter(f => f.startDate && f.endDate).map(f => ({ ...f, days: Math.max(1, Math.round((new Date(f.endDate) - new Date(f.startDate)) / 86400000)) })).sort((a, b) => a.days - b.days)[0] || null;
  const authors = {};
  finishes.forEach(f => { if (f.book.author) authors[f.book.author] = (authors[f.book.author] || 0) + 1; });
  const topAuthor = Object.entries(authors).sort((a, b) => b[1] - a[1])[0] || null;

  return {
    finishes, dnfs, sessions,
    booksFinished: finishes.length,
    rereads: finishes.filter(f => f.reread).length,
    byFormat, genres,
    pages: finishedPages + dnfPages + sessionPages,
    minutes, minutesByFormat,
    speed, avgDays,
    timeOfDay,
    moods: tally("mood"), places: tally("place"),
    ratingDist, avgRating,
    avgSpice: scaleAvg(spice), avgCry: scaleAvg(cry), avgDark: scaleAvg(dark),
    dnfCount: dnfs.filter(d => !d.paused).length, pausedCount: dnfs.filter(d => d.paused).length, dnfReasons: Object.entries(dnfReasons).sort((a, b) => b[1] - a[1]),
    months, longest, fastest, topAuthor,
    activeDays: new Set(sessions.map(s => dayKey(s.date))).size,
  };
}

export const yearRange = (year) => [new Date(year, 0, 1).getTime(), new Date(year + 1, 0, 1).getTime()];
export const monthRange = (year, month) => [new Date(year, month, 1).getTime(), new Date(year, month + 1, 1).getTime()];

// ── Achievements ───────────────────────────────────────────────────────────

export const ACHIEVEMENTS = [
  { id: "first_finish", emoji: "🌱", name: "First Chapter Closed", desc: "Finish your first book", test: (a) => a.totalFinished >= 1 },
  { id: "ten_books", emoji: "📚", name: "Stack of Ten", desc: "Finish 10 books", test: (a) => a.totalFinished >= 10 },
  { id: "fifty_books", emoji: "🏛️", name: "Half a Hundred", desc: "Finish 50 books", test: (a) => a.totalFinished >= 50 },
  { id: "hundred_books", emoji: "👑", name: "Centurion", desc: "Finish 100 books", test: (a) => a.totalFinished >= 100 },
  { id: "streak_7", emoji: "🔥", name: "Week of Pages", desc: "Reach a 7-day streak", test: (a) => a.longestStreak >= 7 },
  { id: "streak_30", emoji: "🌕", name: "Moon Cycle", desc: "Reach a 30-day streak", test: (a) => a.longestStreak >= 30 },
  { id: "streak_100", emoji: "💫", name: "Unbroken Spine", desc: "Reach a 100-day streak", test: (a) => a.longestStreak >= 100 },
  { id: "all_formats", emoji: "🎧", name: "Every Shelf", desc: "Finish an ebook, an audiobook and a physical book", test: (a) => a.formatsFinished >= 3 },
  { id: "reread", emoji: "🔁", name: "Old Friend", desc: "Re-read a book", test: (a) => a.rereads >= 1 },
  { id: "pages_10k", emoji: "📜", name: "Ten Thousand Pages", desc: "Read 10,000 pages", test: (a) => a.totalPages >= 10000 },
  { id: "hours_100", emoji: "⏳", name: "Hundred Hours", desc: "Log 100 hours of reading or listening", test: (a) => a.totalMinutes >= 6000 },
  { id: "genres_5", emoji: "🧭", name: "Genre Explorer", desc: "Finish books in 5 different genres", test: (a) => a.genres >= 5 },
  { id: "night_owl", emoji: "🦉", name: "Night Owl", desc: "Log 10 sessions after 10pm", test: (a) => a.nightSessions >= 10 },
  { id: "early_bird", emoji: "🐦", name: "Early Bird", desc: "Log 10 sessions before 7am", test: (a) => a.morningSessions >= 10 },
  { id: "goal_met", emoji: "🎯", name: "Goal Getter", desc: "Reach a yearly book goal", test: (a) => a.goalMet },
  { id: "brave_dnf", emoji: "🚪", name: "Life's Too Short", desc: "DNF a book that wasn't for you", test: (a) => a.dnfs >= 1 },
];

// Checks every achievement and saves the date of any newly unlocked one.
// Returns { unlocked: {id: iso}, newlyUnlocked: [achievement] }.
export function refreshAchievements(books) {
  const all = computeStats(books, 0, Date.now() + 86400000);
  const streaks = computeStreaks();
  const goals = getGoals();
  const goalMet = Object.entries(goals).some(([y, g]) => /^\d{4}$/.test(y) && g?.books > 0 &&
    computeStats(books, ...yearRange(+y)).booksFinished >= g.books);
  const sessions = all.sessions;
  const lifetimeMin = MEDIA_TYPES.reduce((a, t) => a + (parseInt(localStorage.getItem(`sk_lifetime_minutes_${t}`) || "0", 10) || 0), 0);
  const facts = {
    totalFinished: all.booksFinished,
    longestStreak: streaks.longest,
    formatsFinished: MEDIA_TYPES.filter(t => all.byFormat[t] > 0).length,
    rereads: all.rereads,
    totalPages: Math.max(all.pages, parseInt(localStorage.getItem("sk_lifetime_pages") || "0", 10) || 0),
    totalMinutes: Math.max(all.minutes, lifetimeMin),
    genres: all.genres.length,
    nightSessions: sessions.filter(s => { const h = new Date(s.startTime || s.date).getHours(); return h >= 22 || h < 4; }).length,
    morningSessions: sessions.filter(s => { const h = new Date(s.startTime || s.date).getHours(); return h >= 4 && h < 7; }).length,
    goalMet,
    dnfs: all.dnfCount,
  };
  const unlocked = readJSON("sk_achievements", {});
  const newlyUnlocked = [];
  ACHIEVEMENTS.forEach(a => {
    if (!unlocked[a.id] && a.test(facts)) { unlocked[a.id] = new Date().toISOString(); newlyUnlocked.push(a); }
  });
  if (newlyUnlocked.length) writeJSON("sk_achievements", unlocked);
  return { unlocked, newlyUnlocked, facts };
}

export const TRACKING_SYNC_KEYS = [
  "sk_reads_ebooks", "sk_reads_audiobooks", "sk_reads_physical",
  "sk_dnf_ebooks", "sk_dnf_audiobooks", "sk_dnf_physical",
  "sk_goals", "sk_achievements",
];
