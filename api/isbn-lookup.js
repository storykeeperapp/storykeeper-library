export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { title, author, key } = req.query;
  if (!title || !key) return res.status(400).json({ error: "Missing title or key" });

  try {
    // Search by title only — combining title+author breaks ISBNdb matching
    const url = `https://api2.isbndb.com/books/${encodeURIComponent(title)}?page=1&pageSize=5`;
    const response = await fetch(url, { headers: { Authorization: key } });
    const json = await response.json();
    const books = json.books || [];

    // If author provided, prefer a book whose author matches
    let match = null;
    if (author && books.length > 1) {
      const normAuthor = author.toLowerCase();
      match = books.find(b =>
        (b.authors || []).some(a => a.toLowerCase().includes(normAuthor.split(" ").pop()))
      );
    }
    if (!match) match = books[0];

    const isbn = match?.isbn13 || match?.isbn || null;
    res.status(200).json({ isbn });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
