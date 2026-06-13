export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { title, author, key } = req.query;
  if (!title || !key) return res.status(400).json({ error: "Missing title or key" });

  try {
    const q = author ? `${title} ${author}` : title;
    const url = `https://api2.isbndb.com/books/${encodeURIComponent(q)}?page=1&pageSize=1&column=title`;
    const response = await fetch(url, { headers: { Authorization: key } });
    const json = await response.json();
    const book = json.books?.[0];
    const isbn = book?.isbn13 || book?.isbn || null;
    res.status(200).json({ isbn });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
