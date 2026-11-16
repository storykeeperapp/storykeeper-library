// StoryKeeper detailed tracking: screens and panels.
import React, { useState, useMemo } from "react";
import {
  DNF_REASONS, MOODS, PLACES, moodById, placeById, MEDIA_TYPES, FORMAT_LABELS,
  getBookReads, removeRead, getGoals, saveYearGoal, saveRestDays, computeStreaks,
  computeStats, yearRange, monthRange, ACHIEVEMENTS, refreshAchievements,
} from "./store.js";

const SERIF = '"Palatino Linotype", Palatino, serif';
const BODY = "Georgia, serif";
const P = { ink: "#3A2A1A", mid: "#6B4E32", soft: "#8B7355", accent: "#8B5E3C", line: "#D8C3A5", paper: "#F8F1E4", card: "rgba(255,255,255,0.7)", good: "#4A7C59", warn: "#A0522D" };

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "?";
export const fmtMinutes = (m) => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ""}`.trim() : `${m}m`;

// ── Shared pieces ──────────────────────────────────────────────────────────

function Sheet({ title, onClose, children, theme = {} }) {
  const bg = theme.bg || P.paper, text = theme.text || P.ink;
  return (
    <div role="dialog" aria-modal="true" aria-label={title}
      style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: bg, color: text, width: "100%", maxWidth: 520, maxHeight: "88vh", overflowY: "auto", borderRadius: "16px 16px 0 0", padding: "18px 18px calc(18px + env(safe-area-inset-bottom))", boxSizing: "border-box", boxShadow: "0 -6px 24px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 17 }}>{title}</div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: text, padding: 4 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children, accent = P.accent }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      style={{ padding: "6px 11px", borderRadius: 16, border: `1px solid ${active ? accent : P.line}`, background: active ? accent : "rgba(255,255,255,0.6)", color: active ? "#fff" : P.ink, fontFamily: BODY, fontSize: 13, cursor: "pointer" }}>
      {children}
    </button>
  );
}

function Label({ children }) {
  return <div style={{ fontFamily: BODY, fontSize: 12, color: P.soft, margin: "12px 0 6px", textTransform: "uppercase", letterSpacing: 0.6 }}>{children}</div>;
}

function NumInput({ value, onChange, placeholder, width = 80, label }) {
  return (
    <input type="text" inputMode="numeric" aria-label={label || placeholder} value={value ?? ""} placeholder={placeholder}
      onChange={e => { const v = e.target.value.replace(/\D/g, ""); onChange(v === "" ? null : parseInt(v, 10)); }}
      style={{ width, padding: "7px 9px", borderRadius: 8, border: `1px solid ${P.line}`, fontFamily: BODY, fontSize: 14, background: "#fff", color: P.ink, boxSizing: "border-box" }} />
  );
}

function PrimaryButton({ onClick, children, disabled, accent = P.accent }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: disabled ? "#bba98f" : accent, color: "#fff", fontFamily: SERIF, fontWeight: 700, fontSize: 15, cursor: disabled ? "default" : "pointer" }}>
      {children}
    </button>
  );
}
function SecondaryButton({ onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1px solid ${P.line}`, background: "transparent", color: P.mid, fontFamily: SERIF, fontSize: 15, cursor: "pointer" }}>
      {children}
    </button>
  );
}

// ── DNF / pause ────────────────────────────────────────────────────────────

