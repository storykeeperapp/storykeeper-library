import { useState } from "react";

const ALL_GENRES = ["Fantasy", "Mystery", "Sci-Fi", "Romance", "Thriller", "Self Help", "Dark Romance"];

const DEFAULT_ASSIGNMENTS = [
  { id: 1, left: "32%", top: "9%",  genre: "Fantasy"      },
  { id: 2, left: "75%", top: "8%",  genre: "Mystery"      },
  { id: 3, left: "8%",  top: "28%", genre: "Sci-Fi"       },
  { id: 4, left: "78%", top: "38%", genre: "Romance"      },
  { id: 5, left: "6%",  top: "52%", genre: "Thriller"     },
  { id: 6, left: "76%", top: "58%", genre: "Self Help"    },
  { id: 7, left: "76%", top: "76%", genre: "Dark Romance" },
];

const library = {
  Fantasy: [
    { title: "The Hobbit",           author: "J.R.R. Tolkien",        type: "ebooks",      isbn: "9780547928227" },
    { title: "Mistborn",             author: "Brandon Sanderson",      type: "audiobooks",  isbn: "9780765311788" },
    { title: "The Name of the Wind", author: "Patrick Rothfuss",       type: "ebooks",      isbn: "9780756404741" },
    { title: "A Wizard of Earthsea", author: "Ursula K. Le Guin",      type: "ebooks",      isbn: "9780547773742" },
    { title: "The Way of Kings",     author: "Brandon Sanderson",      type: "audiobooks",  isbn: "9780765326355" },
    { title: "Eragon",               author: "Christopher Paolini",    type: "ebooks",      isbn: "9780375826696" },
  ],
  Mystery: [
    { title: "Sherlock Holmes",       author: "Arthur Conan Doyle",   type: "ebooks",      isbn: "9780743273565" },
    { title: "Gone Girl",             author: "Gillian Flynn",         type: "audiobooks",  isbn: "9780307588371" },
    { title: "The Girl on the Train", author: "Paula Hawkins",         type: "ebooks",      isbn: "9781594634024" },
    { title: "Big Little Lies",       author: "Liane Moriarty",        type: "audiobooks",  isbn: "9780399167065" },
    { title: "In the Woods",          author: "Tana French",           type: "ebooks",      isbn: "9780143113492" },
    { title: "The Silent Patient",    author: "Alex Michaelides",      type: "ebooks",      isbn: "9781250301697" },
  ],
  "Sci-Fi": [
    { title: "Dune",              author: "Frank Herbert",        type: "ebooks",      isbn: "9780441013593" },
    { title: "Neuromancer",       author: "William Gibson",       type: "audiobooks",  isbn: "9780441569595" },
    { title: "The Martian",       author: "Andy Weir",            type: "ebooks",      isbn: "9780553418026" },
    { title: "Ender's Game",      author: "Orson Scott Card",     type: "audiobooks",  isbn: "9780812550702" },
    { title: "Foundation",        author: "Isaac Asimov",         type: "ebooks",      isbn: "9780553293357" },
    { title: "Project Hail Mary", author: "Andy Weir",            type: "ebooks",      isbn: "9780593135204" },
  ],
  Romance: [
    { title: "Pride and Prejudice", author: "Jane Austen",        type: "ebooks",      isbn: "9780141439518" },
    { title: "Outlander",           author: "Diana Gabaldon",     type: "audiobooks",  isbn: "9780440212560" },
    { title: "The Notebook",        author: "Nicholas Sparks",    type: "ebooks",      isbn: "9780446676090" },
    { title: "Me Before You",       author: "Jojo Moyes",         type: "audiobooks",  isbn: "9780143124542" },
    { title: "It Ends with Us",     author: "Colleen Hoover",     type: "ebooks",      isbn: "9781501110368" },
    { title: "The Hating Game",     author: "Sally Thorne",       type: "ebooks",      isbn: "9780062439598" },
  ],
  Thriller: [
    { title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson",      type: "ebooks",      isbn: "9780307454546" },
    { title: "No Country for Old Men",          author: "Cormac McCarthy",    type: "audiobooks",  isbn: "9780307387899" },
    { title: "The Da Vinci Code",               author: "Dan Brown",          type: "ebooks",      isbn: "9780307474278" },
    { title: "Gone Girl",                       author: "Gillian Flynn",      type: "audiobooks",  isbn: "9780307588371" },
    { title: "I Am Pilgrim",                    author: "Terry Hayes",        type: "ebooks",      isbn: "9781476717494" },
    { title: "The Firm",                        author: "John Grisham",       type: "ebooks",      isbn: "9780385319058" },
  ],
  "Self Help": [
    { title: "Atomic Habits",      author: "James Clear",        type: "ebooks",      isbn: "9780735211292" },
    { title: "The Power of Now",   author: "Eckhart Tolle",      type: "audiobooks",  isbn: "9781577314806" },
    { title: "Think and Grow Rich",author: "Napoleon Hill",      type: "ebooks",      isbn: "9781585424337" },
    { title: "The 7 Habits",       author: "Stephen Covey",      type: "audiobooks",  isbn: "9781982137274" },
    { title: "Untamed",            author: "Glennon Doyle",      type: "ebooks",      isbn: "9781984801258" },
    { title: "You Are a Badass",   author: "Jen Sincero",        type: "ebooks",      isbn: "9780762447695" },
  ],
  "Dark Romance": [
    { title: "Haunting Adeline",    author: "H.D. Carlton",       type: "ebooks",      isbn: "9781957635026" },
    { title: "Corrupt",             author: "Penelope Douglas",   type: "audiobooks",  isbn: "9781682305546" },
    { title: "Twisted Love",        author: "Ana Huang",          type: "ebooks",      isbn: "9781728269382" },
    { title: "Credence",            author: "Penelope Douglas",   type: "audiobooks",  isbn: "9781682308004" },
    { title: "Terms and Conditions",author: "Lauren Asher",       type: "ebooks",      isbn: "9781728249919" },
    { title: "Vicious",             author: "L.J. Shen",          type: "ebooks",      isbn: "9781250107466" },
  ],
};


const SPINE_COLORS = [
  { bg: ["#6b1a1a", "#8B2020", "#5a1515"], text: "#f5e6c8" },
  { bg: ["#1a3a6b", "#1e4d8c", "#152d52"], text: "#f0e8d0" },
  { bg: ["#1a4a2a", "#22603a", "#153820"], text: "#f5e6c8" },
  { bg: ["#4a2a0a", "#6b3f10", "#3a2008"], text: "#ffeeba" },
  { bg: ["#3a1a5a", "#52247a", "#2a1242"], text: "#f0deff" },
  { bg: ["#1a4a4a", "#206060", "#123838"], text: "#d0f5f5" },
  { bg: ["#5a3010", "#7a4418", "#42220c"], text: "#ffeeba" },
  { bg: ["#2a1a4a", "#3a2464", "#1e1236"], text: "#e8d8ff" },
];

function BookSpine({ book, index, rowIndex }) {
  const colorSet = SPINE_COLORS[(rowIndex * 6 + index) % SPINE_COLORS.length];
  const height = 155 + ((rowIndex * 6 + index) % 4) * 18;

  return (
    <div
      title={`${book.title} — ${book.author}`}
      style={{
        width: 48,
        height,
        borderRadius: "2px 3px 3px 2px",
        background: `linear-gradient(to right, ${colorSet.bg[0]} 0%, ${colorSet.bg[1]} 35%, ${colorSet.bg[1]} 65%, ${colorSet.bg[2]} 100%)`,
        boxShadow: "4px 0 10px rgba(0,0,0,0.6), -1px 0 4px rgba(0,0,0,0.3), inset 4px 0 8px rgba(255,255,255,0.07)",
        position: "relative",
        cursor: "default",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
      }}
    >
      {/* Top decorative gold line */}
      <div style={{ width: "55%", height: 1.5, background: "rgba(255,215,0,0.55)", borderRadius: 1, flexShrink: 0 }} />

      {/* Title */}
      <div style={{
        writingMode: "vertical-rl",
        transform: "rotate(180deg)",
        color: colorSet.text,
        fontFamily: '"Palatino Linotype", Palatino, serif',
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: "0.8px",
        textAlign: "center",
        textShadow: "0 1px 4px rgba(0,0,0,0.7)",
        lineHeight: 1.3,
        flex: 1,
        overflow: "hidden",
        maxHeight: "55%",
        padding: "4px 0",
      }}>
        {book.title}
      </div>

      {/* Middle gold divider */}
      <div style={{ width: "45%", height: 1, background: "rgba(255,215,0,0.35)", borderRadius: 1, flexShrink: 0 }} />

      {/* Author */}
      <div style={{
        writingMode: "vertical-rl",
        transform: "rotate(180deg)",
        color: `${colorSet.text}bb`,
        fontFamily: '"Palatino Linotype", Palatino, serif',
        fontStyle: "italic",
        fontSize: 9,
        letterSpacing: "0.5px",
        textShadow: "0 1px 3px rgba(0,0,0,0.6)",
        overflow: "hidden",
        maxHeight: "28%",
        flexShrink: 0,
      }}>
        {book.author}
      </div>

      {/* Bottom gold line */}
      <div style={{ width: "55%", height: 1.5, background: "rgba(255,215,0,0.55)", borderRadius: 1, flexShrink: 0 }} />

      {/* Left edge highlight (spine binding) */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, bottom: 0,
        width: 4,
        background: "linear-gradient(to right, rgba(255,255,255,0.12), transparent)",
        borderRadius: "2px 0 0 2px",
        pointerEvents: "none",
      }} />

      {/* Right shadow edge */}
      <div style={{
        position: "absolute",
        top: 0, right: 0, bottom: 0,
        width: 5,
        background: "linear-gradient(to left, rgba(0,0,0,0.35), transparent)",
        pointerEvents: "none",
      }} />
    </div>
  );
}

