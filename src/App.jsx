import React, { useEffect, useMemo, useState } from "react";

const PARCHMENT_URL =
  "https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg";

const GENRE_COLORS = {
  Fantasy: "#2F4F3F",
  Mystery: "#3E261B",
  "Sci‑Fi": "#2A3B5F",
  Romance: "#6B2E2E",
};

const LIBRARY = {
  Fantasy: [
    {
      id: "fan-1",
      title: "The Ember Crown",
      author: "A. Lark",
      year: 2018,
      coverUrl:
        "https://miblart.com/wp-content/uploads/2022/12/82c020a1637c16ac49734987b5962d8e.jpg",
      description:
        "A fallen kingdom, a hidden heir, and a crown that must be reclaimed.",
    },
    {
      id: "fan-2",
      title: "Moonlit Oath",
      author: "K. Wren",
      year: 2021,
      description: "An ancient oath binds two rivals against a waking darkness.",
    },
    {
      id: "fan-3",
      title: "The Stone Orchard",
      author: "M. Vale",
      year: 2016,
      description: "A quiet village hides a doorway into myth—at a cost.",
    },
  ],
  Mystery: [
    {
      id: "mys-1",
      title: "Ashes on the Stair",
      author: "J. Carrow",
      year: 2014,
      description: "A locked-room case with too many witnesses and no exits.",
    },
    {
      id: "mys-2",
      title: "The Silent Ledger",
      author: "R. Quinn",
      year: 2019,
      description: "A missing ledger uncovers a city’s oldest secrets.",
    },
    {
      id: "mys-3",
      title: "A Key Without a Door",
      author: "L. Nox",
      year: 2020,
      description: "A clue appears in plain sight—if you know how to look.",
    },
  ],
  "Sci‑Fi": [
    {
      id: "sf-1",
      title: "Signal Beyond Europa",
      author: "S. Rhee",
      year: 2020,
      description: "A signal, a storm, and a truth no one is ready to hear.",
    },
    {
      id: "sf-2",
      title: "The Glass Algorithm",
      author: "D. Mercer",
      year: 2022,
      description: "An AI that predicts the future—until it stops.",
    },
    {
      id: "sf-3",
      title: "Station of Echoes",
      author: "I. Sol",
      year: 2017,
      description: "A derelict station repeats a message meant for you.",
    },
  ],
  Romance: [
    {
      id: "rom-1",
      title: "Letters in Linen",
      author: "E. Hart",
      year: 2017,
      description: "A bundle of letters changes two lives across decades.",
    },
    {
      id: "rom-2",
      title: "Cafe at Dusk",
      author: "N. Bloom",
      year: 2023,
      description: "A small cafe, a second chance, one impossible decision.",
    },
    {
      id: "rom-3",
      title: "Second Song",
      author: "P. Rowe",
      year: 2019,
      description: "When timing fails you once, do you dare again?",
    },
  ],
};