// Asks where the reader stopped and why. "Might come back" saves the book as paused.
export function DnfSheet({ book, mediaType, currentPage, totalPages, progressPct, onSave, onClose, theme }) {
  const isAudio = mediaType === "audiobooks";
  const [page, setPage] = useState(currentPage || null);
  const [pct, setPct] = useState(progressPct || null);
  const [reason, setReason] = useState(null);
  const [note, setNote] = useState("");
  const [mightReturn, setMightReturn] = useState(false);

  const save = () => {
    const stoppedPct = pct != null ? Math.min(100, pct) : (page && totalPages ? Math.min(100, Math.round(page / totalPages * 100)) : null);
    const pagesRead = isAudio ? 0 : (page || (stoppedPct && totalPages ? Math.round(totalPages * stoppedPct / 100) : 0));
    onSave({
      stoppedPage: page || null,
      stoppedPct,
      pagesRead,
      reason: reason || null,
      note: note.trim() || null,
      mightReturn,
    });
  };

  return (
    <Sheet title={mightReturn ? "⏸ Pause this book" : "🚪 Stop reading"} onClose={onClose} theme={theme}>
      <div style={{ fontFamily: BODY, fontSize: 14, color: P.mid, marginBottom: 4 }}>{book.title}</div>

      <Label>Where did you stop?</Label>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontFamily: BODY, fontSize: 14 }}>
        {!isAudio && <>
          <span>Page</span>
          <NumInput value={page} onChange={setPage} placeholder="Pg." label="Page stopped at" />
          {totalPages ? <span style={{ color: P.soft }}>of {totalPages}</span> : null}
          <span style={{ color: P.soft, margin: "0 4px" }}>or</span>
        </>}
        <NumInput value={pct} onChange={setPct} placeholder="%" width={64} label="Percent stopped at" />
        <span>%</span>
      </div>

      <Label>Why? (optional)</Label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {DNF_REASONS.map(r => <Chip key={r} active={reason === r} onClick={() => setReason(reason === r ? null : r)}>{r}</Chip>)}
      </div>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note for future you…" rows={2} aria-label="Note"
        style={{ width: "100%", marginTop: 10, padding: 9, borderRadius: 8, border: `1px solid ${P.line}`, fontFamily: BODY, fontSize: 14, boxSizing: "border-box", resize: "vertical" }} />

      <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, fontFamily: BODY, fontSize: 14, cursor: "pointer" }}>
        <input type="checkbox" checked={mightReturn} onChange={e => setMightReturn(e.target.checked)} style={{ width: 18, height: 18, accentColor: P.accent }} />
        I might come back to it (save as paused)
      </label>

      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton onClick={save}>{mightReturn ? "Pause" : "Mark DNF"}</PrimaryButton>
      </div>
    </Sheet>
  );
}

// Shown on the book screen for a DNF or paused book.
export function DnfBanner({ status, record, mediaType, onResume, theme = {} }) {
  const paused = status === "paused";
  const where = record?.stoppedPage ? `page ${record.stoppedPage}` : record?.stoppedPct != null ? `${record.stoppedPct}%` : null;
  return (
    <div style={{ border: `1px solid ${paused ? "#C9A96E" : "#C47A7A"}`, background: paused ? "rgba(201,169,110,0.12)" : "rgba(196,122,122,0.10)", borderRadius: 10, padding: "10px 12px", marginBottom: 14, fontFamily: BODY, fontSize: 13, color: theme.text || P.ink }}>
      <div style={{ fontWeight: 700, marginBottom: 3 }}>{paused ? "⏸ Paused" : "🚪 Did not finish"}{record?.date ? ` · ${fmtDate(record.date)}` : ""}</div>
      {(where || record?.reason) && <div>{[where && `Stopped at ${where}`, record?.reason].filter(Boolean).join(" · ")}</div>}
      {record?.note && <div style={{ fontStyle: "italic", marginTop: 3 }}>“{record.note}”</div>}
      <button onClick={onResume} style={{ marginTop: 8, padding: "6px 12px", borderRadius: 8, border: `1px solid ${theme.accent || P.accent}`, background: "transparent", color: theme.accent || P.accent, fontFamily: SERIF, fontSize: 13, cursor: "pointer" }}>
        {mediaType === "audiobooks" ? "🎧 Resume listening" : "📖 Resume reading"}
      </button>
    </div>
  );
}

// ── Sessions ───────────────────────────────────────────────────────────────

// After the timer stops: optional pages, mood and place. Skipping keeps the session as is.
export function SessionDetailsSheet({ mediaType, minutes, defaultFromPage, defaultToPage, onSave, onClose, theme }) {
  const isAudio = mediaType === "audiobooks";
  const [fromPage, setFromPage] = useState(defaultFromPage || null);
  const [toPage, setToPage] = useState(defaultToPage || null);
  const [mood, setMood] = useState(null);
  const [place, setPlace] = useState(null);
  const pagesRead = fromPage != null && toPage != null && toPage > fromPage ? toPage - fromPage : null;

  return (
    <Sheet title={`✅ ${fmtMinutes(minutes)} saved`} onClose={onClose} theme={theme}>
      <div style={{ fontFamily: BODY, fontSize: 13, color: P.soft }}>Add details if you like. Everything here is optional and private.</div>
      {!isAudio && <>
        <Label>Pages</Label>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: BODY, fontSize: 14, flexWrap: "wrap" }}>
          <span>From</span><NumInput value={fromPage} onChange={setFromPage} placeholder="Pg." label="From page" />
          <span>to</span><NumInput value={toPage} onChange={setToPage} placeholder="Pg." label="To page" />
          {pagesRead ? <span style={{ color: P.good }}>{pagesRead} pages{minutes > 0 ? ` · ${Math.round(pagesRead / (minutes / 60))}/hr` : ""}</span> : null}
        </div>
      </>}
      <Label>Mood</Label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {MOODS.map(m => <Chip key={m.id} active={mood === m.id} onClick={() => setMood(mood === m.id ? null : m.id)}>{m.emoji} {m.label}</Chip>)}
      </div>
      <Label>Where</Label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {PLACES.map(p => <Chip key={p.id} active={place === p.id} onClick={() => setPlace(place === p.id ? null : p.id)}>{p.emoji} {p.label}</Chip>)}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <SecondaryButton onClick={onClose}>Skip</SecondaryButton>
        <PrimaryButton onClick={() => onSave({ fromPage, toPage, pagesRead, mood, place })}>Save details</PrimaryButton>
      </div>
    </Sheet>
  );
}