// Patterns for each shelf row: "b"=book, "p0/p1/p2"=plant type, "n0/n1/n2/n3"=nook type
const SHELF_PATTERNS = [
  ["b","b","p0","b","b","n0","b","p1","b"],
  ["p2","b","b","n1","b","b","p0","b","b"],
  ["b","p1","b","b","n2","b","p2","b","b"],
  ["b","b","n3","b","p0","b","b","p2","b"],
];

const PLANTS = [
  /* 0 — trailing ivy with long hanging vines */
  () => (
    <svg width="36" height="220" viewBox="0 0 36 220" style={{ flexShrink: 0, alignSelf: "flex-end", overflow: "visible" }}>
      <path d="M 8 102 Q 7 115 9 118 L 27 118 Q 29 115 28 102 Z" fill="#c1440e" />
      <rect x="6" y="99" width="24" height="5" rx="2" fill="#d4521a" />
      <ellipse cx="18" cy="101" rx="11" ry="3" fill="#2a1408" />
      <ellipse cx="18" cy="100" rx="9" ry="2.5" fill="#3a1e0a" />
      <path d="M 18 99 Q 16 80 18 60 Q 20 40 17 20" stroke="#4a7a1e" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 18 99 Q 22 78 20 55 Q 18 35 22 15" stroke="#3a6a14" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 17 80 Q 4 74 2 84"   stroke="#2d6010" strokeWidth="1" fill="#4a9020" fillOpacity="0.92" />
      <path d="M 18 68 Q 6 60 3 70"   stroke="#2d6010" strokeWidth="1" fill="#3a8018" fillOpacity="0.92" />
      <path d="M 18 55 Q 7 46 4 56"   stroke="#2d6010" strokeWidth="1" fill="#4a9020" fillOpacity="0.9"  />
      <path d="M 20 75 Q 30 67 33 76" stroke="#2d6010" strokeWidth="1" fill="#3a8818" fillOpacity="0.92" />
      <path d="M 19 60 Q 29 52 32 61" stroke="#2d6010" strokeWidth="1" fill="#4a9020" fillOpacity="0.9"  />
      <path d="M 17 40 Q 6 32 3 42"   stroke="#2d6010" strokeWidth="1" fill="#3a8018" fillOpacity="0.9"  />
      <path d="M 22 35 Q 30 26 33 35" stroke="#2d6010" strokeWidth="1" fill="#4a9020" fillOpacity="0.9"  />
      <ellipse cx="17" cy="17" rx="7" ry="9" fill="#2e7a10" opacity="0.92" />
      <ellipse cx="11" cy="12" rx="5" ry="7" fill="#3a8a18" opacity="0.88" />
      <ellipse cx="23" cy="12" rx="5" ry="7" fill="#4a9a22" opacity="0.88" />
      <path d="M 12 118 Q 8 138 10 158 Q 12 178 8 200 Q 6 210 8 220"  stroke="#3a7018" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 22 118 Q 26 140 24 162 Q 22 182 26 202 Q 28 212 26 220" stroke="#2d6010" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 17 118 Q 15 142 17 165 Q 19 188 16 210"               stroke="#3a7018" strokeWidth="1"   fill="none" strokeLinecap="round" />
      <path d="M 10 148 Q 1 144 0 152"  stroke="#2d6010" strokeWidth="1" fill="#4a8e20" fillOpacity="0.88" />
      <path d="M 9  170 Q 0 166 0 175"  stroke="#2d6010" strokeWidth="1" fill="#3a8018" fillOpacity="0.88" />
      <path d="M 9  195 Q 1 190 1 199"  stroke="#2d6010" strokeWidth="1" fill="#4a9020" fillOpacity="0.85" />
      <path d="M 24 152 Q 33 147 34 156" stroke="#2d6010" strokeWidth="1" fill="#3a8818" fillOpacity="0.88" />
      <path d="M 25 174 Q 34 169 35 178" stroke="#2d6010" strokeWidth="1" fill="#4a8e20" fillOpacity="0.88" />
      <path d="M 25 198 Q 33 193 34 202" stroke="#2d6010" strokeWidth="1" fill="#3a8018" fillOpacity="0.85" />
      <path d="M 17 158 Q 9 153 8 162"  stroke="#2d6010" strokeWidth="1" fill="#4a9020" fillOpacity="0.85" />
      <path d="M 16 185 Q 8 180 7 189"  stroke="#2d6010" strokeWidth="1" fill="#3a8018" fillOpacity="0.85" />
    </svg>
  ),

  /* 1 — pothos in ceramic pot with cascading vines */
  () => (
    <svg width="36" height="210" viewBox="0 0 36 210" style={{ flexShrink: 0, alignSelf: "flex-end", overflow: "visible" }}>
      <path d="M 7 100 Q 6 113 8 116 L 28 116 Q 30 113 29 100 Z" fill="#7a8a9a" />
      <rect x="5" y="97" width="26" height="5" rx="2" fill="#9aaaba" />
      <ellipse cx="18" cy="99" rx="12" ry="3" fill="#2a1a08" />
      <ellipse cx="18" cy="98" rx="10" ry="2.5" fill="#3a2a10" />
      <path d="M 18 97 Q 14 75 16 50 Q 18 28 15 10" stroke="#5a8a1e" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 18 97 Q 22 73 20 48 Q 18 28 22 8"  stroke="#4a7a14" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 16 78 Q 2 70 1 82 Q 2 90 10 86 Q 16 88 16 78"  stroke="#2a5a0a" strokeWidth="1" fill="#4a8a18" fillOpacity="0.9" />
      <path d="M 18 62 Q 5 54 4 66 Q 5 74 12 70 Q 18 72 18 62"  stroke="#2a5a0a" strokeWidth="1" fill="#3a7a12" fillOpacity="0.9" />
      <path d="M 20 72 Q 32 64 33 76 Q 32 84 25 80 Q 20 82 20 72" stroke="#2a5a0a" strokeWidth="1" fill="#4a8a18" fillOpacity="0.9" />
      <path d="M 15 46 Q 3 38 2 50 Q 3 58 10 54 Q 15 56 15 46"  stroke="#2a5a0a" strokeWidth="1" fill="#3a7a12" fillOpacity="0.9" />
      <path d="M 21 40 Q 32 32 33 44 Q 32 52 26 48 Q 21 50 21 40" stroke="#2a5a0a" strokeWidth="1" fill="#4a8a18" fillOpacity="0.9" />
      <path d="M 15 22 Q 4 15 3 26 Q 4 33 11 29 Q 15 31 15 22"  stroke="#2a5a0a" strokeWidth="1" fill="#3a7a12" fillOpacity="0.9" />
      <path d="M 10 116 Q 6 136 9 158 Q 11 178 7 198 Q 5 208 8 218"  stroke="#4a7a1e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 24 116 Q 28 138 25 160 Q 23 180 27 200 Q 29 210 27 218" stroke="#3a6a14" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 17 116 Q 17 140 18 162 Q 19 185 17 205"               stroke="#4a7a1e" strokeWidth="1"   fill="none" strokeLinecap="round" />
      <path d="M 9 148 Q 0 144 0 153 Q 1 159 7 156 Q 9 157 9 148"   stroke="#2a5a0a" strokeWidth="1" fill="#4a8818" fillOpacity="0.88" />
      <path d="M 8 172 Q -1 168 0 177 Q 1 183 7 180 Q 9 181 8 172"  stroke="#2a5a0a" strokeWidth="1" fill="#3a7a12" fillOpacity="0.88" />
      <path d="M 25 152 Q 34 148 35 157 Q 34 163 28 160 Q 25 161 25 152" stroke="#2a5a0a" strokeWidth="1" fill="#3a7812" fillOpacity="0.88" />
      <path d="M 26 176 Q 35 172 35 181 Q 34 187 28 184 Q 26 185 26 176" stroke="#2a5a0a" strokeWidth="1" fill="#4a8818" fillOpacity="0.88" />
      <path d="M 17 158 Q 9 154 9 162 Q 10 168 15 165"               stroke="#2a5a0a" strokeWidth="1" fill="#3a7a12" fillOpacity="0.85" />
    </svg>
  ),

  /* 2 — string of pearls */
  () => (
    <svg width="32" height="200" viewBox="0 0 32 200" style={{ flexShrink: 0, alignSelf: "flex-end", overflow: "visible" }}>
      <path d="M 6 96 Q 5 108 7 111 L 25 111 Q 27 108 26 96 Z" fill="#e8e0d8" />
      <rect x="4" y="93" width="24" height="5" rx="2" fill="#f0e8e0" />
      <ellipse cx="16" cy="95" rx="11" ry="3" fill="#2a1a08" />
      <ellipse cx="16" cy="94" rx="9" ry="2.5" fill="#c8b890" />
      <ellipse cx="16" cy="78" rx="10" ry="12" fill="#4a8a20" opacity="0.9" />
      <ellipse cx="9"  cy="74" rx="7"  ry="9"  fill="#3a7a18" opacity="0.88" />
      <ellipse cx="23" cy="74" rx="7"  ry="9"  fill="#5a9a28" opacity="0.88" />
      <ellipse cx="16" cy="68" rx="8"  ry="8"  fill="#4a9022" opacity="0.9"  />
      <line x1="8"  y1="111" x2="8"  y2="190" stroke="#4a8a1e" strokeWidth="0.8" opacity="0.6" />
      <line x1="12" y1="111" x2="12" y2="200" stroke="#4a8a1e" strokeWidth="0.8" opacity="0.6" />
      <line x1="16" y1="111" x2="16" y2="195" stroke="#4a8a1e" strokeWidth="0.8" opacity="0.6" />
      <line x1="20" y1="111" x2="20" y2="200" stroke="#4a8a1e" strokeWidth="0.8" opacity="0.6" />
      <line x1="24" y1="111" x2="24" y2="185" stroke="#4a8a1e" strokeWidth="0.8" opacity="0.6" />
      {[8,12,16,20,24].map((x, si) => {
        const len = [79, 89, 84, 89, 74][si];
        return Array.from({length: Math.floor(len/10)}, (_,b) => (
          <circle key={b} cx={x} cy={111 + b*10 + 6} r="3.8"
            fill="#5aaa28" opacity="0.88" stroke="#3a7a18" strokeWidth="0.5" />
        ));
      })}
    </svg>
  ),
];

