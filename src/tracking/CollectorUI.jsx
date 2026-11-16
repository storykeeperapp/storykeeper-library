// StoryKeeper collector copies and quotes.
//
// Copies live on the book record itself (book.copies), so one book keeps one set of
// ratings, notes and status however many editions the reader owns. Quotes live in
// sk_quotes, keyed like statuses (ISBN, or title when there's none).
import React, { useState, useMemo } from "react";

const SERIF = '"Palatino Linotype", Palatino, serif';
const BODY = "Georgia, serif";
const P = { ink: "#3A2A1A", mid: "#6B4E32", soft: "#8B7355", accent: "#8B5E3C", line: "#D8C3A5", paper: "#F8F1E4", card: "rgba(255,255,255,0.7)", good: "#4A7C59" };

export const COPY_FORMATS = ["Hardcover", "Paperback", "Mass market", "Special edition", "Box set", "ARC / proof", "Other"];
export const COPY_STATUSES = [
  { id: "owned", label: "Owned", emoji: "📚" },
  { id: "preordered", label: "Pre-ordered", emoji: "⏳" },
  { id: "wishlist", label: "Wishlist", emoji: "💭" },
];
export const CONDITIONS = ["New", "Like new", "Good", "Fair", "Worn"];

const newId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const money = (n) => {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: guessCurrency() }).format(n); }
  catch { return `$${Number(n).toFixed(2)}`; }
};
function guessCurrency() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.startsWith("Europe/London")) return "GBP";
    if (tz.startsWith("Europe/")) return "EUR";
    if (tz.startsWith("Australia/")) return "AUD";
    if (tz.startsWith("America/Toronto") || tz.startsWith("America/Vancouver")) return "CAD";
  } catch {}
  return "USD";
}

// ── Data helpers ───────────────────────────────────────────────────────────

const typeOf = (b) => b.type || (b.mediaType === "audiobook" ? "audiobooks" : b.mediaType === "physical" ? "physical" : "ebooks");

// Finds the stored record for a book shown on screen.
function findIndex(all, book) {
  if (typeof book._libIdx === "number" && all[book._libIdx] &&
    ((book.isbn && all[book._libIdx].isbn === book.isbn) || all[book._libIdx].title === book.title)) return book._libIdx;
  const t = typeOf(book);
  return all.findIndex(b => typeOf(b) === t && ((book.isbn && b.isbn === book.isbn) || b.title === book.title));
}

export function getCopies(book, getUserBooks) {
  const all = getUserBooks();
  const i = findIndex(all, book);
  return i === -1 ? (book.copies || []) : (all[i].copies || []);
}

export function saveCopies(book, copies, getUserBooks, saveUserBooks) {
  const all = getUserBooks();
  const i = findIndex(all, book);
  if (i === -1) return false;
  all[i] = { ...all[i], copies };
  saveUserBooks(all);
  return true;
}

// Every copy across the library, for the collection summary.
export function collectCopies(books) {
  const rows = [];
  books.forEach(b => (b.copies || []).forEach(c => rows.push({ ...c, book: b })));
  return rows;
}

// Shrinks a photo to a small JPEG data URL, so it can travel with the library backup.
export function compressPhoto(file, maxSide = 520, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read the photo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't open the photo"));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── Shared pieces ──────────────────────────────────────────────────────────

function Sheet({ title, onClose, children }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={title}
      style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: P.paper, color: P.ink, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", borderRadius: "16px 16px 0 0", padding: "18px 18px calc(18px + env(safe-area-inset-bottom))", boxSizing: "border-box", boxShadow: "0 -6px 24px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 17 }}>{title}</div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: P.ink, padding: 4 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      style={{ padding: "6px 11px", borderRadius: 16, border: `1px solid ${active ? P.accent : P.line}`, background: active ? P.accent : "rgba(255,255,255,0.6)", color: active ? "#fff" : P.ink, fontFamily: BODY, fontSize: 13, cursor: "pointer" }}>
      {children}
    </button>
  );
}
const Label = ({ children }) => <div style={{ fontFamily: BODY, fontSize: 12, color: P.soft, margin: "12px 0 6px", textTransform: "uppercase", letterSpacing: 0.6 }}>{children}</div>;
const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${P.line}`, fontFamily: BODY, fontSize: 14, background: "#fff", color: P.ink, boxSizing: "border-box" };
function Toggle({ checked, onChange, children }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: BODY, fontSize: 14, cursor: "pointer" }}>
      <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} style={{ width: 18, height: 18, accentColor: P.accent }} />
      {children}
    </label>
  );
}
function Buttons({ onCancel, onSave, saveLabel = "Save", disabled, onDelete }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
      {onDelete && <button onClick={onDelete} style={{ padding: "11px 14px", borderRadius: 10, border: "1px solid #C47A7A", background: "transparent", color: "#8B2A2A", fontFamily: SERIF, fontSize: 14, cursor: "pointer" }}>Delete</button>}
      <button onClick={onCancel} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${P.line}`, background: "transparent", color: P.mid, fontFamily: SERIF, fontSize: 15, cursor: "pointer" }}>Cancel</button>
      <button onClick={onSave} disabled={disabled} style={{ flex: 1, padding: 11, borderRadius: 10, border: "none", background: disabled ? "#bba98f" : P.accent, color: "#fff", fontFamily: SERIF, fontWeight: 700, fontSize: 15, cursor: disabled ? "default" : "pointer" }}>{saveLabel}</button>
    </div>
  );
}