// Log a session without the timer (e.g. reading a paperback away from the phone).
export function ManualSessionSheet({ mediaType, defaultFromPage, onSave, onClose, theme }) {
  const isAudio = mediaType === "audiobooks";
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [hours, setHours] = useState(null);
  const [mins, setMins] = useState(null);
  const [fromPage, setFromPage] = useState(defaultFromPage || null);
  const [toPage, setToPage] = useState(null);
  const [mood, setMood] = useState(null);
  const [place, setPlace] = useState(null);
  const minutes = (hours || 0) * 60 + (mins || 0);
  const pagesRead = fromPage != null && toPage != null && toPage > fromPage ? toPage - fromPage : 0;
  const canSave = minutes > 0 || pagesRead > 0;

  const save = () => {
    const now = new Date();
    const d = new Date(`${date}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`);
    onSave({ date: (isNaN(d) ? now : d).toISOString(), minutes, fromPage, toPage, mood, place });
  };

  return (
    <Sheet title={isAudio ? "🎧 Log a listening session" : "📖 Log a reading session"} onClose={onClose} theme={theme}>
      <Label>Date</Label>
      <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)} aria-label="Session date"
        style={{ padding: "7px 9px", borderRadius: 8, border: `1px solid ${P.line}`, fontFamily: BODY, fontSize: 14, background: "#fff", color: P.ink }} />
      <Label>How long</Label>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: BODY, fontSize: 14 }}>
        <NumInput value={hours} onChange={setHours} placeholder="0" width={56} label="Hours" /><span>h</span>
        <NumInput value={mins} onChange={setMins} placeholder="30" width={56} label="Minutes" /><span>min</span>
      </div>
      {!isAudio && <>
        <Label>Pages</Label>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: BODY, fontSize: 14, flexWrap: "wrap" }}>
          <span>From</span><NumInput value={fromPage} onChange={setFromPage} placeholder="Pg." label="From page" />
          <span>to</span><NumInput value={toPage} onChange={setToPage} placeholder="Pg." label="To page" />
        </div>
      </>}
      <Label>Mood</Label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {MOODS.map(m => <Chip key={m.id} active={mood === m.id} onClick={() => setMood(mood === m.id ? null : m.id)}>{m.emoji} {m.label}</Chip>)}
      </div>
      <Label>Where</Label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {PLACES.map(p => <Chip key={p.id} active={place === p.id} onClick={() => setPlace(place === p.id ? null : p.id)}>{p.emoji} {p.label}</Chip>)}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton onClick={save} disabled={!canSave}>Log session</PrimaryButton>
      </div>
    </Sheet>
  );
}

// Small summary of a session's optional details, for session lists.
export function sessionDetailText(s) {
  return [
    s.pagesRead ? `${s.pagesRead} pages` : null,
    s.mood && moodById[s.mood] ? `${moodById[s.mood].emoji} ${moodById[s.mood].label}` : null,
    s.place && placeById[s.place] ? `${placeById[s.place].emoji} ${placeById[s.place].label}` : null,
    s.manual ? "logged by hand" : null,
  ].filter(Boolean).join(" · ");
}

// ── Re-reads ───────────────────────────────────────────────────────────────