const BOOKNOOKS = [
  /* 0 — cozy cottage doorway */
  <svg key="cottage" width="44" height="160" viewBox="0 0 44 160">
    <rect x="0" y="0" width="44" height="160" rx="2" fill="#d4b896" />
    <rect x="3" y="3" width="38" height="154" rx="1" fill="#c8a878" />
    {/* Sky */}
    <rect x="3" y="3" width="38" height="80" fill="#a8c4e8" />
    {/* Clouds */}
    <ellipse cx="14" cy="18" rx="8"  ry="5"  fill="#fff" opacity="0.85" />
    <ellipse cx="20" cy="15" rx="7"  ry="5"  fill="#fff" opacity="0.85" />
    <ellipse cx="32" cy="22" rx="6"  ry="4"  fill="#fff" opacity="0.8"  />
    {/* Cottage */}
    <rect x="8" y="60" width="28" height="45" fill="#e8d0a8" />
    <polygon points="6,62 22,40 38,62" fill="#8B4513" />
    {/* Roof shingles */}
    {[0,1,2].map(i => <rect key={i} x={8+i*10} y={48} width="9" height="5" rx="1" fill="#7a3c10" opacity="0.7" />)}
    {/* Door */}
    <rect x="16" y="82" width="12" height="22" rx="2" fill="#6b3f14" />
    <rect x="16" y="82" width="12" height="10" rx="2" fill="#7a4a1a" />
    <circle cx="25" cy="93" r="1.5" fill="#ffd700" />
    {/* Lit window */}
    <rect x="9"  y="65" width="10" height="10" rx="1" fill="#ffe88a" />
    <rect x="25" y="65" width="10" height="10" rx="1" fill="#ffe88a" />
    <line x1="14" y1="65" x2="14" y2="75" stroke="#8B6914" strokeWidth="0.8" />
    <line x1="9"  y1="70" x2="19" y2="70" stroke="#8B6914" strokeWidth="0.8" />
    <line x1="30" y1="65" x2="30" y2="75" stroke="#8B6914" strokeWidth="0.8" />
    <line x1="25" y1="70" x2="35" y2="70" stroke="#8B6914" strokeWidth="0.8" />
    {/* Garden path */}
    <ellipse cx="22" cy="112" rx="7"  ry="3"  fill="#b8956a" />
    <ellipse cx="22" cy="120" rx="8"  ry="3"  fill="#c0a070" />
    <ellipse cx="22" cy="130" rx="9"  ry="3"  fill="#b8956a" />
    <ellipse cx="22" cy="142" rx="10" ry="3"  fill="#c0a070" />
    {/* Flowers */}
    <circle cx="9"  cy="108" r="3" fill="#e85a8a" />
    <circle cx="9"  cy="108" r="1" fill="#ffe000" />
    <circle cx="35" cy="110" r="3" fill="#e8a02a" />
    <circle cx="35" cy="110" r="1" fill="#fff" />
    <circle cx="7"  cy="115" r="2" fill="#c84a6a" />
    <circle cx="37" cy="118" r="2" fill="#e8602a" />
    {/* Grass */}
    <rect x="3" y="105" width="38" height="52" fill="#7ab83a" opacity="0.3" />
  </svg>,

  /* 1 — moonlit forest */
  <svg key="forest" width="44" height="160" viewBox="0 0 44 160">
    <rect x="0" y="0" width="44" height="160" rx="2" fill="#c8d8f0" />
    <rect x="3" y="3" width="38" height="154" rx="1" fill="#1a2a4a" />
    {/* Night sky gradient */}
    <rect x="3" y="3" width="38" height="90" fill="#1a2a4a" />
    {/* Moon */}
    <circle cx="30" cy="20" r="10" fill="#fff8e0" opacity="0.95" />
    <circle cx="34" cy="16" r="8"  fill="#1a2a4a" opacity="0.6"  />
    {/* Stars */}
    {[[8,10],[15,7],[6,22],[38,12],[40,28],[10,32],[35,35]].map(([x,y],i) => (
      <circle key={i} cx={x} cy={y} r="1" fill="#fff" opacity="0.9" />
    ))}
    {/* Ground */}
    <rect x="3" y="115" width="38" height="42" fill="#2a4a1a" />
    {/* Trees */}
    <polygon points="22,40 13,95 31,95"  fill="#0d2a0d" />
    <polygon points="22,52 14,98 30,98"  fill="#122a12" />
    <rect x="20" y="95" width="4" height="22" fill="#1a0e06" />
    <polygon points="8,55 1,95 15,95"    fill="#0d2a0d" opacity="0.95" />
    <rect x="6"  y="94" width="3" height="23" fill="#1a0e06" />
    <polygon points="36,60 29,95 43,95"  fill="#0d2a0d" opacity="0.95" />
    <rect x="34" y="94" width="3" height="23" fill="#1a0e06" />
    {/* Glowing path */}
    <path d="M 16 157 Q 18 135 22 110 Q 26 135 28 157" fill="#3a5a2a" opacity="0.8" />
    <ellipse cx="22" cy="155" rx="10" ry="3" fill="#aaddff" opacity="0.15" />
    {/* Fireflies */}
    <circle cx="10" cy="100" r="1.5" fill="#ffffaa" opacity="0.8" />
    <circle cx="33" cy="105" r="1.5" fill="#ffffaa" opacity="0.8" />
    <circle cx="18" cy="108" r="1"   fill="#ffffaa" opacity="0.6" />
  </svg>,

  /* 2 — wizard's library alcove */
  <svg key="wizard" width="44" height="160" viewBox="0 0 44 160">
    <rect x="0" y="0" width="44" height="160" rx="2" fill="#c8b8d8" />
    <rect x="3" y="3" width="38" height="154" rx="1" fill="#1a0e2a" />
    {/* Stone archway */}
    <path d="M 5 80 Q 5 20 22 15 Q 39 20 39 80" fill="#2a1a3a" stroke="#4a3a5a" strokeWidth="1.5" />
    <path d="M 8 80 Q 8 24 22 20 Q 36 24 36 80" fill="#1a0e2a" />
    {/* Glowing orb */}
    <circle cx="22" cy="45" r="10" fill="#cc88ff" opacity="0.4" />
    <circle cx="22" cy="45" r="7"  fill="#dd99ff" opacity="0.5" />
    <circle cx="22" cy="45" r="4"  fill="#eeccff" opacity="0.9" />
    <circle cx="20" cy="43" r="2"  fill="#fff"    opacity="0.8" />
    {/* Orb glow rays */}
    {[0,45,90,135,180,225,270,315].map((deg, i) => (
      <line key={i}
        x1={22} y1={45}
        x2={22 + Math.cos(deg*Math.PI/180)*14}
        y2={45 + Math.sin(deg*Math.PI/180)*14}
        stroke="#cc88ff" strokeWidth="0.8" opacity="0.3"
      />
    ))}
    {/* Mini bookshelves inside */}
    <rect x="9"  y="75" width="10" height="6" fill="#5a3a1a" />
    <rect x="9"  y="76" width="2"  height="5" fill="#8B2020" />
    <rect x="11" y="76" width="2"  height="5" fill="#1a3a6b" />
    <rect x="13" y="76" width="2"  height="5" fill="#2a6b3a" />
    <rect x="15" y="76" width="2"  height="5" fill="#4a1a6b" />
    <rect x="25" y="75" width="10" height="6" fill="#5a3a1a" />
    <rect x="25" y="76" width="2"  height="5" fill="#6b3a1a" />
    <rect x="27" y="76" width="2"  height="5" fill="#1a4a4a" />
    <rect x="29" y="76" width="2"  height="5" fill="#8B2020" />
    <rect x="31" y="76" width="2"  height="5" fill="#2a6b3a" />
    {/* Candles */}
    <rect x="10" y="68" width="3" height="8"  fill="#f5e6c8" />
    <ellipse cx="11.5" cy="68" rx="1.5" ry="3" fill="#ffcc44" opacity="0.9" />
    <rect x="31" y="65" width="3" height="11" fill="#f5e6c8" />
    <ellipse cx="32.5" cy="65" rx="1.5" ry="3" fill="#ffcc44" opacity="0.9" />
    {/* Cobblestone floor */}
    {[[8,90],[18,90],[28,90],[38,90],[5,97],[14,97],[23,97],[32,97],[41,97]].map(([x,y],i) => (
      <ellipse key={i} cx={x} cy={y} rx="4" ry="2.5" fill="#2a1a3a" stroke="#3a2a4a" strokeWidth="0.5" />
    ))}
    {/* Floating sparkles */}
    {[[14,58],[30,55],[8,65],[36,62]].map(([x,y],i) => (
      <circle key={i} cx={x} cy={y} r="1" fill="#eeccff" opacity="0.7" />
    ))}
  </svg>,

  /* 3 — beach sunset cove */
  <svg key="beach" width="44" height="160" viewBox="0 0 44 160">
    <rect x="0" y="0" width="44" height="160" rx="2" fill="#f0c860" />
    <rect x="3" y="3" width="38" height="154" rx="1" fill="#f0a040" />
    {/* Sunset sky */}
    <rect x="3" y="3"  width="38" height="60" fill="#ff7a2a" />
    <rect x="3" y="40" width="38" height="30" fill="#ffaa44" />
    <rect x="3" y="60" width="38" height="20" fill="#ffcc66" />
    {/* Sun */}
    <circle cx="22" cy="55" r="12" fill="#ffee44" opacity="0.95" />
    {/* Sun reflection on water */}
    <rect x="18" y="90" width="8" height="30" fill="#ffdd44" opacity="0.5" />
    {/* Water */}
    <rect x="3" y="88" width="38" height="50" fill="#2a6aaa" />
    <rect x="3" y="88" width="38" height="10" fill="#3a8acc" opacity="0.6" />
    {/* Waves */}
    <path d="M 3 95 Q 12 92 22 95 Q 32 98 41 95" stroke="#5aaad4" strokeWidth="1.5" fill="none" />
    <path d="M 3 102 Q 12 99 22 102 Q 32 105 41 102" stroke="#5aaad4" strokeWidth="1"   fill="none" opacity="0.7" />
    {/* Sand */}
    <rect x="3" y="133" width="38" height="24" fill="#e8c870" />
    {/* Seashells */}
    <ellipse cx="10" cy="140" rx="4" ry="2" fill="#f0d898" />
    <ellipse cx="32" cy="138" rx="3" ry="2" fill="#e8c068" />
    <ellipse cx="20" cy="145" rx="2" ry="1" fill="#f8e8a0" />
    {/* Palm tree */}
    <path d="M 8 135 Q 10 110 12 88" stroke="#5a3210" strokeWidth="3" fill="none" strokeLinecap="round" />
    <ellipse cx="8"  cy="84" rx="8"  ry="5" fill="#3a8a1a" opacity="0.9" transform="rotate(-20,8,84)"  />
    <ellipse cx="14" cy="80" rx="8"  ry="4" fill="#4a9a2a" opacity="0.9" transform="rotate(10,14,80)"  />
    <ellipse cx="10" cy="78" rx="7"  ry="4" fill="#3a8a1a" opacity="0.85" transform="rotate(-30,10,78)" />
  </svg>,
];

