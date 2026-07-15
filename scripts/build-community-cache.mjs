/**
 * StoryKeeper — Community Cache Builder
 * Run: node scripts/build-community-cache.mjs
 *
 * Pulls all user libraries from Supabase, extracts unique books,
 * fetches missing descriptions + covers, and writes to community cache.
 */

import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://elmoftpybhfxqzkrhkwe.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // use service role key
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";
const CONCURRENCY = 5;
const FETCH_TIMEOUT_MS = 4000;
const SKIP_GENRES = new Set([
  "Cookbooks", "Crafting", "Self Help", "Gardening & Landscaping",
  "Gardening", "Landscaping", "Health & Wellness", "Health & Fitness",
  "Health", "Wellness", "DIY", "Home & DIY", "Sewing & Crafts",
]);

if (!SUPABASE_SERVICE_KEY) {
  console.error("❌ Set SUPABASE_SERVICE_KEY env var before running.");
  console.error("   export SUPABASE_SERVICE_KEY=your_service_role_key");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const fetchWithTimeout = async (url, ms = FETCH_TIMEOUT_MS) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    return r;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
};

const cleanTitle = (t) => t.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
const normalizeAuthor = (a) => {
  const parts = a.split(",").map(s => s.trim());
  return parts.length >= 2 ? `${parts[1]} ${parts[0]}` : a;
};

// ── Step 1: Load all user libraries ──────────────────────────────────────────
async function loadAllBooks() {
  console.log("📚 Loading all user libraries from Supabase…");
  const allBooks = new Map(); // isbn → book (or title key → book for no-isbn)
  let page = 0;
  const PAGE = 100;

  while (true) {
    const { data, error } = await sb
      .from("user_libraries")
      .select("data")
      .range(page * PAGE, (page + 1) * PAGE - 1);

    if (error) { console.error("Supabase error:", error.message); break; }
    if (!data?.length) break;

    for (const row of data) {
      const books = row.data?.sk_user_books;
      if (!Array.isArray(books)) continue;
      for (const b of books) {
        if (!b.title) continue;
        if (SKIP_GENRES.has(b.genre)) continue;
        const key = b.isbn || `title:${b.title.toLowerCase().trim()}`;
        if (!allBooks.has(key)) allBooks.set(key, b);
      }
    }

    console.log(`  Page ${page + 1}: ${data.length} libraries, ${allBooks.size} unique books so far`);
    if (data.length < PAGE) break;
    page++;
  }

  console.log(`✅ Found ${allBooks.size} unique books across all users\n`);
  return [...allBooks.values()];
}

// ── Step 2: Load existing community cache ────────────────────────────────────
async function loadExistingCache() {
  console.log("🗄  Loading existing community cache…");
  const descByIsbn = new Map();
  const coverByIsbn = new Map();
  let from = 0;
  const PAGE = 1000;

  while (true) {
    const { data } = await sb.from("community_descriptions").select("isbn,title").range(from, from + PAGE - 1);
    if (!data?.length) break;
    data.forEach(r => { if (r.isbn) descByIsbn.set(r.isbn, true); });
    if (data.length < PAGE) break;
    from += PAGE;
  }

  from = 0;
  while (true) {
    const { data } = await sb.from("community_covers").select("isbn").range(from, from + PAGE - 1);
    if (!data?.length) break;
    data.forEach(r => { if (r.isbn) coverByIsbn.set(r.isbn, true); });
    if (data.length < PAGE) break;
    from += PAGE;
  }

  console.log(`✅ Cache has ${descByIsbn.size} descriptions, ${coverByIsbn.size} covers\n`);
  return { descByIsbn, coverByIsbn };
}

