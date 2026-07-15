export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(200).end();

  let { q } = req.query;
  if (!q || q.trim().length < 2) return res.status(200).json({ items: [] });

  // Try Open Library search endpoint with a tight timeout
  const fetchWithTimeout = (url, ms) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
  };

  const docToItem = (doc) => {
    const isbn13 = (doc.isbn || []).find(i => i.length === 13) || (doc.isbn || [])[0] || "";
    const coverId = doc.cover_i;
    const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
    return {
      volumeInfo: {
        title: doc.title || "Unknown",
        authors: doc.author_name || [],
        industryIdentifiers: isbn13 ? [{ type: "ISBN_13", identifier: isbn13 }] : [],
        imageLinks: coverUrl ? { thumbnail: coverUrl } : {},
        categories: doc.subject ? [doc.subject[0]] : [],
        description: "",
      }
    };
  };

  // "Title by Author" is the natural way people type a title+author search,
  // but as one flat free-text string it ranks badly: print-on-demand
  // summary/workbook spin-offs are literally titled "Summary of <Title> by
  // <Author>", so they contain every query word (including "by" itself) and
  // can outrank — or even push entirely out of the top results — the actual
  // book, which doesn't contain the word "by" in its title at all. Splitting
  // into Open Library's separate title= and author= params is dramatically
  // more precise for this exact pattern (confirmed: returns the exact match
  // with numFoundExact:true for cases where the combined free-text query
  // didn't surface the real book in its top 25 results at all). Run this
  // alongside the regular merged search and put its results first.
  const byMatch = q.match(/^(.+?)\s+by\s+(.+)$/i);
  const structuredPromise = byMatch
    ? fetchWithTimeout(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(byMatch[1].trim())}&author=${encodeURIComponent(byMatch[2].trim())}&limit=5&fields=title,author_name,isbn,cover_i,subject`,
        6000
      ).then(r => r.ok ? r.json() : { docs: [] }).catch(() => ({ docs: [] }))
    : Promise.resolve({ docs: [] });

  // Also strip the literal " by " for the free-text fallback query below —
  // same reasoning as above, just for the path that doesn't have a clean
  // split to work with structured params.
  q = q.replace(/\s+by\s+/gi, " ").trim();

  // Query both sources in parallel and merge instead of only falling back to
  // Google Books when Open Library returns literally zero results — Open
  // Library's relevance ranking is sometimes poor for compound title+author
  // queries (returns *some* low-quality matches, e.g. summary/workbook
  // tie-ins, while missing the actual book), which was silently blocking the
  // fallback from ever running and made some real books look "missing" from
  // search.
  const openLibraryPromise = fetchWithTimeout(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=25&fields=title,author_name,isbn,cover_i,subject`,
    6000
  ).then(r => r.ok ? r.json() : { docs: [] }).catch(() => ({ docs: [] }));

  const googleBooksPromise = fetchWithTimeout(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=25&langRestrict=en`,
    6000
  ).then(r => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] }));

  const [structuredData, olData, gbData] = await Promise.all([structuredPromise, openLibraryPromise, googleBooksPromise]);

  const structuredItems = (structuredData.docs || []).map(docToItem);
  const olItems = (olData.docs || []).map(docToItem);

  const gbItems = (gbData.items || []).map(item => ({
    volumeInfo: {
      title: item.volumeInfo?.title || "Unknown",
      authors: item.volumeInfo?.authors || [],
      industryIdentifiers: item.volumeInfo?.industryIdentifiers || [],
      imageLinks: item.volumeInfo?.imageLinks || {},
      categories: item.volumeInfo?.categories || [],
      description: item.volumeInfo?.description || "",
    }
  }));

  const seenTitles = new Set(structuredItems.map(i => i.volumeInfo.title.toLowerCase().trim()));
  const restDeduped = [...olItems, ...gbItems].filter(i => {
    const t = i.volumeInfo.title.toLowerCase().trim();
    if (seenTitles.has(t)) return false;
    seenTitles.add(t);
    return true;
  });
  // Print-on-demand spin-offs (summaries, workbooks, study guides, companions)
  // for popular books flood both Open Library and Google Books, and often
  // contain every word of a "Title Author" query in their own (longer) title
  // — e.g. "Workbook for Can't Hurt Me by David Goggins" — which let them
  // outrank the actual book under plain relevance ranking. Their titles
  // reliably contain one of these telltale words, which the real book's
  // title essentially never does, so push them to the bottom rather than
  // filtering them out entirely (still useful if that's genuinely all that
  // exists for a query). structuredItems are precise title+author matches
  // from Open Library's own lookup, so they're pinned first unconditionally
  // rather than going through this sort.
  // Sort is stable (guaranteed since ES2019) — ties (same spinoff status)
  // keep each source's own relative order rather than a second heuristic
  // like title length, which doesn't actually verify relevance to the query
  // and can promote a completely unrelated short-titled result to the top.
  const SPINOFF_SIGNAL = /\b(summary|summary and analysis|workbook|study guide|companion( to)?|analysis of|book review|cliff(s)?\s?notes)\b/i;
  const rankedRest = [...restDeduped].sort((a, b) => {
    const aSpinoff = SPINOFF_SIGNAL.test(a.volumeInfo.title) ? 1 : 0;
    const bSpinoff = SPINOFF_SIGNAL.test(b.volumeInfo.title) ? 1 : 0;
    return aSpinoff - bSpinoff;
  });

  res.status(200).json({ items: [...structuredItems, ...rankedRest].slice(0, 40) });
}
