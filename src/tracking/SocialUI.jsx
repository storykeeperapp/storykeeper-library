// StoryKeeper buddy reads (chapter-locked comments) and community recommendations.
// Needs supabase-phase3-buddy-reads-recs-migration.sql. Until it has run, both sections
// show a short "coming soon" note instead of failing.
import React, { useState, useEffect, useCallback } from "react";

const SERIF = '"Palatino Linotype", Palatino, serif';
const BODY = "Georgia, serif";

const withTimeout = (p, ms = 15000) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("Timed out. Check your connection.")), ms))]);
const isMissingSchema = (err) => {
  const m = `${err?.code || ""} ${err?.message || ""}`;
  return /42P01|42883|PGRST20[0-9]|does not exist|Could not find the (table|function)/i.test(m);
};
const fmtDay = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function Card({ th, children }) {
  return <div style={{ background: th.bgMuted || "rgba(255,255,255,0.6)", border: `1px solid ${th.border}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>{children}</div>;
}
function Btn({ th, onClick, children, primary, disabled, small }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: small ? "5px 10px" : "9px 14px", borderRadius: 10, cursor: disabled ? "default" : "pointer", fontFamily: SERIF, fontSize: small ? 13 : 14, fontWeight: primary ? 700 : 400,
        border: primary ? "none" : `1px solid ${th.accent}`, background: primary ? th.accent : "transparent", color: primary ? (th.bg || "#fff") : th.accent, opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );
}
const field = (th) => ({ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${th.border}`, fontFamily: BODY, fontSize: 14, background: th.bgDeep || "#fff", color: th.text, boxSizing: "border-box" });

// ── Buddy reads ────────────────────────────────────────────────────────────

export function BuddyReadsSection({ sb, authUser, th, libraryBooks = [] }) {
  const [reads, setReads] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | unavailable | error
  const [error, setError] = useState("");
  const [mode, setMode] = useState(null); // null | "create" | "join"
  const [openId, setOpenId] = useState(null);
  const username = authUser?.user_metadata?.full_name || (authUser?.email || "reader").split("@")[0];

  const load = useCallback(async () => {
    if (!sb || !authUser) return;
    try {
      const { data, error: e } = await withTimeout(sb.from("buddy_reads").select("*, buddy_read_members(user_id, username, current_chapter, finished_at)").order("created_at", { ascending: false }));
      if (e) throw e;
      setReads(data || []); setState("ready");
    } catch (e) {
      if (isMissingSchema(e)) setState("unavailable"); else { setError(e.message || "Couldn't load buddy reads."); setState("error"); }
    }
  }, [sb, authUser]);
  useEffect(() => { load(); }, [load]);

  if (!authUser) return null;
  const open = reads?.find(r => r.id === openId);

  return (
    <Card th={th}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 17, color: th.text }}>👯 Buddy reads</div>
        {state === "ready" && !open && (
          <div style={{ display: "flex", gap: 6 }}>
            <Btn th={th} small onClick={() => setMode(mode === "join" ? null : "join")}>Join with code</Btn>
            <Btn th={th} small primary onClick={() => setMode(mode === "create" ? null : "create")}>+ Start one</Btn>
          </div>
        )}
      </div>
      <div style={{ fontFamily: BODY, fontSize: 13, color: th.textSoft, margin: "4px 0 10px" }}>
        Read a book with friends. Comments stay hidden until you reach their chapter.
      </div>

      {state === "loading" && <div style={{ fontFamily: BODY, fontSize: 13, color: th.textSoft }}>Loading…</div>}
      {state === "unavailable" && <div style={{ fontFamily: BODY, fontSize: 13, color: th.textSoft, fontStyle: "italic" }}>Buddy reads are coming soon.</div>}
      {state === "error" && <div style={{ fontFamily: BODY, fontSize: 13, color: "#8B2A2A" }}>{error} <Btn th={th} small onClick={load}>Try again</Btn></div>}

      {state === "ready" && mode === "create" && <CreateBuddyRead sb={sb} authUser={authUser} username={username} th={th} libraryBooks={libraryBooks}
        onDone={(id) => { setMode(null); load().then(() => setOpenId(id)); }} onCancel={() => setMode(null)} />}
      {state === "ready" && mode === "join" && <JoinBuddyRead sb={sb} username={username} th={th}
        onDone={(id) => { setMode(null); load().then(() => setOpenId(id)); }} onCancel={() => setMode(null)} />}

      {state === "ready" && open && <BuddyReadDetail sb={sb} authUser={authUser} username={username} read={open} th={th} onBack={() => { setOpenId(null); load(); }} onChanged={load} />}

      {state === "ready" && !open && !mode && (reads.length === 0
        ? <div style={{ fontFamily: BODY, fontSize: 13, color: th.textMid }}>No buddy reads yet. Start one and share the invite code.</div>
        : reads.map(r => {
          const me = r.buddy_read_members?.find(m => m.user_id === authUser.id);
          const total = r.total_chapters || 0;
          return (
            <button key={r.id} onClick={() => setOpenId(r.id)} style={{ display: "flex", gap: 10, alignItems: "center", width: "100%", textAlign: "left", padding: 10, marginBottom: 8, borderRadius: 10, border: `1px solid ${th.border}`, background: th.bg, cursor: "pointer", color: th.text }}>
              {r.cover_url ? <img src={r.cover_url} alt="" style={{ width: 38, height: 56, objectFit: "cover", borderRadius: 4 }} /> : <span style={{ fontSize: 28 }} aria-hidden="true">📖</span>}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: SERIF, fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                <span style={{ display: "block", fontFamily: BODY, fontSize: 12, color: th.textSoft }}>
                  {r.buddy_read_members?.length || 1} reader{(r.buddy_read_members?.length || 1) === 1 ? "" : "s"} · you're at {me?.finished_at ? "the end 🎉" : `ch. ${me?.current_chapter || 0}${total ? ` of ${total}` : ""}`}
                </span>
              </span>
              <span aria-hidden="true" style={{ color: th.textSoft }}>›</span>
            </button>
          );
        }))}
    </Card>
  );
}