// ── Step 3: Fetch description for one book ────────────────────────────────────
async function fetchDescription(book) {
  const cleaned = cleanTitle(book.title || "");
  const normAuthor = normalizeAuthor(book.author || "");
  let desc = "";

  // OpenLibrary by ISBN
  if (!desc && book.isbn) {
    try {
      const res = await fetchWithTimeout(`https://openlibrary.org/isbn/${book.isbn}.json`);
      if (res.ok) {
        const ed = await res.json();
        const d = ed.description?.value || ed.description || "";
        if (d && d.length > 20) desc = d;
        if (!desc && ed.works?.[0]?.key) {
          try {
            const wr = await fetchWithTimeout(`https://openlibrary.org${ed.works[0].key}.json`);
            const wj = await wr.json();
            const wd = wj.description?.value || wj.description || wj.first_sentence?.value || "";
            if (wd && wd.length > 20) desc = wd;
          } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }
  }

  // OpenLibrary search fallback
  if (!desc && cleaned) {
    try {
      const q = normAuthor
        ? `title=${encodeURIComponent(cleaned)}&author=${encodeURIComponent(normAuthor)}`
        : `title=${encodeURIComponent(cleaned)}`;
      const res = await fetchWithTimeout(`https://openlibrary.org/search.json?${q}&limit=1&fields=key`);
      const doc = (await res.json()).docs?.[0];
      if (doc?.key) {
        const wr = await fetchWithTimeout(`https://openlibrary.org${doc.key}.json`);
        const wj = await wr.json();
        const wd = wj.description?.value || wj.description || wj.first_sentence?.value || "";
        if (wd && wd.length > 20) desc = wd;
      }
    } catch { /* ignore */ }
  }

  // Google Books last
  if (!desc && cleaned) {
    try {
      const gq = normAuthor
        ? `intitle:${encodeURIComponent(cleaned)}+inauthor:${encodeURIComponent(normAuthor)}`
        : `intitle:${encodeURIComponent(cleaned)}`;
      const url = `https://www.googleapis.com/books/v1/volumes?q=${gq}&maxResults=1&langRestrict=en${GOOGLE_API_KEY ? `&key=${GOOGLE_API_KEY}` : ""}`;
      const res = await fetchWithTimeout(url);
      const json = await res.json();
      if (!json.error) {
        const vol = json.items?.[0]?.volumeInfo;
        if (vol?.description) desc = vol.description;
      }
    } catch { /* ignore */ }
  }

  return desc ? desc.trim() : null;
}

// ── Step 4: Fetch cover for one book ─────────────────────────────────────────
async function fetchCover(book) {
  if (!book.isbn) return null;
  const url = `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;
  try {
    const res = await fetchWithTimeout(url, 3000);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("image")) return null;
    // Read body to check actual size — OL returns a tiny 1px gif when no cover exists
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 2000) return url;
  } catch { /* ignore */ }
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 StoryKeeper Community Cache Builder\n");

  const books = await loadAllBooks();
  const { descByIsbn, coverByIsbn } = await loadExistingCache();

  const needsDesc = books.filter(b => b.isbn && !descByIsbn.has(b.isbn));
  const needsCover = books.filter(b => b.isbn && !coverByIsbn.has(b.isbn));

  console.log(`📝 ${needsDesc.length} books need descriptions`);
  console.log(`🖼  ${needsCover.length} books need covers\n`);

  // ── Fetch descriptions ──
  let descFetched = 0, descFailed = 0;
  console.log("── Fetching descriptions ──────────────────────────────");
  for (let i = 0; i < needsDesc.length; i += CONCURRENCY) {
    const batch = needsDesc.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (book) => {
      const desc = await fetchDescription(book);
      if (desc) {
        const cleaned = cleanTitle(book.title || "");
        const normAuthor = normalizeAuthor(book.author || "");
        try {
          await sb.from("community_descriptions").upsert({
            isbn: book.isbn,
            title: cleaned,
            author: normAuthor,
            description: desc,
          });
          descFetched++;
        } catch (e) { descFailed++; }
      } else {
        descFailed++;
      }
    }));
    const pct = Math.round(((i + batch.length) / needsDesc.length) * 100);
    process.stdout.write(`\r  ${i + batch.length}/${needsDesc.length} (${pct}%) — ✅ ${descFetched} found, ⏭ ${descFailed} skipped`);
    await sleep(50); // gentle rate limit
  }
  console.log("\n");

  // ── Fetch covers ──
  let coverFetched = 0, coverFailed = 0;
  console.log("── Fetching covers ────────────────────────────────────");
  for (let i = 0; i < needsCover.length; i += CONCURRENCY) {
    const batch = needsCover.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (book) => {
      const coverUrl = await fetchCover(book);
      if (coverUrl) {
        try {
          await sb.from("community_covers").upsert({ isbn: book.isbn, cover_url: coverUrl });
          coverFetched++;
        } catch { coverFailed++; }
      } else {
        coverFailed++;
      }
    }));
    const pct = Math.round(((i + batch.length) / needsCover.length) * 100);
    process.stdout.write(`\r  ${i + batch.length}/${needsCover.length} (${pct}%) — ✅ ${coverFetched} found, ⏭ ${coverFailed} skipped`);
    await sleep(50);
  }
  console.log("\n");

  console.log("🎉 Done!");
  console.log(`   Descriptions: ${descFetched} added`);
  console.log(`   Covers:       ${coverFetched} added`);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