export default function App() {
  const genres = Object.keys(LIBRARY);

  const [genre, setGenre] = useState(genres[0]);
  const [query, setQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);

  // Persisted library state
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("storykeeper-favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [readingStatus, setReadingStatus] = useState(() => {
    try {
      const saved = localStorage.getItem("storykeeper-reading-status");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Filters
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [filterScope, setFilterScope] = useState("genre"); // "genre" or "all"

  useEffect(() => {
    try {
      localStorage.setItem("storykeeper-favorites", JSON.stringify(favorites));
    } catch {
      // ignore storage errors
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "storykeeper-reading-status",
        JSON.stringify(readingStatus)
      );
    } catch {
      // ignore storage errors
    }
  }, [readingStatus]);

  function toggleFavorite(bookId) {
    setFavorites((prev) =>
      prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId]
    );
  }

  function updateStatus(bookId, status) {
    setReadingStatus((prev) => ({
      ...prev,
      [bookId]: status,
    }));
  }

  function clearAllFilters() {
    setShowFavoritesOnly(false);
    setStatusFilter("All");
    setFilterScope("genre");
  }

  const activeColor = GENRE_COLORS[genre] ?? "#5A3B2E";

  const scopedBooks = useMemo(() => {
    return filterScope === "all"
      ? Object.values(LIBRARY).flat()
      : LIBRARY[genre] ?? [];
  }, [filterScope, genre]);

  const preStatusBooks = useMemo(() => {
    let list = [...scopedBooks];

    if (showFavoritesOnly) {
      list = list.filter((b) => favorites.includes(b.id));
    }

    const q = query.trim().toLowerCase();
    if (!q) return list;

    return list.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q)
    );
  }, [scopedBooks, favorites, showFavoritesOnly, query]);

  const books = useMemo(() => {
    if (statusFilter === "All") return preStatusBooks;

    return preStatusBooks.filter(
      (b) => (readingStatus[b.id] || "Want to Read") === statusFilter
    );
  }, [preStatusBooks, statusFilter, readingStatus]);

  const favoriteBooksInView = useMemo(() => {
    return scopedBooks.filter((b) => favorites.includes(b.id));
  }, [scopedBooks, favorites]);

  const statusCounts = useMemo(() => {
    const counts = {
      All: preStatusBooks.length,
      "Want to Read": 0,
      Reading: 0,
      Finished: 0,
    };

    preStatusBooks.forEach((b) => {
      const status = readingStatus[b.id] || "Want to Read";
      counts[status] += 1;
    });

    return counts;
  }, [preStatusBooks, readingStatus]);

  const favoritesCountInView = useMemo(() => {
    return preStatusBooks.filter((b) => favorites.includes(b.id)).length;
  }, [preStatusBooks, favorites]);

  function getBookGenre(bookId) {
    return (
      Object.keys(LIBRARY).find((g) =>
        LIBRARY[g].some((book) => book.id === bookId)
      ) || "Unknown"
    );
  }

  function makeCoverStyle(book) {
    if (book.coverUrl) {
      return {
        ...styles.cover,
        backgroundImage: `url("${book.coverUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    }

    const seed = (book.title.length * 23 + book.author.length * 41) % 360;
    return {
      ...styles.cover,
      backgroundImage: `
        linear-gradient(135deg, hsl(${seed} 45% 34%), ${activeColor}),
        radial-gradient(circle at 28% 18%, rgba(255,255,255,0.20), transparent 45%),
        radial-gradient(circle at 78% 72%, rgba(0,0,0,0.18), transparent 55%)
      `,
      backgroundBlendMode: "overlay",
    };
  }

  const viewingLabel = filterScope === "all" ? "Library" : genre;

  const activeFilterChips = [
    filterScope === "all"
      ? {
          key: "scope",
          label: "All Shelves",
          onRemove: () => setFilterScope("genre"),
        }
      : null,
    statusFilter !== "All"
      ? {
          key: "status",
          label: statusFilter,
          onRemove: () => setStatusFilter("All"),
        }
      : null,
    showFavoritesOnly
      ? {
          key: "favorites",
          label: "⭐ Favorites",
          onRemove: () => setShowFavoritesOnly(false),
        }
      : null,
  ].filter(Boolean);

  return (
    <div style={styles.page}>
      {/* LEFT PANEL */}
      <aside style={styles.left}>
        <h2 style={styles.leftTitle}>🌳 Library Tree</h2>
        <p style={styles.leftSub}>Pick a branch (genre).</p>

        <div style={styles.smallLine}>
          Favorites: <b>{favorites.length}</b>
        </div>

        <div style={{ marginTop: 18 }}>
          {genres.map((g, index) => {
            const isActive = g === genre;
            return (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setGenre(g);
                  setSelectedBook(null);
                }}
                style={{
                  ...styles.branchBtn,
                  background: isActive
                    ? "linear-gradient(to right, #5A3B2E, #3E261B)"
                    : "linear-gradient(to right, #E8D8B5, #D2B48C)",
                  color: isActive ? "#fff" : "#3A2A1A",
                  transform: `translateX(${index % 2 === 0 ? "10px" : "-10px"})`,
                }}
              >
                <span>🌿 {g}</span>
                <span style={styles.branchCount}>{LIBRARY[g].length}</span>
              </button>
            );
          })}
        </div>

        <div style={styles.leftFooter}>
          <div style={styles.leftHint}>Tip: Click a title to open details.</div>
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <main style={styles.right}>
        <div style={styles.contentWrapper}>
          <header style={styles.header}>
            <div style={styles.headerBrand}>
              <h1 style={styles.title}>
                <span style={styles.titleIcon}>📚</span>
                <span style={styles.titleText}>StoryKeeper</span>
                <span style={styles.titleIcon}>🎧</span>
              </h1>

              <p style={styles.subtitle}>
                <em>Read here. Listen here. Live here.</em>
              </p>
            </div>

            <div style={styles.searchBox}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search in ${genre}…`}
                style={styles.searchInput}
              />
              <button
                onClick={() => setQuery("")}
                style={styles.clearBtn}
                type="button"
              >
                Clear
              </button>
            </div>
          </header>

          <div style={styles.controlsRow}>
            <button
              type="button"
              onClick={() => setShowFavoritesOnly((prev) => !prev)}
              style={{
                ...styles.favoriteBtn,
                background: showFavoritesOnly
                  ? "rgba(210,180,140,0.65)"
                  : "rgba(255,255,255,0.65)",
              }}
            >
              <span>⭐ Favorites</span>
              <span style={styles.filterBadge}>{favoritesCountInView}</span>
            </button>

            <div style={styles.controlGroup}>
              {[
                { key: "genre", label: "Current Shelf Only" },
                { key: "all", label: "All Shelves" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setFilterScope(option.key)}
                  style={{
                    ...styles.statusBtn,
                    background:
                      filterScope === option.key
                        ? "rgba(210,180,140,0.65)"
                        : "rgba(255,255,255,0.65)",
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div style={styles.controlGroup}>
              {["All", "Want to Read", "Reading", "Finished"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  style={{
                    ...styles.statusBtn,
                    background:
                      statusFilter === status
                        ? "rgba(210,180,140,0.65)"
                        : "rgba(255,255,255,0.65)",
                  }}
                >
                  <span>{status}</span>
                  <span style={styles.filterBadge}>{statusCounts[status]}</span>
                </button>
              ))}
            </div>
          </div>

          <h2 style={styles.sectionTitle}>
            {genre} Books{" "}
            <span style={{ ...styles.dot, background: activeColor }} />
          </h2>

          <div style={styles.filterSummaryRow}>
            <span style={styles.filterSummaryLabel}>
              Viewing: <b>{viewingLabel}</b>
            </span>

            {activeFilterChips.length > 0 ? (
              <>
                <div style={styles.filterChipWrap}>
                  {activeFilterChips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={chip.onRemove}
                      style={styles.filterChip}
                      title={`Remove ${chip.label} filter`}
                    >
                      <span>{chip.label}</span>
                      <span style={styles.filterChipX}>✕</span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={clearAllFilters}
                  style={styles.clearFiltersBtn}
                >
                  Clear All
                </button>
              </>
            ) : (
              <span style={styles.filterSummaryMuted}>No extra filters</span>
            )}
          </div>

          <div style={styles.shelf} />

          {!showFavoritesOnly && favoriteBooksInView.length > 0 && (
            <FavoritesShelf
              books={favoriteBooksInView}
              onSelectBook={setSelectedBook}
              makeCoverStyle={makeCoverStyle}
            />
          )}

          {selectedBook && (
            <BookDetails
              selectedBook={selectedBook}
              onClose={() => setSelectedBook(null)}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              readingStatus={readingStatus}
              updateStatus={updateStatus}
              makeCoverStyle={makeCoverStyle}
            />
          )}

          <BookGrid
            books={books}
            favorites={favorites}
            readingStatus={readingStatus}
            genre={genre}
            filterScope={filterScope}
            getBookGenre={getBookGenre}
            onSelectBook={setSelectedBook}
            makeCoverStyle={makeCoverStyle}
          />
        </div>
      </main>
    </div>
  );
}

function FavoritesShelf({ books, onSelectBook, makeCoverStyle }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={styles.favShelfTitle}>⭐ Favorites Shelf</div>
      <div style={styles.favRow}>
        {books.map((b) => (
          <div
            key={b.id}
            style={styles.favMiniCard}
            onClick={() => onSelectBook(b)}
            role="button"
            tabIndex={0}
          >
            <div style={styles.favMiniCoverWrap}>
              <div style={makeCoverStyle(b)}>
                <div style={styles.coverGloss} />
                <div style={styles.favMiniOverlay}>
                  <div style={styles.favMiniText}>{b.title}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookDetails({
  selectedBook,
  onClose,
  favorites,
  toggleFavorite,
  readingStatus,
  updateStatus,
  makeCoverStyle,
}) {
  return (
    <div style={styles.detailPanel}>
      <div style={styles.detailHeader}>
        <div>
          <div style={styles.detailTitle}>{selectedBook.title}</div>
          <div style={styles.detailSub}>
            {selectedBook.author} • {selectedBook.year}
          </div>
        </div>

        <button style={styles.detailClose} onClick={onClose} type="button">
          ✕
        </button>
      </div>

      <div style={styles.detailBody}>
        <div style={styles.detailCoverWrap}>
          <div style={makeCoverStyle(selectedBook)}>
            <div style={styles.coverGloss} />
          </div>
        </div>

        <div style={styles.detailText}>
          <div style={styles.detailLabel}>Description</div>
          <div style={styles.detailNotes}>
            {selectedBook.description || "No description yet."}
          </div>

          <button
            onClick={() => toggleFavorite(selectedBook.id)}
            style={styles.favoriteBtn}
            type="button"
          >
            {favorites.includes(selectedBook.id)
              ? "⭐ Remove Favorite"
              : "☆ Add to Favorites"}
          </button>

          <div style={{ marginTop: 12 }}>
            <div style={styles.detailLabel}>Reading Status</div>

            <div style={styles.statusRow}>
              {["Want to Read", "Reading", "Finished"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => updateStatus(selectedBook.id, status)}
                  style={{
                    ...styles.statusBtn,
                    background:
                      readingStatus[selectedBook.id] === status
                        ? "rgba(210,180,140,0.55)"
                        : "rgba(255,255,255,0.65)",
                  }}
                >
                  {status}
                </button>
              ))}
            </div>

            <div style={styles.smallLine}>
              Current: <b>{readingStatus[selectedBook.id] || "—"}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookGrid({
  books,
  favorites,
  readingStatus,
  genre,
  filterScope,
  getBookGenre,
  onSelectBook,
  makeCoverStyle,
}) {
  if (books.length === 0) {
    return <div style={styles.empty}>No matches. Try another search.</div>;
  }

  return (
    <div style={styles.grid}>
      {books.map((b) => (
        <div
          key={b.id}
          style={{
            ...styles.card,
            outline: favorites.includes(b.id)
              ? "2px solid rgba(201,165,90,0.65)"
              : "none",
          }}
          onClick={() => onSelectBook(b)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-8px) scale(1.03)";
            e.currentTarget.style.boxShadow =
              "0 18px 40px rgba(0,0,0,0.22)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow =
              "0 10px 26px rgba(0,0,0,0.10)";
          }}
          role="button"
          tabIndex={0}
        >
          <div style={styles.coverWrap}>
            <div style={makeCoverStyle(b)}>
              <div style={styles.coverGloss} />
              <div style={styles.coverOverlay}>
                <div style={styles.coverTitle}>
                  {favorites.includes(b.id) ? "⭐ " : ""}
                  {b.title}
                </div>
                <div style={styles.coverAuthor}>{b.author}</div>
              </div>
            </div>
          </div>

          <div style={styles.metaRow}>
            <span style={styles.chip}>{b.year}</span>
            <span style={styles.chip}>
              {filterScope === "all" ? getBookGenre(b.id) : genre}
            </span>
            <span style={styles.chip}>
              {readingStatus[b.id] || "Want to Read"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    fontFamily: "Georgia, serif",
    backgroundColor: "#F4E9D8",
    backgroundImage: `
      url("${PARCHMENT_URL}"),
      radial-gradient(circle at 50% 0%, rgba(255,220,150,0.18), transparent 60%),
      radial-gradient(circle at 50% 50%, transparent 55%, rgba(60,35,15,0.18) 100%)
    `,
    backgroundSize: "cover, cover, cover",
    backgroundRepeat: "no-repeat, no-repeat, no-repeat",
    backgroundPosition: "center, center, center",
    backgroundBlendMode: "multiply",
  },

  left: {
    width: 320,
    padding: 20,
    borderRight: "2px solid rgba(210,180,140,0.55)",
    background: "rgba(255,255,255,0.30)",
    backdropFilter: "blur(4px)",
  },
  leftTitle: { marginTop: 0, marginBottom: 6, color: "#3A2A1A" },
  leftSub: { marginTop: 0, color: "rgba(75,58,42,0.9)" },
  leftFooter: { marginTop: 18 },
  leftHint: { fontSize: 12, color: "rgba(75,58,42,0.85)" },
  smallLine: { marginTop: 10, fontSize: 13, color: "rgba(75,58,42,0.9)" },

  branchBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    width: "100%",
    marginTop: 14,
    padding: "14px 14px",
    borderRadius: 22,
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    boxShadow: "2px 4px 10px rgba(0,0,0,0.18)",
  },
  branchCount: {
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid rgba(75,58,42,0.22)",
    background: "rgba(255,255,255,0.55)",
    color: "rgba(75,58,42,0.9)",
  },

  right: {
    flex: 1,
    padding: 30,
    display: "flex",
    justifyContent: "center",
    background: "rgba(255,255,255,0.18)",
    backdropFilter: "blur(3px)",
  },

  contentWrapper: {
    width: "100%",
    maxWidth: 1200,
  },

  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },

  headerBrand: {
    width: "100%",
    textAlign: "center",
  },

  title: {
    marginTop: 0,
    marginBottom: 6,
    color: "#3A2A1A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  titleIcon: {
    fontSize: 20,
  },

  titleText: {
    fontWeight: 700,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    letterSpacing: 0.5,
    color: "rgba(75,58,42,0.85)",
    textAlign: "center",
  },

  searchBox: {
    display: "flex",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(75,58,42,0.20)",
    background: "rgba(255,255,255,0.40)",
    justifyContent: "center",
  },

  searchInput: {
    width: 240,
    maxWidth: "60vw",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(75,58,42,0.22)",
    background: "rgba(244,233,216,0.70)",
    outline: "none",
    fontSize: 14,
  },

  clearBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(75,58,42,0.22)",
    background: "rgba(255,255,255,0.65)",
    cursor: "pointer",
  },

  controlsRow: {
    marginTop: 18,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
  },

  controlGroup: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },

  sectionTitle: {
    marginTop: 18,
    color: "#3A2A1A",
    display: "flex",
    gap: 10,
    alignItems: "center",
  },

  filterSummaryRow: {
    marginTop: 6,
    marginBottom: 8,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },

  filterSummaryLabel: {
    fontSize: 13,
    color: "rgba(75,58,42,0.85)",
  },

  filterSummaryMuted: {
    fontSize: 12,
    color: "rgba(75,58,42,0.70)",
  },

  filterChipWrap: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },

  filterChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid rgba(120,90,50,0.35)",
    background: "linear-gradient(to bottom, #F5E6C8, #E6CFA3)",
    color: "#3A2A1A",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  },

  filterChipX: {
    fontSize: 12,
    opacity: 0.8,
  },

  clearFiltersBtn: {
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid rgba(75,58,42,0.25)",
    background: "rgba(255,255,255,0.65)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    display: "inline-block",
  },

  shelf: {
    height: 10,
    marginTop: 12,
    borderRadius: 6,
    background: "linear-gradient(to bottom, #6B4C3B, #4A2E1F)",
    boxShadow: "0 10px 18px rgba(0,0,0,0.20)",
  },

  favShelfTitle: {
    marginBottom: 8,
    fontWeight: 800,
    color: "rgba(75,58,42,0.95)",
  },

  favRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 12,
  },

  favMiniCard: { cursor: "pointer" },

  favMiniCoverWrap: {
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid rgba(75,58,42,0.18)",
    boxShadow: "0 8px 16px rgba(0,0,0,0.14)",
  },

  favMiniOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "flex-end",
    padding: 10,
    background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent 70%)",
    pointerEvents: "none",
  },

  favMiniText: {
    color: "rgba(255,255,255,0.95)",
    fontWeight: 800,
    fontSize: 12,
    lineHeight: 1.2,
    textShadow: "0 2px 10px rgba(0,0,0,0.55)",
  },

  grid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 16,
  },

  card: {
    borderRadius: 16,
    border: "1px solid rgba(75,58,42,0.16)",
    background: "rgba(255,255,255,0.30)",
    boxShadow: "0 10px 26px rgba(0,0,0,0.10)",
    padding: 12,
    transition: "transform 0.18s ease, box-shadow 0.18s ease",
    transform: "translateY(0) scale(1)",
    cursor: "pointer",
    userSelect: "none",
  },

  coverWrap: {
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(75,58,42,0.18)",
    boxShadow: "0 10px 22px rgba(0,0,0,0.18)",
  },

  cover: {
    height: 260,
    borderRadius: 16,
    position: "relative",
    overflow: "hidden",
  },

  coverGloss: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "42%",
    background: "linear-gradient(to bottom, rgba(255,255,255,0.20), transparent)",
    pointerEvents: "none",
  },

  coverOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: 12,
    background: "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.0) 60%)",
  },

  coverTitle: {
    color: "rgba(255,255,255,0.96)",
    fontWeight: 800,
    fontSize: 15,
    lineHeight: 1.2,
    textShadow: "0 2px 10px rgba(0,0,0,0.55)",
  },

  coverAuthor: {
    marginTop: 4,
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    textShadow: "0 2px 10px rgba(0,0,0,0.55)",
  },

  metaRow: {
    marginTop: 10,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  chip: {
    fontSize: 12,
    color: "rgba(75,58,42,0.9)",
    border: "1px solid rgba(75,58,42,0.18)",
    padding: "4px 8px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.40)",
  },

  empty: {
    marginTop: 16,
    color: "rgba(75,58,42,0.85)",
  },

  detailPanel: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    border: "1px solid rgba(75,58,42,0.18)",
    background: "rgba(255,255,255,0.55)",
    boxShadow: "0 14px 34px rgba(0,0,0,0.18)",
  },

  detailHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  detailTitle: {
    fontWeight: 800,
    color: "#3A2A1A",
    fontSize: 18,
    lineHeight: 1.2,
  },

  detailSub: {
    marginTop: 6,
    color: "rgba(75,58,42,0.9)",
    fontSize: 13,
  },

  detailClose: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "1px solid rgba(75,58,42,0.22)",
    background: "rgba(255,255,255,0.7)",
    cursor: "pointer",
  },

  detailBody: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "160px 1fr",
    gap: 14,
    alignItems: "start",
  },

  detailCoverWrap: {
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid rgba(75,58,42,0.18)",
    boxShadow: "0 10px 22px rgba(0,0,0,0.15)",
  },

  detailText: {
    color: "rgba(75,58,42,0.95)",
  },

  detailLabel: {
    fontWeight: 700,
    marginBottom: 8,
    color: "#3A2A1A",
  },

  detailNotes: {
    fontSize: 13,
    lineHeight: 1.5,
  },

  favoriteBtn: {
    marginTop: 12,
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
    border: "1px solid rgba(75,58,42,0.22)",
    background: "rgba(255,255,255,0.65)",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },

  statusRow: {
    marginTop: 8,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  statusBtn: {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid rgba(75,58,42,0.22)",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },

  filterBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 18,
    height: 18,
    padding: "0 6px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    background: "rgba(75,58,42,0.12)",
    color: "#3A2A1A",
  },
};