// Past read-throughs on the book screen, plus the "Read again" button for a finished book.
export function ReadHistory({ mediaType, bookKeyValue, status, importedReadCount = 0, onReadAgain, theme = {}, refresh }) {
  const [, force] = useState(0);
  const reads = useMemo(() => getBookReads(mediaType, bookKeyValue), [mediaType, bookKeyValue, refresh, force]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = Math.max(importedReadCount, reads.length + (status === "finished" ? 1 : 0));
  const isAudio = mediaType === "audiobooks";
  if (status !== "finished" && reads.length === 0) return null;
  return (
    <div style={{ marginBottom: 14, fontFamily: BODY, fontSize: 13, color: theme.text || P.ink }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {total > 1 && <span style={{ fontWeight: 700 }}>🔁 {isAudio ? "Listened" : "Read"} {total} times</span>}
        {status === "finished" && (
          <button onClick={onReadAgain} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${theme.accent || P.accent}`, background: "transparent", color: theme.accent || P.accent, fontFamily: SERIF, fontSize: 13, cursor: "pointer" }}>
            {isAudio ? "🎧 Listen again" : "📖 Read again"}
          </button>
        )}
      </div>
      {reads.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
          {reads.map((r, i) => (
            <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderTop: `1px dashed ${P.line}` }}>
              <span style={{ flex: 1 }}>
                {isAudio ? "Listen" : "Read"} {i + 1}: {fmtDate(r.startDate)} – {fmtDate(r.endDate)}{r.rating ? ` · ${"★".repeat(r.rating)}` : ""}
              </span>
              <button aria-label={`Remove read ${i + 1}`} onClick={() => { if (window.confirm("Remove this past read?")) { removeRead(mediaType, bookKeyValue, i); force(x => x + 1); } }}
                style={{ background: "none", border: "none", color: P.soft, cursor: "pointer", fontSize: 13 }}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Goals and streaks (free) ───────────────────────────────────────────────

function Bar({ value, max, color = P.accent, label }) {
  const pct = max > 0 ? Math.min(100, Math.round(value / max * 100)) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}
      style={{ height: 10, borderRadius: 5, background: "rgba(139,94,60,0.15)", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 5, transition: "width 0.4s" }} />
    </div>
  );
}

const card = { background: P.card, border: `1px solid ${P.line}`, borderRadius: 12, padding: "14px 14px", marginBottom: 14 };
const h3 = { fontFamily: SERIF, fontWeight: 700, fontSize: 16, color: P.ink, margin: "0 0 10px" };

export function GoalsAndStreak({ books, refreshKey }) {
  const year = new Date().getFullYear();
  const [editing, setEditing] = useState(false);
  const [version, setVersion] = useState(0);
  const goals = useMemo(() => getGoals(), [version, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const goal = goals[year] || {};
  const stats = useMemo(() => computeStats(books, ...yearRange(year)), [books, version, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const streak = useMemo(() => computeStreaks(), [version, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [draft, setDraft] = useState(null);

  // Where the reader should be by today, to show "ahead" or "behind".
  const dayOfYear = Math.floor((Date.now() - new Date(year, 0, 1)) / 86400000) + 1;
  const daysInYear = (new Date(year + 1, 0, 1) - new Date(year, 0, 1)) / 86400000;
  const pace = (target) => Math.round(target * dayOfYear / daysInYear);
  const hours = Math.round(stats.minutes / 60);

  const rows = [
    goal.books > 0 && { label: "Books", value: stats.booksFinished, target: goal.books },
    goal.pages > 0 && { label: "Pages", value: stats.pages, target: goal.pages },
    goal.hours > 0 && { label: "Hours", value: hours, target: goal.hours },
  ].filter(Boolean);

  const startEdit = () => { setDraft({ books: goal.books || null, pages: goal.pages || null, hours: goal.hours || null, restDays: goals.restDays || 0 }); setEditing(true); };
  const saveEdit = () => {
    saveYearGoal(year, { books: draft.books || 0, pages: draft.pages || 0, hours: draft.hours || 0 });
    saveRestDays(draft.restDays || 0);
    setEditing(false); setVersion(v => v + 1);
  };

  return (
    <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginBottom: 14 }}>
      <div style={{ ...card, marginBottom: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h3 style={h3}>🎯 {year} goals</h3>
          {!editing && <button onClick={startEdit} style={{ background: "none", border: "none", color: P.accent, fontFamily: BODY, fontSize: 13, cursor: "pointer" }}>{rows.length ? "Edit" : "Set goals"}</button>}
        </div>
        {editing ? (
          <div style={{ fontFamily: BODY, fontSize: 14, display: "grid", gap: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}><NumInput value={draft.books} onChange={v => setDraft({ ...draft, books: v })} placeholder="52" label="Books goal" /> books</label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}><NumInput value={draft.pages} onChange={v => setDraft({ ...draft, pages: v })} placeholder="15000" label="Pages goal" /> pages</label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}><NumInput value={draft.hours} onChange={v => setDraft({ ...draft, hours: v })} placeholder="200" label="Hours goal" /> hours</label>
            <div style={{ color: P.soft, fontSize: 12, marginTop: 4 }}>Rest days per week that don't break your streak</div>
            <div style={{ display: "flex", gap: 6 }}>{[0, 1, 2, 3].map(n => <Chip key={n} active={draft.restDays === n} onClick={() => setDraft({ ...draft, restDays: n })}>{n}</Chip>)}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <SecondaryButton onClick={() => setEditing(false)}>Cancel</SecondaryButton>
              <PrimaryButton onClick={saveEdit}>Save</PrimaryButton>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ fontFamily: BODY, fontSize: 14, color: P.mid }}>Set a goal for books, pages or hours this year. Every format counts.</div>
        ) : rows.map(r => {
          const expected = pace(r.target);
          const diff = r.value - expected;
          return (
            <div key={r.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: BODY, fontSize: 14, marginBottom: 4 }}>
                <span>{r.label}: <strong>{r.value.toLocaleString()}</strong> of {r.target.toLocaleString()}</span>
                <span style={{ color: r.value >= r.target ? P.good : diff >= 0 ? P.good : P.warn, fontSize: 12 }}>
                  {r.value >= r.target ? "Done! 🎉" : diff >= 0 ? `${diff.toLocaleString()} ahead` : `${(-diff).toLocaleString()} behind`}
                </span>
              </div>
              <Bar value={r.value} max={r.target} label={`${r.label} goal progress`} color={r.value >= r.target ? P.good : P.accent} />
            </div>
          );
        })}
      </div>

      <div style={{ ...card, marginBottom: 0, textAlign: "center" }}>
        <h3 style={h3}>🔥 Reading streak</h3>
        <div style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 700, color: streak.current > 0 ? "#C4622D" : P.soft, lineHeight: 1 }}>{streak.current}</div>
        <div style={{ fontFamily: BODY, fontSize: 13, color: P.mid, marginTop: 4 }}>day{streak.current === 1 ? "" : "s"} in a row</div>
        <div style={{ fontFamily: BODY, fontSize: 12, color: P.soft, marginTop: 8 }}>
          Longest: {streak.longest} · {streak.readToday ? "✅ Read today" : "Log a session today to keep it going"}
        </div>
        {(goals.restDays || 0) > 0 && <div style={{ fontFamily: BODY, fontSize: 11, color: P.soft, marginTop: 4 }}>{goals.restDays} rest day{goals.restDays === 1 ? "" : "s"} a week allowed</div>}
      </div>
    </div>
  );
}

// ── Achievements (free) ────────────────────────────────────────────────────

export function Achievements({ books, refreshKey }) {
  const { unlocked } = useMemo(() => refreshAchievements(books), [books, refreshKey]);
  const count = ACHIEVEMENTS.filter(a => unlocked[a.id]).length;
  return (
    <div style={card}>
      <h3 style={h3}>🏅 Achievements <span style={{ fontWeight: 400, fontSize: 13, color: P.soft }}>{count} of {ACHIEVEMENTS.length}</span></h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(118px, 1fr))", gap: 8 }}>
        {ACHIEVEMENTS.map(a => {
          const got = unlocked[a.id];
          return (
            <div key={a.id} title={a.desc} style={{ border: `1px solid ${got ? "#C9A96E" : P.line}`, background: got ? "rgba(201,169,110,0.15)" : "rgba(255,255,255,0.4)", borderRadius: 10, padding: "8px 8px", opacity: got ? 1 : 0.55, textAlign: "center" }}>
              <div style={{ fontSize: 24, filter: got ? "none" : "grayscale(1)" }} aria-hidden="true">{a.emoji}</div>
              <div style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 700, color: P.ink }}>{a.name}</div>
              <div style={{ fontFamily: BODY, fontSize: 11, color: P.soft }}>{got ? `Unlocked ${fmtDate(got)}` : a.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Advanced stats (paid) ──────────────────────────────────────────────────

function HBars({ rows, color = P.accent, format = (v) => v }) {
  const max = Math.max(1, ...rows.map(r => r[1]));
  return (
    <div style={{ display: "grid", gap: 6 }}>
      {rows.map(([label, v]) => (
        <div key={label} style={{ display: "grid", gridTemplateColumns: "minmax(80px, 34%) 1fr auto", alignItems: "center", gap: 8, fontFamily: BODY, fontSize: 13 }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
          <div style={{ height: 10, background: "rgba(139,94,60,0.12)", borderRadius: 5 }}>
            <div style={{ width: `${Math.round(v / max * 100)}%`, height: "100%", background: color, borderRadius: 5 }} />
          </div>
          <span style={{ minWidth: 28, textAlign: "right", color: P.mid }}>{format(v)}</span>
        </div>
      ))}
    </div>
  );
}

function Tile({ value, label }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.55)", border: `1px solid ${P.line}`, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
      <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: P.accent }}>{value ?? "—"}</div>
      <div style={{ fontFamily: BODY, fontSize: 11, color: P.soft, marginTop: 2 }}>{label}</div>
    </div>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function StatsBody({ s, yearMode }) {
  const tiles = [
    [s.booksFinished, "books finished"],
    [s.pages ? s.pages.toLocaleString() : 0, "pages"],
    [fmtMinutes(s.minutes), "logged"],
    [s.speed ? `${s.speed}/hr` : null, "reading speed"],
    [s.avgDays != null ? `${s.avgDays}d` : null, "avg. days per book"],
    [s.avgRating != null ? `${s.avgRating}★` : null, "avg. rating"],
    [s.rereads, "re-reads"],
    [s.dnfCount, "DNFs"],
  ];
  const sec = { fontFamily: SERIF, fontWeight: 700, fontSize: 14, color: P.ink, margin: "16px 0 8px" };
  const empty = (t) => <div style={{ fontFamily: BODY, fontSize: 13, color: P.soft }}>{t}</div>;
  const fmtRows = MEDIA_TYPES.map(t => [FORMAT_LABELS[t], s.byFormat[t]]);
  const timeRows = MEDIA_TYPES.map(t => [FORMAT_LABELS[t], s.minutesByFormat[t]]);
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8 }}>
        {tiles.map(([v, l]) => <Tile key={l} value={v} label={l} />)}
      </div>

      {yearMode && <>
        <div style={sec}>Books by month</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 90 }} role="img" aria-label={`Books finished per month: ${s.months.map((c, i) => `${MONTHS[i]} ${c}`).join(", ")}`}>
          {s.months.map((c, i) => {
            const max = Math.max(1, ...s.months);
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <span style={{ fontFamily: BODY, fontSize: 10, color: P.mid }}>{c || ""}</span>
                <div style={{ width: "100%", height: `${Math.max(2, c / max * 60)}px`, background: c ? P.accent : "rgba(139,94,60,0.15)", borderRadius: "4px 4px 0 0" }} />
                <span style={{ fontFamily: BODY, fontSize: 10, color: P.soft }}>{MONTHS[i][0]}</span>
              </div>
            );
          })}
        </div>
      </>}

      <div style={sec}>Formats</div>
      {s.booksFinished ? <HBars rows={fmtRows} /> : empty("No books finished in this period yet.")}
      {s.minutes > 0 && <><div style={{ ...sec, fontSize: 13, fontWeight: 400, color: P.mid }}>Time logged by format</div><HBars rows={timeRows} color="#7EB3D4" format={fmtMinutes} /></>}

      <div style={sec}>Genres</div>
      {s.genres.length ? <HBars rows={s.genres.slice(0, 8)} color="#6BAF7A" /> : empty("Finish a book to see your genre mix.")}

      <div style={sec}>When you read</div>
      {s.sessions.length ? <HBars rows={Object.entries(s.timeOfDay)} color="#C9A96E" format={fmtMinutes} /> : empty("Log sessions with the timer to see when you read.")}

      {(s.moods.length > 0 || s.places.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {s.moods.length > 0 && <div><div style={sec}>Moods</div><HBars rows={s.moods.map(([id, n]) => [`${moodById[id]?.emoji || ""} ${moodById[id]?.label || id}`, n])} color="#B48EAD" /></div>}
          {s.places.length > 0 && <div><div style={sec}>Favorite places</div><HBars rows={s.places.map(([id, n]) => [`${placeById[id]?.emoji || ""} ${placeById[id]?.label || id}`, n])} color="#88A07A" /></div>}
        </div>
      )}

      <div style={sec}>Ratings</div>
      {s.ratingDist.some(Boolean) ? <HBars rows={[5, 4, 3, 2, 1].map(r => [`${"★".repeat(r)}`, s.ratingDist[r - 1]])} color="#D4A017" /> : empty("Rate finished books to see your rating spread.")}

      {(s.avgSpice || s.avgCry || s.avgDark) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 12 }}>
          <Tile value={s.avgSpice ? `🌶️ ${s.avgSpice}` : null} label="avg. spice" />
          <Tile value={s.avgCry ? `💧 ${s.avgCry}` : null} label="avg. cry factor" />
          <Tile value={s.avgDark ? `🖤 ${s.avgDark}` : null} label="avg. dark factor" />
        </div>
      )}

      {(s.dnfCount + s.pausedCount) > 0 && <>
        <div style={sec}>Did not finish</div>
        <div style={{ fontFamily: BODY, fontSize: 13, color: P.mid, marginBottom: 6 }}>{s.dnfCount} DNF · {s.pausedCount} paused</div>
        <HBars rows={s.dnfReasons} color="#C47A7A" />
      </>}
    </>
  );
}

// Locked preview for free readers: shows the shape of the stats with an upgrade button.
function Locked({ onUpgrade, title }) {
  return (
    <div style={card}>
      <h3 style={h3}>{title}</h3>
      <div style={{ position: "relative", minHeight: 190, overflow: "hidden", borderRadius: 8 }}>
      <div aria-hidden="true" style={{ filter: "blur(5px)", opacity: 0.45, pointerEvents: "none" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>{["24", "7,812", "142h", "38/hr"].map(v => <Tile key={v} value={v} label="……" />)}</div>
        <div style={{ height: 90, marginTop: 12, background: "linear-gradient(90deg, #8B5E3C 40%, #6BAF7A 40% 65%, #C9A96E 65%)", borderRadius: 8, opacity: 0.5 }} />
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "8px 4px", textAlign: "center" }}>
        <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: P.ink }}>🔒 Detailed stats come with any paid plan</div>
        <div style={{ fontFamily: BODY, fontSize: 13, color: P.mid, maxWidth: 340 }}>Formats, genres, reading speed, moods, places, ratings, DNF reasons, monthly wraps and Year in Review.</div>
        <button onClick={onUpgrade} style={{ padding: "9px 18px", borderRadius: 18, border: "none", background: P.accent, color: "#fff", fontFamily: SERIF, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>See plans</button>
      </div>
      </div>
    </div>
  );
}

export function AdvancedStats({ books, isPaid, onUpgrade, refreshKey }) {
  const now = new Date();
  const [mode, setMode] = useState("year"); // "year" | "month"
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const range = mode === "year" ? yearRange(year) : monthRange(year, month);
  const s = useMemo(() => isPaid ? computeStats(books, ...range) : null, [isPaid, books, mode, year, month, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!isPaid) return <Locked onUpgrade={onUpgrade} title="📊 Detailed stats" />;

  const step = (d) => {
    if (mode === "year") { setYear(y => y + d); return; }
    let m = month + d, y = year;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  };
  const atNow = mode === "year" ? year >= now.getFullYear() : (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth()));
  const navBtn = { background: "none", border: `1px solid ${P.line}`, borderRadius: 8, padding: "4px 10px", cursor: "pointer", color: P.ink, fontFamily: BODY };

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <h3 style={{ ...h3, margin: 0 }}>📊 Detailed stats</h3>
        <div style={{ display: "flex", gap: 6 }}>
          <Chip active={mode === "month"} onClick={() => setMode("month")}>Month</Chip>
          <Chip active={mode === "year"} onClick={() => setMode("year")}>Year</Chip>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 12, fontFamily: SERIF, fontSize: 15 }}>
        <button style={navBtn} onClick={() => step(-1)} aria-label="Previous">‹</button>
        <span style={{ minWidth: 130, textAlign: "center", fontWeight: 700 }}>{mode === "year" ? year : `${MONTHS[month]} ${year}`}</span>
        <button style={{ ...navBtn, opacity: atNow ? 0.35 : 1 }} disabled={atNow} onClick={() => step(1)} aria-label="Next">›</button>
      </div>
      <StatsBody s={s} yearMode={mode === "year"} />
    </div>
  );
}

// ── Monthly wrap / Year in Review (paid) ───────────────────────────────────

// Draws a shareable card on a canvas and returns it as a PNG blob.
async function renderWrapImage({ title, subtitle, lines, highlight }) {
  const W = 1080, H = 1350;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#3A2A1A"); grad.addColorStop(1, "#6B4E32");
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  g.strokeStyle = "#C9A96E"; g.lineWidth = 6; g.strokeRect(40, 40, W - 80, H - 80);
  g.fillStyle = "#F8F1E4"; g.textAlign = "center";
  g.font = "italic 44px Georgia, serif"; g.fillText("StoryKeeper", W / 2, 140);
  g.font = "bold 84px Palatino, Georgia, serif"; g.fillText(title, W / 2, 270);
  g.font = "38px Georgia, serif"; g.fillStyle = "#E8D5B0"; g.fillText(subtitle, W / 2, 330);
  g.font = "bold 200px Palatino, Georgia, serif"; g.fillStyle = "#C9A96E"; g.fillText(String(highlight.value), W / 2, 560);
  g.font = "44px Georgia, serif"; g.fillStyle = "#F8F1E4"; g.fillText(highlight.label, W / 2, 630);
  g.textAlign = "left"; g.font = "40px Georgia, serif";
  lines.slice(0, 8).forEach((l, i) => {
    g.fillStyle = "#C9A96E"; g.fillText("•", 140, 760 + i * 66);
    g.fillStyle = "#F8F1E4";
    let text = l; while (g.measureText(text).width > W - 300 && text.length > 4) text = text.slice(0, -2);
    if (text !== l) text = text.trimEnd() + "…";
    g.fillText(text, 185, 760 + i * 66);
  });
  return new Promise(res => c.toBlob(res, "image/png"));
}

export function WrapCard({ books, isPaid, onUpgrade, shareFile, refreshKey }) {
  const now = new Date();
  // In December and January, Year in Review leads; otherwise last month's wrap.
  const defaultYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const [kind, setKind] = useState(now.getMonth() === 11 || now.getMonth() === 0 ? "year" : "month");
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const [busy, setBusy] = useState(false);
  const range = kind === "year" ? yearRange(defaultYear) : monthRange(lastMonth.getFullYear(), lastMonth.getMonth());
  const s = useMemo(() => isPaid ? computeStats(books, ...range) : null, [isPaid, books, kind, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!isPaid) return null; // the locked stats card already explains what's included

  const title = kind === "year" ? `${defaultYear} in Review` : `${lastMonth.toLocaleString("en-US", { month: "long" })} Wrap`;
  const lines = [
    s.pages ? `${s.pages.toLocaleString()} pages read` : null,
    s.minutes ? `${fmtMinutes(s.minutes)} of reading and listening` : null,
    s.genres[0] ? `Top genre: ${s.genres[0][0]}` : null,
    s.topAuthor && s.topAuthor[1] > 1 ? `Most-read author: ${s.topAuthor[0]} (${s.topAuthor[1]})` : null,
    s.longest ? `Longest book: ${s.longest.book.title}` : null,
    s.fastest ? `Fastest finish: ${s.fastest.book.title} (${s.fastest.days} day${s.fastest.days === 1 ? "" : "s"})` : null,
    s.avgRating ? `Average rating: ${s.avgRating}★` : null,
    s.moods[0] ? `Usual mood: ${moodById[s.moods[0][0]]?.label || s.moods[0][0]}` : null,
    s.places[0] ? `Favorite spot: ${placeById[s.places[0][0]]?.label || s.places[0][0]}` : null,
    s.rereads ? `${s.rereads} re-read${s.rereads === 1 ? "" : "s"}` : null,
  ].filter(Boolean);

  const share = async () => {
    setBusy(true);
    try {
      const blob = await renderWrapImage({ title, subtitle: "My reading, tracked in StoryKeeper", lines, highlight: { value: s.booksFinished, label: s.booksFinished === 1 ? "book finished" : "books finished" } });
      if (blob) await shareFile(blob, `storykeeper-${kind === "year" ? defaultYear : "month"}-wrap.png`, "image/png");
    } finally { setBusy(false); }
  };

  return (
    <div style={{ ...card, background: "linear-gradient(160deg, #3A2A1A, #6B4E32)", color: P.paper, border: "1px solid #C9A96E" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 18 }}>✨ {title}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <Chip active={kind === "month"} onClick={() => setKind("month")} accent="#C9A96E">Month</Chip>
          <Chip active={kind === "year"} onClick={() => setKind("year")} accent="#C9A96E">Year</Chip>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "10px 0" }}>
        <span style={{ fontFamily: SERIF, fontSize: 46, fontWeight: 700, color: "#C9A96E" }}>{s.booksFinished}</span>
        <span style={{ fontFamily: BODY, fontSize: 15 }}>{s.booksFinished === 1 ? "book finished" : "books finished"}</span>
      </div>
      {lines.length ? (
        <ul style={{ margin: "0 0 12px", paddingLeft: 18, fontFamily: BODY, fontSize: 14, lineHeight: 1.7 }}>{lines.map(l => <li key={l}>{l}</li>)}</ul>
      ) : <div style={{ fontFamily: BODY, fontSize: 14, marginBottom: 12, opacity: 0.85 }}>Nothing logged for this period yet. Finished books and timed sessions fill this in.</div>}
      <button onClick={share} disabled={busy || s.booksFinished === 0}
        style={{ padding: "9px 18px", borderRadius: 18, border: "none", background: "#C9A96E", color: "#3A2A1A", fontFamily: SERIF, fontWeight: 700, fontSize: 14, cursor: busy || s.booksFinished === 0 ? "default" : "pointer", opacity: s.booksFinished === 0 ? 0.5 : 1 }}>
        {busy ? "Making your card…" : "📤 Share as image"}
      </button>
    </div>
  );
}