function CreateBuddyRead({ sb, authUser, username, th, libraryBooks, onDone, onCancel }) {
  const candidates = libraryBooks.filter(b => b.title).slice(0, 400);
  const [pick, setPick] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [chapters, setChapters] = useState("");
  const [start, setStart] = useState((() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })());
  const [busy, setBusy] = useState(false);
  const chosen = candidates[parseInt(pick, 10)];

  const create = async () => {
    setBusy(true);
    try {
      const row = {
        created_by: authUser.id,
        title: (chosen?.title || title).trim().slice(0, 300),
        author: (chosen?.author || author).trim().slice(0, 300) || null,
        isbn: chosen?.isbn || null,
        cover_url: chosen?.coverUrl || null,
        total_chapters: parseInt(chapters, 10) || null,
        start_date: start || null,
      };
      const { data, error } = await withTimeout(sb.from("buddy_reads").insert(row).select("id").single());
      if (error) throw error;
      const { error: e2 } = await withTimeout(sb.from("buddy_read_members").insert({ buddy_read_id: data.id, user_id: authUser.id, username }));
      if (e2) throw e2;
      onDone(data.id);
    } catch (e) { alert(e.message || "Couldn't start the buddy read."); } finally { setBusy(false); }
  };

  return (
    <div style={{ display: "grid", gap: 8, marginBottom: 12, fontFamily: BODY, fontSize: 14, color: th.text }}>
      <label>Book from your library
        <select value={pick} onChange={e => setPick(e.target.value)} style={{ ...field(th), marginTop: 4 }}>
          <option value="">Type a book instead…</option>
          {candidates.map((b, i) => <option key={i} value={i}>{b.title}{b.author ? ` (${b.author})` : ""}</option>)}
        </select>
      </label>
      {!chosen && <>
        <input style={field(th)} placeholder="Book title" value={title} onChange={e => setTitle(e.target.value)} aria-label="Book title" />
        <input style={field(th)} placeholder="Author" value={author} onChange={e => setAuthor(e.target.value)} aria-label="Author" />
      </>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <label>Chapters<input style={{ ...field(th), marginTop: 4 }} inputMode="numeric" placeholder="e.g. 32" value={chapters} onChange={e => setChapters(e.target.value.replace(/\D/g, "").slice(0, 3))} /></label>
        <label>Start date<input type="date" style={{ ...field(th), marginTop: 4 }} value={start} onChange={e => setStart(e.target.value)} /></label>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn th={th} onClick={onCancel}>Cancel</Btn>
        <Btn th={th} primary disabled={busy || !(chosen || title.trim())} onClick={create}>{busy ? "Starting…" : "Start buddy read"}</Btn>
      </div>
    </div>
  );
}