function PhotoPicker({ value, onChange, label = "Photo" }) {
  const [busy, setBusy] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {value && <img src={value} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: `1px solid ${P.line}` }} />}
      <label style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${P.accent}`, color: P.accent, fontFamily: SERIF, fontSize: 13, cursor: "pointer" }}>
        {busy ? "Adding…" : value ? "Change photo" : `📷 Add ${label.toLowerCase()}`}
        <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
          const f = e.target.files?.[0]; e.target.value = "";
          if (!f) return;
          setBusy(true);
          try { onChange(await compressPhoto(f)); } catch (err) { alert(err.message); } finally { setBusy(false); }
        }} />
      </label>
      {value && <button onClick={() => onChange(null)} style={{ background: "none", border: "none", color: P.soft, cursor: "pointer", fontFamily: BODY, fontSize: 13 }}>Remove</button>}
    </div>
  );
}

// ── Copy editor ────────────────────────────────────────────────────────────

export function CopySheet({ copy, defaults = {}, onSave, onDelete, onClose }) {
  const [c, setC] = useState(() => copy || { id: newId(), status: "owned", format: "Hardcover", ...defaults });
  const set = (patch) => setC(prev => ({ ...prev, ...patch }));
  const wish = c.status === "wishlist";
  return (
    <Sheet title={copy ? "Edit copy" : "Add a copy"} onClose={onClose}>
      <Label>Status</Label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {COPY_STATUSES.map(s => <Chip key={s.id} active={c.status === s.id} onClick={() => set({ status: s.id })}>{s.emoji} {s.label}</Chip>)}
      </div>
      <Label>Format</Label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {COPY_FORMATS.map(f => <Chip key={f} active={c.format === f} onClick={() => set({ format: f })}>{f}</Chip>)}
      </div>
      <Label>Edition name</Label>
      <input style={inputStyle} value={c.edition || ""} onChange={e => set({ edition: e.target.value })} placeholder="e.g. Illumicrate exclusive, 10th anniversary" aria-label="Edition name" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div><Label>Publisher</Label><input style={inputStyle} value={c.publisher || ""} onChange={e => set({ publisher: e.target.value })} aria-label="Publisher" /></div>
        <div><Label>Year</Label><input style={inputStyle} inputMode="numeric" value={c.year || ""} onChange={e => set({ year: e.target.value.replace(/\D/g, "").slice(0, 4) })} aria-label="Year" /></div>
      </div>
      <Label>ISBN</Label>
      <input style={inputStyle} inputMode="numeric" value={c.isbn || ""} onChange={e => set({ isbn: e.target.value.replace(/[^\dXx]/g, "") })} aria-label="ISBN" />

      <Label>Details</Label>
      <div style={{ display: "grid", gap: 8 }}>
        <Toggle checked={c.signed} onChange={v => set({ signed: v })}>✍️ Signed{c.signed && <input style={{ ...inputStyle, width: "auto", flex: 1, padding: "4px 8px" }} value={c.signedNote || ""} onChange={e => set({ signedNote: e.target.value })} placeholder="Personalized? Event?" aria-label="Signing details" />}</Toggle>
        <Toggle checked={c.sprayedEdges} onChange={v => set({ sprayedEdges: v })}>🎨 Sprayed or stenciled edges</Toggle>
        <Toggle checked={c.firstEdition} onChange={v => set({ firstEdition: v })}>🥇 First edition / first printing</Toggle>
        <Toggle checked={c.dustJacket} onChange={v => set({ dustJacket: v })}>📕 Dust jacket</Toggle>
      </div>

      {!wish && <>
        <Label>Condition</Label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CONDITIONS.map(x => <Chip key={x} active={c.condition === x} onClick={() => set({ condition: c.condition === x ? null : x })}>{x}</Chip>)}
        </div>
      </>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div><Label>{wish ? "Where to buy" : "Bought from"}</Label><input style={inputStyle} value={c.purchasedFrom || ""} onChange={e => set({ purchasedFrom: e.target.value })} placeholder="Shop, box, author" aria-label="Bought from" /></div>
        <div><Label>{wish ? "Price" : "Paid"}</Label><input style={inputStyle} inputMode="decimal" value={c.price ?? ""} onChange={e => set({ price: e.target.value.replace(/[^\d.]/g, "") })} placeholder="0.00" aria-label="Price" /></div>
      </div>
      {!wish && <><Label>Date bought</Label><input type="date" style={inputStyle} value={c.purchaseDate || ""} onChange={e => set({ purchaseDate: e.target.value })} aria-label="Date bought" /></>}

      <Label>Photo</Label>
      <PhotoPicker value={c.photo} onChange={v => set({ photo: v })} />
      <Label>Notes</Label>
      <textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} value={c.notes || ""} onChange={e => set({ notes: e.target.value })} aria-label="Notes" />

      <Buttons onCancel={onClose} onDelete={copy ? () => { if (window.confirm("Delete this copy?")) onDelete(c.id); } : null}
        onSave={() => onSave({ ...c, price: c.price === "" || c.price == null ? null : Number(c.price) })} saveLabel={copy ? "Save" : "Add copy"} />
    </Sheet>
  );
}

const copyBadges = (c) => [
  c.signed && "✍️ Signed",
  c.sprayedEdges && "🎨 Sprayed edges",
  c.firstEdition && "🥇 First edition",
  c.dustJacket && "📕 Dust jacket",
].filter(Boolean);

// "My copies" on a physical book's screen.
export function CopiesSection({ book, getUserBooks, saveUserBooks, theme = {} }) {
  const [version, setVersion] = useState(0);
  const copies = useMemo(() => getCopies(book, getUserBooks), [book, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const [editing, setEditing] = useState(null); // copy object, or "new"
  const save = (next) => { if (saveCopies(book, next, getUserBooks, saveUserBooks)) setVersion(v => v + 1); setEditing(null); };
  const owned = copies.filter(c => c.status !== "wishlist");
  const wished = copies.filter(c => c.status === "wishlist");

  const row = (c) => (
    <button key={c.id} onClick={() => setEditing(c)}
      style={{ display: "flex", gap: 10, alignItems: "center", width: "100%", textAlign: "left", background: "rgba(255,255,255,0.5)", border: `1px solid ${P.line}`, borderRadius: 10, padding: 8, cursor: "pointer", marginBottom: 6, color: theme.text || P.ink }}>
      {c.photo ? <img src={c.photo} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6 }} /> : <span style={{ fontSize: 26, width: 44, textAlign: "center" }} aria-hidden="true">{COPY_STATUSES.find(s => s.id === c.status)?.emoji || "📚"}</span>}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: SERIF, fontWeight: 700, fontSize: 14 }}>{c.edition || c.format}{c.edition ? <span style={{ fontWeight: 400, color: P.soft }}> · {c.format}</span> : null}</span>
        <span style={{ display: "block", fontFamily: BODY, fontSize: 12, color: P.mid }}>
          {[c.status === "preordered" && "Pre-ordered", c.publisher, c.year, c.condition, c.price != null && c.price !== "" && money(c.price)].filter(Boolean).join(" · ")}
        </span>
        {copyBadges(c).length > 0 && <span style={{ display: "block", fontFamily: BODY, fontSize: 12, color: P.accent }}>{copyBadges(c).join("  ")}</span>}
      </span>
    </button>
  );

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 14, color: theme.text || P.ink }}>📚 My copies {owned.length > 0 && <span style={{ fontWeight: 400, color: P.soft }}>({owned.length})</span>}</span>
        <button onClick={() => setEditing("new")} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${theme.accent || P.accent}`, background: "transparent", color: theme.accent || P.accent, fontFamily: SERIF, fontSize: 13, cursor: "pointer" }}>+ Add copy</button>
      </div>
      {copies.length === 0 && <div style={{ fontFamily: BODY, fontSize: 12, color: P.soft }}>Track editions, signed copies, sprayed edges and what you paid, or wishlist an edition you want.</div>}
      {owned.map(row)}
      {wished.length > 0 && <div style={{ fontFamily: BODY, fontSize: 12, color: P.soft, margin: "8px 0 4px" }}>💭 Wishlist</div>}
      {wished.map(row)}
      {editing && (
        <CopySheet copy={editing === "new" ? null : editing}
          defaults={{ isbn: book.isbn || "" }}
          onClose={() => setEditing(null)}
          onDelete={(id) => save(copies.filter(c => c.id !== id))}
          onSave={(c) => save(editing === "new" ? [...copies, c] : copies.map(x => x.id === c.id ? c : x))} />
      )}
    </div>
  );
}