function ShelfPlant({ plantIndex }) {
  const plant = PLANTS[plantIndex % PLANTS.length];
  return plant();
}

function BookNook({ nookIndex }) {
  return (
    <div style={{ flexShrink: 0, alignSelf: "flex-end", borderRadius: "2px 2px 0 0", overflow: "hidden", boxShadow: "2px 0 8px rgba(0,0,0,0.35), -2px 0 8px rgba(0,0,0,0.35)" }}>
      {BOOKNOOKS[nookIndex % BOOKNOOKS.length]}
    </div>
  );
}

function BookShelf({ genre, onClose }) {
  const allBooks = (library[genre] || []).filter((b) => b.type === "ebooks");
  const books = allBooks;

  // Split books into rows of 6
  const rows = [];
  for (let i = 0; i < books.length; i += 6) {
    rows.push(books.slice(i, i + 6));
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        backgroundColor: "#F8F1E4",
        backgroundImage:
          'url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        overflowY: "auto",
        padding: "30px 40px",
      }}
    >
      {/* Back button */}
      <button
        onClick={onClose}
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          padding: "8px 18px",
          borderRadius: "50px",
          border: "1px solid #8B5E3C",
          cursor: "pointer",
          background: "radial-gradient(circle at 30% 30%, #F5E6C8, #D8C3A5 70%)",
          color: "#3A2A1A",
          fontFamily: '"Palatino Linotype", Palatino, serif',
          fontWeight: 700,
          fontSize: 14,
          boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
          zIndex: 201,
        }}
      >
        ← Back to Tree
      </button>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 30, paddingTop: 10 }}>
        <h1 style={{
          fontFamily: '"Palatino Linotype", Palatino, serif',
          color: "#3A2A1A",
          fontSize: 34,
          letterSpacing: "1.5px",
          marginBottom: 6,
        }}>
          📚 {genre}
        </h1>
        <p style={{
          fontFamily: '"Palatino Linotype", Palatino, serif',
          color: "#4B3A2A",
          fontStyle: "italic",
          fontSize: 15,
        }}>
          📘 {allBooks.length} eBooks in this collection
        </p>
      </div>

      {/* Bookshelves */}
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} style={{ marginBottom: 50 }}>

            {/* Books sitting on the shelf — no dark panel */}
            <div style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 5,
              padding: "0 8px",
            }}>
              {(() => {
                const pattern = SHELF_PATTERNS[rowIndex % SHELF_PATTERNS.length];
                let bookIdx = 0;
                return pattern.map((item, pi) => {
                  if (item === "b") {
                    const book = row[bookIdx];
                    bookIdx++;
                    if (!book) return null;
                    return <BookSpine key={pi} book={book} index={bookIdx - 1} rowIndex={rowIndex} />;
                  } else if (item.startsWith("p")) {
                    const pIdx = parseInt(item[1]);
                    return <ShelfPlant key={pi} plantIndex={pIdx} />;
                  } else if (item.startsWith("n")) {
                    const nIdx = parseInt(item[1]);
                    return <BookNook key={pi} nookIndex={nIdx} />;
                  }
                  return null;
                });
              })()}
            </div>

            {/* Elegant mahogany shelf plank */}
            <div style={{
              height: 22,
              background: "linear-gradient(to bottom, #8B4513 0%, #6b3310 30%, #4a2208 70%, #3a1a06 100%)",
              boxShadow: "0 6px 14px rgba(0,0,0,0.4), inset 0 3px 5px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.4)",
              position: "relative",
              overflow: "hidden",
            }}>
              {[10, 22, 38, 51, 64, 77, 89].map((pct) => (
                <div key={pct} style={{ position: "absolute", left: `${pct}%`, top: 2, bottom: 2, width: 1, background: "rgba(0,0,0,0.2)" }} />
              ))}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.18)" }} />
            </div>
            <div style={{ height: 8, background: "linear-gradient(to bottom, rgba(0,0,0,0.25), transparent)" }} />
          </div>
        ))}

        {books.length === 0 && (
          <p style={{
            textAlign: "center",
            fontFamily: '"Palatino Linotype", Palatino, serif',
            fontStyle: "italic",
            color: "#6B4E32",
            fontSize: 16,
            marginTop: 40,
          }}>
            No books found for this filter.
          </p>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [genre, setGenre] = useState(null);
  const [mediaType, setMediaType] = useState("ebooks");
  const [nests, setNests] = useState(DEFAULT_ASSIGNMENTS);
  const [openNestId, setOpenNestId] = useState(null);

  const handleNestClick = (nestGenre) => {
    setGenre(nestGenre);
    setOpenNestId(null);
  };

  const handleNestRightClick = (e, nestId) => {
    e.preventDefault();
    setOpenNestId(openNestId === nestId ? null : nestId);
  };

  const handleGenreSelect = (nestId, selectedGenre) => {
    setNests((prev) => {
      const updated = [...prev];
      const existingNestIndex = updated.findIndex((n) => n.genre === selectedGenre);
      const targetNestIndex = updated.findIndex((n) => n.id === nestId);
      if (existingNestIndex !== -1) {
        const temp = updated[existingNestIndex].genre;
        updated[existingNestIndex] = { ...updated[existingNestIndex], genre: updated[targetNestIndex].genre };
        updated[targetNestIndex] = { ...updated[targetNestIndex], genre: temp };
      } else {
        updated[targetNestIndex] = { ...updated[targetNestIndex], genre: selectedGenre };
      }
      return updated;
    });
    setOpenNestId(null);
  };

  return (
    <>
      {/* BOOKSHELF PAGE */}
      {genre && (
        <BookShelf
          genre={genre}
          onClose={() => setGenre(null)}
        />
      )}

      {/* MAIN TREE PAGE */}
      <div
        onClick={() => setOpenNestId(null)}
        style={{
          minHeight: "100vh",
          padding: 20,
          fontFamily: "Georgia, serif",
          backgroundColor: "#F8F1E4",
          backgroundImage:
            'url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg")',
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        {/* HEADER */}
        <div style={{
          textAlign: "center",
          marginBottom: 10,
          paddingTop: 20,
          background: "linear-gradient(to bottom, rgba(248,241,228,0.7), rgba(248,241,228,0))",
        }}>
          <h1 style={{
            fontFamily: '"Palatino Linotype", Palatino, serif',
            color: "#3A2A1A",
            letterSpacing: "1.5px",
            fontSize: 36,
            marginBottom: 6,
          }}>
            📚 StoryKeeper 🎧
          </h1>
          <p style={{ color: "#4B3A2A", marginTop: 0 }}>
            <em>Read here. Listen here. Live here.</em>
          </p>
          <p style={{ color: "#2A1A0A", marginTop: 4, fontStyle: "italic", fontSize: 15, fontFamily: '"Palatino Linotype", Palatino, serif' }}>
            A living library that grows with each story
          </p>
          <p style={{ color: "#5a3e28", marginTop: 4, fontSize: 12, fontStyle: "italic" }}>
            💡 Click a nest to browse · Right-click to reassign its genre
          </p>
        </div>

        {/* TREE */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative", width: 480, height: 620 }}>
            <img
              src="/tree.png"
              alt="Story tree"
              style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center" }}
            />

            {/* NEST BUTTONS */}
            {nests.map(({ id, left, top, genre: nestGenre }) => (
              <div
                key={id}
                style={{ position: "absolute", left, top, transform: "translate(-50%, -50%)", zIndex: 10 }}
                onClick={(e) => { e.stopPropagation(); handleNestClick(nestGenre); }}
                onContextMenu={(e) => { e.stopPropagation(); handleNestRightClick(e, id); }}
              >
                <div style={{ position: "relative", width: 100, height: 70, cursor: "pointer" }}>
                  <svg viewBox="0 0 100 70" width="100" height="70" style={{ position: "absolute", top: 0, left: 0 }}>
                    <defs>
                      <clipPath id={`nestClip-${id}`}>
                        <ellipse cx="50" cy="44" rx="46" ry="28" />
                      </clipPath>
                    </defs>
                    <image
                      href="/nest_PNG.png"
                      x="-10" y="10" width="120" height="80"
                      clipPath={`url(#nestClip-${id})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                    <ellipse cx="50" cy="68" rx="38" ry="5" fill="rgba(0,0,0,0.3)" />
                  </svg>

                  <div style={{
                    position: "absolute",
                    top: "54%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    color: "#ffffff",
                    fontFamily: '"Palatino Linotype", Palatino, serif',
                    fontWeight: 700,
                    fontSize: 12,
                    whiteSpace: "nowrap",
                    textShadow: "0 1px 5px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.8)",
                    pointerEvents: "none",
                  }}>
                    {nestGenre}
                  </div>

                  {/* Right-click dropdown */}
                  {openNestId === id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: "absolute",
                        top: "110%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "rgba(248,241,228,0.97)",
                        border: "1px solid #8B5E3C",
                        borderRadius: 8,
                        boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
                        zIndex: 100,
                        minWidth: 150,
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ padding: "6px 10px", fontSize: 11, fontStyle: "italic", color: "#7a5230", borderBottom: "1px solid #D8C3A5" }}>
                        Reassign this nest:
                      </div>
                      {ALL_GENRES.map((g) => (
                        <div
                          key={g}
                          onClick={() => handleGenreSelect(id, g)}
                          style={{
                            padding: "8px 12px",
                            cursor: "pointer",
                            fontFamily: '"Palatino Linotype", Palatino, serif',
                            fontSize: 13,
                            color: "#3A2A1A",
                            fontWeight: nestGenre === g ? 700 : 400,
                            background: nestGenre === g ? "rgba(139,94,60,0.15)" : "transparent",
                            borderBottom: "1px solid rgba(216,195,165,0.5)",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(139,94,60,0.2)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = nestGenre === g ? "rgba(139,94,60,0.15)" : "transparent"}
                        >
                          {nestGenre === g ? "✓ " : ""}{g}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* TRUNK KNOT TOGGLE */}
            <button
              onClick={(e) => { e.stopPropagation(); setMediaType(mediaType === "ebooks" ? "audiobooks" : "ebooks"); }}
              title="Toggle ebooks / audiobooks"
              style={{
                position: "absolute",
                left: "48%",
                top: "83%",
                transform: "translate(-50%, -50%)",
                width: 62,
                height: 50,
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                fontSize: 20,
                background: "radial-gradient(ellipse at 46% 50%, #0d0b08 20%, #1e1a10 34%, #2e2416 46%, #3a2d18 56%, #2a2010 68%, #1a1509 82%, #0e0c07 100%)",
                boxShadow: "inset 0 2px 5px rgba(255,255,255,0.04), inset 0 -2px 6px rgba(0,0,0,0.8), 0 3px 10px rgba(0,0,0,0.7), 0 0 0 3px #1a1509, 0 0 0 5px #2e2416, 0 0 0 7px #18130a",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {mediaType === "ebooks" ? "📚" : "🎧"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