function JoinBuddyRead({ sb, username, th, onDone, onCancel }) {
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const look = async () => {
    setBusy(true); setPreview(null);
    try {
      const { data, error } = await withTimeout(sb.rpc("preview_buddy_read", { p_code: code }));
      if (error) throw error;
      if (!data?.length) { alert("No buddy read has that code. Check it and try again."); return; }
      setPreview(data[0]);
    } catch (e) { alert(e.message || "Couldn't look up that code."); } finally { setBusy(false); }
  };
  const join = async () => {
    setBusy(true);
    try {
      const { data, error } = await withTimeout(sb.rpc("join_buddy_read", { p_code: code, p_username: username }));
      if (error) throw error;
      onDone(data);
    } catch (e) { alert(e.message || "Couldn't join."); } finally { setBusy(false); }
  };
  return (
    <div style={{ display: "grid", gap: 8, marginBottom: 12, fontFamily: BODY, fontSize: 14, color: th.text }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input style={{ ...field(th), textTransform: "uppercase", letterSpacing: 2 }} maxLength={6} placeholder="Invite code" value={code} onChange={e => setCode(e.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase())} aria-label="Invite code" />
        <Btn th={th} disabled={busy || code.length < 6} onClick={look}>Find</Btn>
      </div>
      {preview && (
        <div style={{ padding: 10, borderRadius: 10, border: `1px solid ${th.border}` }}>
          <div style={{ fontFamily: SERIF, fontWeight: 700 }}>{preview.title}</div>
          <div style={{ fontSize: 12, color: th.textSoft }}>{[preview.author, `${preview.member_count} reader${preview.member_count === 1 ? "" : "s"}`].filter(Boolean).join(" · ")}</div>
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn th={th} onClick={onCancel}>Cancel</Btn>
        <Btn th={th} primary disabled={busy || !preview} onClick={join}>Join</Btn>
      </div>
    </div>
  );
}

function BuddyReadDetail({ sb, authUser, username, read, th, onBack, onChanged }) {
  const members = read.buddy_read_members || [];
  const me = members.find(m => m.user_id === authUser.id) || { current_chapter: 0 };
  const total = read.total_chapters || 0;
  const [chapter, setChapter] = useState(me.current_chapter || 0);
  const [comments, setComments] = useState([]);
  const [locked, setLocked] = useState([]);
  const [text, setText] = useState("");
  const [about, setAbout] = useState(me.current_chapter || 0);
  const [busy, setBusy] = useState(false);
  const isCreator = read.created_by === authUser.id;

  const loadComments = useCallback(async () => {
    const [{ data: c }, { data: l }] = await Promise.all([
      withTimeout(sb.from("buddy_read_comments").select("*").eq("buddy_read_id", read.id).order("chapter").order("created_at")),
      withTimeout(sb.rpc("buddy_locked_counts", { p_read: read.id })),
    ]).catch(() => [{ data: [] }, { data: [] }]);
    setComments(c || []); setLocked(l || []);
  }, [sb, read.id]);
  useEffect(() => { loadComments(); }, [loadComments]);

  const saveChapter = async (n) => {
    const next = Math.max(0, total ? Math.min(total, n) : n);
    setChapter(next); setAbout(next);
    const { error } = await withTimeout(sb.from("buddy_read_members").update({ current_chapter: next, finished_at: total && next >= total ? new Date().toISOString() : null })
      .eq("buddy_read_id", read.id).eq("user_id", authUser.id)).catch(e => ({ error: e }));
    if (error) { alert(error.message); return; }
    onChanged(); loadComments();
  };
  const post = async () => {
    setBusy(true);
    try {
      const { error } = await withTimeout(sb.from("buddy_read_comments").insert({ buddy_read_id: read.id, user_id: authUser.id, username, chapter: about, body: text.trim().slice(0, 2000) }));
      if (error) throw error;
      setText(""); loadComments();
    } catch (e) { alert(e.message || "Couldn't post."); } finally { setBusy(false); }
  };
  const del = async (id) => {
    if (!window.confirm("Delete your comment?")) return;
    await withTimeout(sb.from("buddy_read_comments").delete().eq("id", id)).catch(() => {});
    loadComments();
  };
  const leave = async () => {
    if (!window.confirm(isCreator ? "Delete this buddy read for everyone?" : "Leave this buddy read?")) return;
    const q = isCreator ? sb.from("buddy_reads").delete().eq("id", read.id) : sb.from("buddy_read_members").delete().eq("buddy_read_id", read.id).eq("user_id", authUser.id);
    const { error } = await withTimeout(q).catch(e => ({ error: e }));
    if (error) { alert(error.message); return; }
    onBack();
  };
  const invite = async () => {
    const msg = `Join my buddy read of "${read.title}" on StoryKeeper! Open Clubs & Buddy Reads, tap "Join with code" and enter ${read.invite_code}`;
    try { if (navigator.share) { await navigator.share({ text: msg }); return; } } catch (e) { if (e?.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(msg); alert(`Invite copied. Code: ${read.invite_code}`); } catch { alert(`Invite code: ${read.invite_code}`); }
  };

  const byChapter = {};
  comments.forEach(c => { (byChapter[c.chapter] ||= []).push(c); });

  return (
    <div style={{ fontFamily: BODY, color: th.text }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: th.accent, cursor: "pointer", fontFamily: BODY, fontSize: 13, padding: 0, marginBottom: 8 }}>‹ All buddy reads</button>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {read.cover_url && <img src={read.cover_url} alt="" style={{ width: 54, height: 80, objectFit: "cover", borderRadius: 4 }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 17 }}>{read.title}</div>
          <div style={{ fontSize: 13, color: th.textSoft }}>{[read.author, read.start_date && `started ${fmtDay(read.start_date + "T12:00:00")}`].filter(Boolean).join(" · ")}</div>
          <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: th.textSoft }}>Invite code <strong style={{ letterSpacing: 2, color: th.text }}>{read.invite_code}</strong></span>
            <Btn th={th} small onClick={invite}>Invite</Btn>
          </div>
        </div>
      </div>

      <div style={{ margin: "14px 0 6px", fontFamily: SERIF, fontWeight: 700, fontSize: 14 }}>Where everyone is</div>
      {[...members].sort((a, b) => b.current_chapter - a.current_chapter).map(m => (
        <div key={m.user_id} style={{ display: "grid", gridTemplateColumns: "minmax(70px, 30%) 1fr auto", gap: 8, alignItems: "center", fontSize: 13, marginBottom: 4 }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: m.user_id === authUser.id ? 700 : 400 }}>{m.user_id === authUser.id ? "You" : (m.username || "Reader")}</span>
          <div style={{ height: 8, background: "rgba(139,94,60,0.15)", borderRadius: 4 }}>
            <div style={{ width: total ? `${Math.min(100, m.current_chapter / total * 100)}%` : "0%", height: "100%", background: m.finished_at ? "#4A7C59" : th.accent, borderRadius: 4 }} />
          </div>
          <span style={{ color: th.textSoft }}>{m.finished_at ? "Done 🎉" : `ch. ${m.current_chapter}`}</span>
        </div>
      ))}

      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0", flexWrap: "wrap", fontSize: 14 }}>
        <span>I've reached chapter</span>
        <Btn th={th} small onClick={() => saveChapter(chapter - 1)} disabled={chapter <= 0}>−</Btn>
        <strong style={{ minWidth: 28, textAlign: "center" }}>{chapter}</strong>
        <Btn th={th} small onClick={() => saveChapter(chapter + 1)} disabled={total > 0 && chapter >= total}>+</Btn>
        {total > 0 && <span style={{ color: th.textSoft }}>of {total}</span>}
      </div>

      <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 14, margin: "8px 0 6px" }}>Discussion</div>
      {comments.length === 0 && locked.length === 0 && <div style={{ fontSize: 13, color: th.textSoft }}>No comments yet. Say something about the chapter you're on.</div>}
      {Object.keys(byChapter).map(Number).sort((a, b) => a - b).map(ch => (
        <div key={ch} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: th.textSoft, textTransform: "uppercase", letterSpacing: 0.6, margin: "6px 0 4px" }}>{ch === 0 ? "Before starting" : `Chapter ${ch}`}</div>
          {byChapter[ch].map(c => (
            <div key={c.id} style={{ padding: "6px 10px", borderLeft: `3px solid ${th.accent}`, background: th.bg, borderRadius: "0 8px 8px 0", marginBottom: 4 }}>
              <div style={{ fontSize: 12, color: th.textSoft }}>{c.user_id === authUser.id ? "You" : (c.username || "Reader")} · {fmtDay(c.created_at)}
                {c.user_id === authUser.id && <button onClick={() => del(c.id)} style={{ background: "none", border: "none", color: th.textSoft, cursor: "pointer", fontSize: 12, marginLeft: 6 }}>Delete</button>}
              </div>
              <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{c.body}</div>
            </div>
          ))}
        </div>
      ))}
      {locked.length > 0 && (
        <div style={{ fontSize: 13, color: th.textSoft, fontStyle: "italic", margin: "6px 0" }}>
          🔒 {locked.reduce((a, l) => a + Number(l.comments), 0)} more comment{locked.reduce((a, l) => a + Number(l.comments), 0) === 1 ? "" : "s"} unlock as you read (chapter{locked.length === 1 ? "" : "s"} {locked.map(l => l.chapter).join(", ")}).
        </div>
      )}

      <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
        <textarea rows={2} value={text} onChange={e => setText(e.target.value)} placeholder="Share a thought…" aria-label="Comment" style={{ ...field(th), resize: "vertical" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, flexWrap: "wrap" }}>
          <span>About chapter</span>
          <select value={about} onChange={e => setAbout(parseInt(e.target.value, 10))} style={{ ...field(th), width: "auto", padding: "4px 8px" }} aria-label="Comment is about chapter">
            {Array.from({ length: chapter + 1 }, (_, i) => <option key={i} value={i}>{i === 0 ? "Before starting" : i}</option>)}
          </select>
          <span style={{ flex: 1, color: th.textSoft, fontSize: 12 }}>Hidden from anyone not there yet</span>
          <Btn th={th} primary small disabled={busy || !text.trim()} onClick={post}>Post</Btn>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button onClick={leave} style={{ background: "none", border: "none", color: "#8B2A2A", cursor: "pointer", fontFamily: BODY, fontSize: 13, padding: 0 }}>{isCreator ? "Delete this buddy read" : "Leave this buddy read"}</button>
      </div>
    </div>
  );
}