// Collection summary on My Story So Far.
export function CollectionPanel({ books }) {
  const copies = useMemo(() => collectCopies(books), [books]);
  const [show, setShow] = useState("owned");
  if (copies.length === 0) return null;
  const owned = copies.filter(c => c.status !== "wishlist");
  const wish = copies.filter(c => c.status === "wishlist");
  const spent = owned.reduce((a, c) => a + (Number(c.price) || 0), 0);
  const wishCost = wish.reduce((a, c) => a + (Number(c.price) || 0), 0);
  const tiles = [
    [owned.length, "copies"],
    [owned.filter(c => c.signed).length, "signed"],
    [owned.filter(c => c.sprayedEdges).length, "sprayed edges"],
    [owned.filter(c => c.format === "Special edition" || c.edition).length, "special editions"],
    [spent ? money(spent) : "—", "spent"],
    [wish.length, "on wishlist"],
  ];
  const list = show === "owned" ? owned : wish;
  return (
    <div style={{ background: P.card, border: `1px solid ${P.line}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
      <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 16, color: P.ink, margin: "0 0 10px" }}>🗝️ My collection</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: 8, marginBottom: 12 }}>
        {tiles.map(([v, l]) => (
          <div key={l} style={{ background: "rgba(255,255,255,0.55)", border: `1px solid ${P.line}`, borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
            <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: P.accent }}>{v}</div>
            <div style={{ fontFamily: BODY, fontSize: 11, color: P.soft }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <Chip active={show === "owned"} onClick={() => setShow("owned")}>Owned ({owned.length})</Chip>
        <Chip active={show === "wishlist"} onClick={() => setShow("wishlist")}>Wishlist ({wish.length}{wishCost ? ` · ${money(wishCost)}` : ""})</Chip>
      </div>
      {list.length === 0 ? <div style={{ fontFamily: BODY, fontSize: 13, color: P.soft }}>Nothing here yet.</div> : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 320, overflowY: "auto" }}>
          {list.map(c => (
            <li key={c.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0", borderTop: `1px dashed ${P.line}` }}>
              {c.photo ? <img src={c.photo} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6 }} /> : <span style={{ width: 36, textAlign: "center", fontSize: 20 }} aria-hidden="true">📚</span>}
              <span style={{ flex: 1, minWidth: 0, fontFamily: BODY, fontSize: 13 }}>
                <span style={{ display: "block", fontFamily: SERIF, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.book.title}</span>
                <span style={{ color: P.mid }}>{[c.edition || c.format, ...copyBadges(c), c.price ? money(c.price) : null].filter(Boolean).join(" · ")}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Quotes ─────────────────────────────────────────────────────────────────

const readQuotes = () => { try { return JSON.parse(localStorage.getItem("sk_quotes") || "{}") || {}; } catch { return {}; } };
const writeQuotes = (q) => {
  localStorage.setItem("sk_quotes", JSON.stringify(q));
  try { window.dispatchEvent(new CustomEvent("sk-tracking-changed", { detail: { key: "sk_quotes" } })); } catch {}
};

export function QuoteSheet({ quote, onSave, onDelete, onClose, isAudio }) {
  const [q, setQ] = useState(() => quote || { id: newId(), text: "", page: "", note: "", photo: null, date: new Date().toISOString() });
  const set = (patch) => setQ(prev => ({ ...prev, ...patch }));
  return (
    <Sheet title={quote ? "Edit quote" : "Save a quote"} onClose={onClose}>
      <Label>Quote</Label>
      <textarea autoFocus style={{ ...inputStyle, fontStyle: "italic", resize: "vertical" }} rows={4} value={q.text} onChange={e => set({ text: e.target.value })} placeholder="Type the passage you loved…" aria-label="Quote text" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
        <div><Label>{isAudio ? "Chapter" : "Page"}</Label><input style={inputStyle} inputMode="numeric" value={q.page || ""} onChange={e => set({ page: e.target.value.replace(/\D/g, "") })} aria-label={isAudio ? "Chapter" : "Page"} /></div>
        <div><Label>Your note</Label><input style={inputStyle} value={q.note || ""} onChange={e => set({ note: e.target.value })} placeholder="Why it stuck with you" aria-label="Your note" /></div>
      </div>
      {!isAudio && <><Label>Photo of the page</Label><PhotoPicker value={q.photo} onChange={v => set({ photo: v })} label="Page photo" /></>}
      <Buttons onCancel={onClose} onDelete={quote ? () => { if (window.confirm("Delete this quote?")) onDelete(q.id); } : null}
        onSave={() => onSave(q)} disabled={!q.text.trim() && !q.photo} saveLabel={quote ? "Save" : "Save quote"} />
    </Sheet>
  );
}

// Quotes on a book's screen.
export function QuotesSection({ bookKeyValue, title, author, mediaType, shareText, theme = {} }) {
  const [version, setVersion] = useState(0);
  const quotes = useMemo(() => readQuotes()[bookKeyValue] || [], [bookKeyValue, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const [editing, setEditing] = useState(null);
  const [zoom, setZoom] = useState(null);
  const save = (list) => {
    const all = readQuotes();
    if (list.length) all[bookKeyValue] = list; else delete all[bookKeyValue];
    writeQuotes(all); setVersion(v => v + 1); setEditing(null);
  };
  const share = (q) => {
    const text = `“${q.text.trim()}”\n— ${title}${author ? `, ${author}` : ""}${q.page ? ` (p. ${q.page})` : ""}`;
    shareText(text);
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 14, color: theme.text || P.ink }}>❝ Quotes {quotes.length > 0 && <span style={{ fontWeight: 400, color: P.soft }}>({quotes.length})</span>}</span>
        <button onClick={() => setEditing("new")} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${theme.accent || P.accent}`, background: "transparent", color: theme.accent || P.accent, fontFamily: SERIF, fontSize: 13, cursor: "pointer" }}>+ Add quote</button>
      </div>
      {quotes.map(q => (
        <div key={q.id} style={{ borderLeft: `3px solid ${theme.accent || P.accent}`, padding: "6px 10px", margin: "6px 0", background: "rgba(255,255,255,0.4)", borderRadius: "0 8px 8px 0" }}>
          {q.text && <div style={{ fontFamily: BODY, fontStyle: "italic", fontSize: 14, color: theme.text || P.ink, whiteSpace: "pre-wrap" }}>“{q.text}”</div>}
          {q.photo && <img src={q.photo} alt="Photo of the page" onClick={() => setZoom(q.photo)} style={{ maxWidth: 120, maxHeight: 90, objectFit: "cover", borderRadius: 6, marginTop: 6, cursor: "zoom-in" }} />}
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: BODY, fontSize: 12, color: P.soft, marginTop: 4 }}>
            <span style={{ flex: 1 }}>{[q.page && (mediaType === "audiobooks" ? `ch. ${q.page}` : `p. ${q.page}`), q.note].filter(Boolean).join(" · ")}</span>
            {q.text && <button onClick={() => share(q)} style={{ background: "none", border: "none", color: theme.accent || P.accent, cursor: "pointer", fontSize: 12 }}>Share</button>}
            <button onClick={() => setEditing(q)} style={{ background: "none", border: "none", color: theme.accent || P.accent, cursor: "pointer", fontSize: 12 }}>Edit</button>
          </div>
        </div>
      ))}
      {editing && (
        <QuoteSheet quote={editing === "new" ? null : editing} isAudio={mediaType === "audiobooks"}
          onClose={() => setEditing(null)}
          onDelete={(id) => save(quotes.filter(x => x.id !== id))}
          onSave={(q) => save(editing === "new" ? [q, ...quotes] : quotes.map(x => x.id === q.id ? q : x))} />
      )}
      {zoom && (
        <div role="dialog" aria-label="Page photo" onClick={() => setZoom(null)} style={{ position: "fixed", inset: 0, zIndex: 1300, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <img src={zoom} alt="Photo of the page" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}