// ── Community recommendations ──────────────────────────────────────────────

const normKey = (b) => (b.isbn ? String(b.isbn) : `${(b.title || "").toLowerCase().replace(/\s*\(.*?\)\s*$/, "").trim()}|${(b.author || "").toLowerCase().trim()}`).slice(0, 400);

export function RecommendationsSection({ sb, authUser, th, libraryBooks = [] }) {
  const [optIn, setOptIn] = useState(() => localStorage.getItem("sk_share_ratings") === "1");
  const [recs, setRecs] = useState(null);
  const [kind, setKind] = useState("similar");
  const [state, setState] = useState("idle"); // idle | loading | ready | unavailable | error
  const [error, setError] = useState("");

  const ratings = (() => { try { return JSON.parse(localStorage.getItem("sk_ratings") || "{}"); } catch { return {}; } })();
  const rated = libraryBooks.map(b => ({ b, r: ratings[b.isbn || b.title] })).filter(x => x.r >= 1 && x.r <= 5);
  const owned = [...new Set(libraryBooks.map(normKey))];

  const run = useCallback(async () => {
    if (!sb || !authUser || !optIn) return;
    setState("loading");
    try {
      // Refresh this reader's shared ratings, then ask for recommendations.
      const rows = rated.map(({ b, r }) => ({ user_id: authUser.id, book_key: normKey(b), title: (b.title || "").slice(0, 300), author: (b.author || "").slice(0, 300) || null, isbn: b.isbn || null, rating: Math.round(r), updated_at: new Date().toISOString() }));
      const unique = Object.values(Object.fromEntries(rows.map(r => [r.book_key, r])));
      for (let i = 0; i < unique.length; i += 500) {
        const { error: e } = await withTimeout(sb.from("shared_ratings").upsert(unique.slice(i, i + 500), { onConflict: "user_id,book_key" }));
        if (e) throw e;
      }
      const loved = unique.filter(r => r.rating >= 4).map(r => r.book_key).slice(0, 200);
      let data = [], k = "similar";
      if (loved.length) {
        const res = await withTimeout(sb.rpc("book_recommendations", { p_keys: loved, p_exclude: owned.slice(0, 2000), p_limit: 12 }));
        if (res.error) throw res.error;
        data = res.data || [];
      }
      if (data.length === 0) {
        const res = await withTimeout(sb.rpc("popular_with_readers", { p_exclude: owned.slice(0, 2000), p_limit: 12 }));
        if (res.error) throw res.error;
        data = res.data || []; k = "popular";
      }
      setRecs(data); setKind(k); setState("ready");
    } catch (e) {
      if (isMissingSchema(e)) setState("unavailable"); else { setError(e.message || "Couldn't load recommendations."); setState("error"); }
    }
  }, [sb, authUser, optIn]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, [run]);

  const toggle = async (on) => {
    setOptIn(on);
    localStorage.setItem("sk_share_ratings", on ? "1" : "0");
    if (!on) {
      setRecs(null); setState("idle");
      // Turning sharing off removes every rating this reader shared.
      if (sb && authUser) await withTimeout(sb.from("shared_ratings").delete().eq("user_id", authUser.id)).catch(() => {});
    }
  };

  if (!authUser) return null;
  return (
    <Card th={th}>
      <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 17, color: th.text }}>✨ Readers like you loved</div>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, margin: "8px 0", fontFamily: BODY, fontSize: 13, color: th.textMid, cursor: "pointer" }}>
        <input type="checkbox" checked={optIn} onChange={e => toggle(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1, accentColor: th.accent }} />
        <span>Share my star ratings anonymously to get recommendations. Nobody sees who rated what, only totals. Turning this off deletes what you shared.</span>
      </label>
      {optIn && rated.length === 0 && <div style={{ fontFamily: BODY, fontSize: 13, color: th.textSoft }}>Rate a few books you've read to get recommendations.</div>}
      {state === "loading" && <div style={{ fontFamily: BODY, fontSize: 13, color: th.textSoft }}>Finding books…</div>}
      {state === "unavailable" && <div style={{ fontFamily: BODY, fontSize: 13, color: th.textSoft, fontStyle: "italic" }}>Recommendations are coming soon.</div>}
      {state === "error" && <div style={{ fontFamily: BODY, fontSize: 13, color: "#8B2A2A" }}>{error}</div>}
      {state === "ready" && (recs.length === 0
        ? <div style={{ fontFamily: BODY, fontSize: 13, color: th.textSoft }}>Not enough readers have shared ratings yet. Check back soon.</div>
        : <>
          <div style={{ fontFamily: BODY, fontSize: 12, color: th.textSoft, marginBottom: 6 }}>{kind === "similar" ? "Loved by readers who also loved your favorites" : "Top rated across StoryKeeper readers"}</div>
          {recs.map(r => (
            <div key={r.book_key} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0", borderTop: `1px dashed ${th.border}` }}>
              {r.isbn ? <img src={`https://covers.openlibrary.org/b/isbn/${r.isbn}-S.jpg`} alt="" style={{ width: 30, height: 44, objectFit: "cover", borderRadius: 3, background: th.border }} /> : <span style={{ width: 30, textAlign: "center" }} aria-hidden="true">📖</span>}
              <span style={{ flex: 1, minWidth: 0, fontFamily: BODY, fontSize: 13, color: th.text }}>
                <span style={{ display: "block", fontFamily: SERIF, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                <span style={{ color: th.textSoft }}>{[r.author, `${r.avg_rating}★ from ${r.readers} readers`].filter(Boolean).join(" · ")}</span>
              </span>
            </div>
          ))}
        </>)}
    </Card>
  );
}
