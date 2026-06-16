import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// Module-level background task bus — survives component unmounts
const skDispatch = (type, detail) => window.dispatchEvent(new CustomEvent(type, { detail }));

const SK_THEMES = {
  firelight: {
    name: "🕯️ Warm Firelight",
    bg: "#FBF6EE",
    bgDeep: "#F3E9D8",
    bgMuted: "#EDE0CC",
    accent: "#6B4E32",
    accentLight: "#8B6A4A",
    text: "#3A2A1A",
    textMid: "#4A3728",
    textSoft: "#6B4E32",
    border: "rgba(216,195,165,0.5)",
    toggleOn: "#6B4E32",
    toggleOff: "#C4B09A",
  },
  midnight: {
    name: "🌙 Midnight Library",
    bg: "#12172B",
    bgDeep: "#0D1220",
    bgMuted: "#1E2640",
    accent: "#C9A84C",
    accentLight: "#DFC06E",
    text: "#E8E0D0",
    textMid: "#C8BCA8",
    textSoft: "#C9A84C",
    border: "rgba(201,168,76,0.25)",
    toggleOn: "#C9A84C",
    toggleOff: "#3A4260",
  },
  forest: {
    name: "🌿 Enchanted Forest",
    bg: "#1A2418",
    bgDeep: "#131B12",
    bgMuted: "#263322",
    accent: "#A07840",
    accentLight: "#C09050",
    text: "#E0DDCC",
    textMid: "#C4C0A8",
    textSoft: "#A0C070",
    border: "rgba(160,120,64,0.3)",
    toggleOn: "#A07840",
    toggleOff: "#3A4A32",
  },
  blush: {
    name: "🌸 Soft Blush",
    bg: "#FDF5F7",
    bgDeep: "#F5E8EE",
    bgMuted: "#EDD8E4",
    accent: "#9B5E72",
    accentLight: "#B8768A",
    text: "#3A1F28",
    textMid: "#5A3040",
    textSoft: "#9B5E72",
    border: "rgba(180,130,150,0.35)",
    toggleOn: "#9B5E72",
    toggleOff: "#D4A8B8",
  },
};

const SUPABASE_URL = "https://elmoftpybhfxqzkrhkwe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsbW9mdHB5YmhmeHF6a3Joa3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNTAyMDksImV4cCI6MjA5NjYyNjIwOX0.HLHuP1CujyaJLCkpSiW56AHJZyCeFeJyGavQcbUeFOM";
const needsDesc = (b) => !b.description && b.genre !== "Cookbooks";
function getSupabase() {
  const key = localStorage.getItem("sk_supabase_key") || SUPABASE_ANON_KEY;
  return createClient(SUPABASE_URL, key);
}

function KnotScrollTooltip({ text, left, top }) {
  return (
    <div style={{
      position: "absolute",
      left,
      top,
      transform: "translate(-50%, -110%)",
      marginBottom: 4,
      zIndex: 999,
      pointerEvents: "none",
      whiteSpace: "nowrap",
    }}>
      <div style={{
        height: 7,
        background: "linear-gradient(to bottom, #c8a050, #e8c878 40%, #d4a84a)",
        borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
        boxShadow: "0 -2px 4px rgba(0,0,0,0.2)",
        margin: "0 4px",
      }} />
      <div style={{
        background: "linear-gradient(to bottom, #f5e6c0, #fdf3d8 30%, #fdf3d8 70%, #f0d9a0)",
        border: "1px solid #c8a050",
        borderTop: "none",
        borderBottom: "none",
        padding: "4px 12px",
        fontFamily: '"Palatino Linotype", Palatino, serif',
        fontSize: 10,
        color: "#3A2A1A",
        fontStyle: "italic",
        letterSpacing: "0.5px",
        boxShadow: "2px 0 4px rgba(0,0,0,0.12), -2px 0 4px rgba(0,0,0,0.12)",
        textAlign: "center",
      }}>
        {text}
      </div>
      <div style={{
        height: 7,
        background: "linear-gradient(to top, #c8a050, #e8c878 40%, #d4a84a)",
        borderRadius: "0 0 50% 50% / 0 0 100% 100%",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        margin: "0 4px",
      }} />
    </div>
  );
}

function isBadCover(url) {
  if (!url) return true;
  const u = url.toLowerCase();
  return u.includes("20years") || u.includes("nophoto") || u.includes("nocover") ||
    u.includes("no_cover") || u.includes("placeholder") || u.includes("default_cover") ||
    u.includes("missing_cover") || u.includes("no-cover") || u.includes("blank");
}

function cleanTitle(title) {
  return title
    .replace(/\s*[\(\[].*?[\)\]]/g, "") // remove (Book 1), [Unabridged], etc.
    .replace(/\s*:\s*.+$/, "")           // remove subtitle after colon
    .replace(/,?\s*(Book|Vol|Volume|Part|Series)\s*\d+.*/i, "") // remove series numbering
    .trim();
}

// Flip "Last, First" → "First Last" for better API search results
function normalizeAuthor(author) {
  if (!author) return author;
  // Kindle format: "Last, First:Last2, First2:" — split on colon first, take the first author
  const colonParts = author.split(":").map(s => s.trim()).filter(Boolean);
  const firstAuthor = colonParts[0] || author;
  // Handle "Last, First" → "First Last"
  const commaParts = firstAuthor.split(",").map(s => s.trim());
  if (commaParts.length >= 2 && commaParts[1]) {
    return `${commaParts[1]} ${commaParts[0]}`;
  }
  return firstAuthor;
}

const ADMIN_EMAIL = "msbratt23@gmail.com";

const COMMUNITY_RULES = [
  { emoji: "🤝", title: "Be kind & respectful", body: "Treat every reader the way you'd want to be treated. Disagreements about books are welcome; personal attacks are not." },
  { emoji: "📚", title: "Keep it about books", body: "Posts should relate to reading, books, authors, or the genre you're in. This isn't a general chat board." },
  { emoji: "⚠️", title: "No spoilers without warning", body: "Always start your post with ⚠️ SPOILER if you're discussing plot details. Not everyone reads at the same pace." },
  { emoji: "🚫", title: "No hate speech or harassment", body: "Zero tolerance for content that targets anyone based on race, gender, religion, sexuality, or any other identity." },
  { emoji: "📣", title: "No spam or self-promotion", body: "Don't post links, advertise services, or repeatedly post the same content." },
  { emoji: "🌿", title: "Keep it family-friendly in general groups", body: "Dark Romance and Horror groups may discuss mature themes, but explicit content is not permitted anywhere." },
  { emoji: "📖", title: "Respect the book club format", body: "In book clubs, stay on topic with the current read. Off-topic discussion belongs in the genre group." },
  { emoji: "🛡️", title: "Reports are taken seriously", body: "If you see something that violates these rules, use the Report button. Repeated violations will result in removal from the community." },
];

const BANNED_WORDS = [
  "fuck","shit","bitch","asshole","cunt","nigger","nigga","faggot","retard","whore","slut",
  "kike","spic","chink","wetback","tranny","rape","molest","pedophile","nazi","kill yourself",
  "kys","go die","hate you","piece of shit","motherfucker","cocksucker",
];

const containsBannedWords = (text) => {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(w => lower.includes(w));
};

const checkToxicity = async (text) => {
  const apiKey = import.meta.env.VITE_PERSPECTIVE_API_KEY;
  if (!apiKey) return false;
  try {
    const res = await fetch(
      `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: { text },
          requestedAttributes: { TOXICITY: {} },
        }),
      }
    );
    const data = await res.json();
    const score = data?.attributeScores?.TOXICITY?.summaryScore?.value || 0;
    return score > 0.85;
  } catch { return false; }
};

const ALL_GENRES = [
  "Fantasy", "Mystery & Thriller", "Sci-Fi", "Romance",
  "Self Help", "Dark Romance", "Fiction", "Historical Fiction",
  "Cookbooks", "Drama", "True Crime", "Gardening & Landscaping",
  "Health & Wellness", "Home & DIY", "Classics", "Sewing & Crafts", "Cozy Mystery", "Horror", "Miscellaneous",
];

// Map Open Library / Google Books subjects to our genres
function detectGenreFromTitle(title = "") {
  const t = title.toLowerCase();

  if (t.includes("cookbook") || t.includes("recipes") || t.includes("cooking") ||
      t.includes("baking") || t.includes("pastry") || t.includes("culinary") ||
      t.includes("air fryer") || t.includes("instant pot") || t.includes("slow cooker") ||
      t.includes("cast iron") || t.includes("grilling") || t.includes("bbq") ||
      t.includes("keto") || t.includes("paleo") || t.includes("vegan recipes") ||
      t.includes("meal prep") || t.includes("meal plan") || (t.includes("kitchen") && t.includes("guide")) ||
      t.includes("mexican") || t.includes("chinese") || t.includes("japanese") ||
      t.includes("italian") || t.includes("mediterranean") || t.includes("thai") ||
      t.includes("french cuisine") || t.includes("indian cuisine") || t.includes("korean") ||
      t.includes("cakes") || t.includes("muffins") || t.includes("breads") ||
      t.includes("sourdough") || t.includes("smoker") || t.includes("smoking meat") ||
      t.includes("barbecue") || t.includes("one-pot") || t.includes("one pot meal") ||
      t.includes("mediterranean diet") || t.includes("whole30") || t.includes("dash diet") ||
      t.includes("intermittent fasting") || t.includes("diabetic diet") || t.includes("diabetic cookbook") ||
      t.includes("low-carb") || t.includes("low carb") || t.includes("gluten-free recipes") ||
      t.includes("mug cake") || t.includes("campfire cooking") || t.includes("outdoor cooking") ||
      t.includes("desserts cookbook") || t.includes("healthy desserts") || t.includes("healthy recipes") ||
      t.includes("quick meals") || t.includes("easy meals") || t.includes("dinner recipes") ||
      t.includes("breakfast recipes") || t.includes("lunch recipes") || t.includes("soup recipes") ||
      t.includes("pressure cooker") || t.includes("dutch oven") || t.includes("wok ") ||
      t.includes("no-bake") || t.includes("sheet pan") || t.includes("skillet recipes") ||
      t.includes("fix-it and forget-it") || t.includes("fix it and forget it")) return "Cookbooks";

  if (t.includes("garden") || t.includes("gardening") || t.includes("landscaping") ||
      t.includes("horticulture") || t.includes("plant care") ||
      t.includes("vegetable garden") || t.includes("raised bed") || t.includes("composting") ||
      t.includes("permaculture") || t.includes("herbalism")) return "Gardening & Landscaping";

  if (t.includes("true crime") || t.includes("serial killer") || t.includes("cold case") ||
      t.includes("unsolved murder") || t.includes("crime scene")) return "True Crime";

  if (t.includes("self-help") || t.includes("self help") || (t.includes("how to") && t.includes("life")) ||
      t.includes("habits") || t.includes("mindset") || t.includes("atomic habits") ||
      t.includes("productivity") || t.includes("mindfulness") || t.includes("meditation guide")) return "Self Help";

  // Fantasy — paranormal/supernatural title signals
  if (t.includes("vampire") || t.includes("werewolf") || t.includes("shifter") || t.includes("shifted") ||
      t.includes("dragon") || t.includes("witch") || t.includes("wizard") || t.includes("mage") ||
      t.includes("fae") || t.includes("faerie") || t.includes("faery") || t.includes("fey") ||
      t.includes("magic") || t.includes("sorcery") || t.includes("enchant") || t.includes("spellcast") ||
      t.includes("demon") || t.includes("angel") || t.includes("celestial") || t.includes("immortal") ||
      t.includes("paranormal") || t.includes("supernatural") || t.includes("mytholog") ||
      t.includes("prophecy") || t.includes("chosen one") || t.includes("dark lord") ||
      t.includes("god of") || t.includes("gods of") || t.includes("goddess") || t.includes("deity") ||
      t.includes("hades") || t.includes("olympus") || t.includes("underworld") ||
      t.includes("shadow realm") || t.includes("mortal realm") || t.includes("the veil") ||
      t.includes("beyond the veil") || t.includes("the fates") || t.includes("between the fates") ||
      t.includes("hunts inside") || t.includes("lurks between") || t.includes("lies beyond") ||
      t.includes("kingdom of") || t.includes("court of") || t.includes("throne of") ||
      t.includes("heir of") || t.includes("crown of") || t.includes("emperor of") ||
      t.includes("twisted crown") || t.includes("two crowns") || t.includes("vows & ruin") ||
      t.includes("blood & steel") || t.includes("blood and steel") ||
      t.includes("coven") || t.includes("fated mate") || t.includes("true mate") || t.includes("mate bond") ||
      t.includes("alpha") || t.includes("omega") || (t.includes("wolf") && !t.includes("wolf of wall")) ||
      t.includes("traitor wolf") || t.includes("prowling") ||
      t.includes("feathers so") || t.includes("winter king") ||
      t.includes("shadow realms") || t.includes("shadows of fire") || t.includes("shadows so") ||
      t.includes("neon gods") || t.includes("electric idol") || t.includes("wicked beauty") ||
      t.includes("radiant sin") || t.includes("cruel seduction") ||
      t.includes("dark olympus") || t.includes("four horsemen") ||
      t.includes("pestilence") || (t.includes("war") && t.includes("dramatized")) ||
      t.includes("rhapsodic") || t.includes("strange hymn") || t.includes("a shift in") ||
      t.includes("dark harmony") || t.includes("fate & furies") || t.includes("fate and furies") ||
      t.includes("what lies beyond") || t.includes("what lurks") || t.includes("what hunts") ||
      t.includes("the cursed") || t.includes("cloaked") || t.includes("oathbreaker") ||
      t.includes("hidden deep") || t.includes("hidden saga") || t.includes("flame") && t.includes("book") ||
      t.includes("the darkness within") || t.includes("one dark summer") || t.includes("stolen") && t.includes("mate")) return "Fantasy";

  // Dark Romance — possessive/taboo/morally-grey titles
  if (t.includes("dark romance") || t.includes("forbidden desire") || t.includes("forbidden love") ||
      t.includes("morally grey") || t.includes("anti-hero") ||
      (t.includes("villain") && t.includes("romance"))) return "Dark Romance";

  // Mystery & Thriller — title signals
  if (t.includes("cozy mystery") || t.includes("amateur sleuth") || t.includes("cozy crime")) return "Cozy Mystery";

  if (t.includes("thriller") || t.includes("suspense") || t.includes("mystery") ||
      t.includes("detective") || t.includes("fbi") || t.includes("psychological suspense") ||
      t.includes("serial killer") || t.includes("cold case") || t.includes("murder") ||
      t.includes("killer") || t.includes("assassin") || t.includes("espionage") || t.includes("spy") ||
      t.includes("no bad deed") || t.includes("nothing to hide") || t.includes("all the lies") ||
      t.includes("all the truths") || t.includes("the only one left") || t.includes("one dark window") ||
      t.includes("the recipient") || t.includes("the lighthouse") || t.includes("the island house") ||
      t.includes("the perfect divorce") || t.includes("the search") || t.includes("search and rescue")) return "Mystery & Thriller";

  // Romance — title signals
  if (t.includes("romance") || t.includes("love story") || t.includes("enemies to lovers") ||
      t.includes("small town") || t.includes("billionaire") || t.includes("forbidden") ||
      t.includes("seduction") || t.includes("tempt") || t.includes("secretly craved") ||
      t.includes("craved") || t.includes("ink") && (t.includes("delicate") || t.includes("tattoo")) ||
      t.includes("his wild") || t.includes("her last first") || t.includes("confessions to") ||
      t.includes("beautifully wounded") || t.includes("hearts reclaimed") ||
      t.includes("summer fated") || t.includes("love rinkside") || t.includes("rinkside") ||
      t.includes("the baby bargain") || t.includes("the girl he needs") ||
      t.includes("more than friends") || t.includes("same page") && t.includes("love") ||
      t.includes("finding faith") || t.includes("flying high") ||
      t.includes("the layman and the princess") || t.includes("delicate ink") ||
      t.includes("some like it charming") || t.includes("a favorite daughter") ||
      t.includes("the plumber and the widow") || t.includes("love will grow") ||
      t.includes("what i'm looking for") || t.includes("same page") ||
      t.includes("the price of a promise") || (t.includes("stolen") && !t.includes("mate")) ||
      t.includes("single dad") || t.includes("single mom") || t.includes("surprise baby") ||
      t.includes("secret baby") || t.includes("fake date") || t.includes("fake fiance") ||
      t.includes("fake boyfriend") || t.includes("second chance") || t.includes("grumpy") ||
      t.includes("bodyguard") || t.includes("cowboy") && !t.includes("space") ||
      t.includes("boss's") || t.includes("my boss") || t.includes("nanny") ||
      t.includes("make me smile") || t.includes("make me hot") || t.includes("make me yours") ||
      t.includes("make me fall") || t.includes("make me choose") || t.includes("make me lose") ||
      t.includes("heart of stone") || t.includes("hearts of") || t.includes("stone deep") ||
      t.includes("age gap") || t.includes("office romance") || t.includes("forbidden age") ||
      t.includes("dirty secret") || t.includes("dirty shame") || t.includes("dirty talk") ||
      t.includes("dirty deal") || t.includes("dirty dozen") ||
      t.includes("cocky") || t.includes("blackmail") || t.includes("midnight oil") ||
      t.includes("strong & seductive") || t.includes("rough & ready") || t.includes("built & badass") ||
      t.includes("hot & handy") || t.includes("cocky & captivating") || t.includes("price of passion") ||
      t.includes("price of infamy") || t.includes("price of revenge") || t.includes("price of forever") ||
      t.includes("drive me wilde") || t.includes("burying his")) return "Romance";

  // Classics / Literary Fiction
  if (t.includes("hamlet") || t.includes("othello") || t.includes("king lear") ||
      t.includes("julius caesar") || t.includes("romeo and juliet") || t.includes("midsummer") ||
      t.includes("wuthering heights") || t.includes("macabre mansion") ||
      t.includes("fall of the house")) return "Fiction";

  return null;
}

function detectGenre(subjects = [], title = "") {
  // Title-based detection takes highest priority — titles are unambiguous
  const titleGenre = detectGenreFromTitle(title);
  if (titleGenre) return titleGenre;

  const s = subjects.join(" ").toLowerCase();

  // --- Non-fiction / specialty genres first (highest priority) ---
  if (s.includes("cook") || s.includes("cookbook") || s.includes("recipe") || s.includes("baking") ||
      s.includes("culinary") || s.includes("food") || s.includes("pastry") || s.includes("kitchen") ||
      s.includes("gastronomy") || s.includes("grilling") || s.includes("bbq") || s.includes("barbecue") ||
      s.includes("smoker") || s.includes("mediterranean diet") || s.includes("mexican cuisine") ||
      s.includes("italian cuisine") || s.includes("japanese cuisine") || s.includes("chinese cuisine") ||
      s.includes("muffin") || s.includes("sourdough") || s.includes("cake") || s.includes("bread")) return "Cookbooks";

  if (s.includes("true crime") || s.includes("murder") || s.includes("serial killer") ||
      s.includes("criminal investigation") || s.includes("forensic") || s.includes("cold case") ||
      s.includes("unsolved") || s.includes("homicide") || s.includes("criminal case") ||
      s.includes("crime investigation")) return "True Crime";

  if (s.includes("garden") || s.includes("gardening") || s.includes("landscape") ||
      s.includes("landscaping") || s.includes("horticulture") || s.includes("botany") ||
      s.includes("planting") || s.includes("floriculture") || s.includes("outdoor living") ||
      s.includes("plant care") || s.includes("flower") || s.includes("herbalism") ||
      s.includes("permaculture") || s.includes("organic garden")) return "Gardening & Landscaping";

  if (s.includes("self-help") || s.includes("self help") || s.includes("personal development") ||
      s.includes("personal growth") || s.includes("motivation") || s.includes("productivity") ||
      s.includes("habit") || s.includes("success") ||
      s.includes("leadership") || s.includes("business") || s.includes("entrepreneurship") ||
      s.includes("finance") || s.includes("investing") || s.includes("psychology") ||
      s.includes("spirituality") || s.includes("religion") || s.includes("philosophy") ||
      s.includes("biography") || s.includes("autobiography") || s.includes("memoir") ||
      s.includes("nonfiction") || s.includes("non-fiction") ||
      s.includes("parenting") || s.includes("education") || s.includes("travel") ||
      s.includes("history") || s.includes("politics") || s.includes("economics") ||
      s.includes("science") || s.includes("nature") || s.includes("technology")) return "Self Help";

  if (s.includes("health") || s.includes("fitness") || s.includes("wellness") ||
      s.includes("nutrition") || s.includes("diet") || s.includes("mental health") ||
      s.includes("meditation") || s.includes("yoga") || s.includes("exercise") ||
      s.includes("weight loss") || s.includes("gut health") || s.includes("hormones") ||
      s.includes("sleep") || s.includes("stress") || s.includes("anxiety") ||
      s.includes("mindfulness") || s.includes("self-care") || s.includes("healing")) return "Health & Wellness";

  if (s.includes("home improvement") || s.includes("home repair") || s.includes("diy") ||
      s.includes("woodworking") || s.includes("carpentry") || s.includes("plumbing") ||
      s.includes("electrical wiring") || s.includes("renovation") || s.includes("remodeling") ||
      s.includes("interior design") || s.includes("decorating") || s.includes("organizing") ||
      s.includes("declutter") || s.includes("home decor")) return "Home & DIY";

  if (s.includes("sewing") || s.includes("knitting") || s.includes("crochet") ||
      s.includes("quilting") || s.includes("embroidery") || s.includes("needlework") ||
      s.includes("cross-stitch") || s.includes("crafts") || s.includes("paper crafts") ||
      s.includes("scrapbook") || s.includes("macrame") || s.includes("weaving") ||
      s.includes("fiber arts") || s.includes("hand lettering") || s.includes("calligraphy")) return "Sewing & Crafts";

  if (s.includes("classic literature") || s.includes("literary classic") ||
      s.includes("19th century literature") || s.includes("18th century literature") ||
      s.includes("victorian literature") || s.includes("ancient literature") ||
      s.includes("greek literature") || s.includes("roman literature")) return "Classics";

  // --- Dark Romance before regular Romance ---
  if (s.includes("dark romance") || (s.includes("dark") && s.includes("romance")) ||
      (s.includes("morally grey") && s.includes("romance")) ||
      (s.includes("anti-hero") && s.includes("romance")) ||
      (s.includes("villain") && s.includes("romance"))) return "Dark Romance";

  // --- Specific fiction subgenres before broad "fiction" ---
  if (s.includes("historical fiction") || s.includes("historical novel") ||
      s.includes("historical romance") || s.includes("world war") ||
      s.includes("medieval") || s.includes("ancient rome") || s.includes("ancient egypt") ||
      s.includes("19th century") || s.includes("18th century") || s.includes("victorian") ||
      s.includes("regency")) return "Historical Fiction";

  if (s.includes("science fiction") || s.includes("sci-fi") || s.includes("scifi") ||
      s.includes("dystopia") || s.includes("dystopian") || s.includes("cyberpunk") ||
      s.includes("steampunk") || s.includes("alien") || s.includes("space opera") ||
      s.includes("time travel") || s.includes("robot") || s.includes("artificial intelligence") ||
      s.includes("post-apocalyptic") || s.includes("post apocalyptic")) return "Sci-Fi";

  if (s.includes("fantasy") || s.includes("epic fantasy") || s.includes("high fantasy") ||
      s.includes("urban fantasy") || s.includes("magic") || s.includes("dragon") ||
      s.includes("wizard") || s.includes("witch") || s.includes("fae") || s.includes("faery") ||
      s.includes("fairy tale") || s.includes("sword") || s.includes("sorcery") ||
      s.includes("paranormal") || s.includes("supernatural") || s.includes("vampire") ||
      s.includes("werewolf") || s.includes("mytholog") || s.includes("eldritch") ||
      s.includes("spellcaster") || s.includes("enchant") || s.includes("realm") ||
      s.includes("kingdom of") || s.includes("court of") || s.includes("throne of") ||
      s.includes("heir of") || s.includes("crown of") || s.includes("curse") ||
      s.includes("prophecy") || s.includes("chosen one") || s.includes("dark lord") ||
      s.includes("immortal") || s.includes("mage") || s.includes("shifter") ||
      s.includes("shifted") || s.includes("wolf prince") || s.includes("wolf king") ||
      s.includes("alpha") || s.includes("omega") || s.includes("pack") && s.includes("wolf") ||
      s.includes("fated mate") || s.includes("true mate") || s.includes("mate bond") ||
      s.includes("god of") || s.includes("gods of") || s.includes("goddess") ||
      s.includes("deity") || s.includes("hades") || s.includes("olympus") ||
      s.includes("demon") || s.includes("angel") || s.includes("celestial") ||
      s.includes("underworld") || s.includes("shadow and bone") || s.includes("faefolk") ||
      s.includes("mortal realm") || s.includes("plated prisoner") || s.includes("empyrean") ||
      s.includes("fourth wing") || s.includes("iron flame") ||
      s.includes("fey") || s.includes("faerie") ||
      s.includes("ash and blood") || s.includes("blood and ash") || s.includes("flesh & bone") ||
      s.includes("flesh and bone") || s.includes("flesh and fire") ||
      s.includes("hercules") || s.includes("villains of lore") ||
      s.includes("holly library") || s.includes("spy academy") || s.includes("avalon") ||
      s.includes("nocticadia") || s.includes("thezmarr") ||
      s.includes("harry potter") || s.includes("ravenhood") ||
      s.includes("crescent city") || s.includes("zodiac academy") ||
      s.includes("red rising") || s.includes("ever seas") || s.includes("ever queen") ||
      s.includes("book of azrael") || s.includes("artefacts of ouranos") ||
      s.includes("nightshade") || s.includes("into darkness") ||
      s.includes("sun queen") || s.includes("light bringer") ||
      s.includes("shadow in the ember") || s.includes("light in the flame") ||
      s.includes("tenebris court") || s.includes("shield of sparrows") ||
      s.includes("flesh & bone") || s.includes("lightlark") || s.includes("nightbane") ||
      s.includes("everflame") || s.includes("kindred's curse") || s.includes("crowns of nyaxia") ||
      s.includes("star-cursed") || s.includes("nyaxia") || s.includes("hierarchy") ||
      s.includes("kiss of iron")) return "Fantasy";

  if (s.includes("cozy mystery") || s.includes("cozy crime") || s.includes("amateur sleuth") ||
      s.includes("tea shop mystery") || s.includes("bakery mystery") || s.includes("cat mystery") ||
      s.includes("book club mystery") || s.includes("knitting mystery") || s.includes("quilting mystery") ||
      s.includes("cozy") && s.includes("mystery")) return "Cozy Mystery";

  if (s.includes("mystery") || s.includes("detective") || s.includes("whodunit") ||
      s.includes("police procedural") || s.includes("noir") ||
      s.includes("private investigator") || s.includes("cold case") ||
      s.includes("crime") || s.includes("thriller") || s.includes("suspense") ||
      s.includes("psychological thriller") || s.includes("legal thriller") ||
      s.includes("spy") || s.includes("espionage") || s.includes("conspiracy") ||
      s.includes("heist") || s.includes("assassination")) return "Mystery & Thriller";

  if (s.includes("romance") || s.includes("love story") || s.includes("romantic") ||
      s.includes("contemporary romance") || s.includes("chick lit") ||
      s.includes("enemies to lovers") || s.includes("small town romance") ||
      s.includes("billionaire") || s.includes("forbidden love") || s.includes("second chance") ||
      s.includes("fake dating") || s.includes("forced proximity") || s.includes("slow burn") ||
      s.includes("love triangle") || s.includes("instalove") || s.includes("fated mates") ||
      s.includes("steamy") || s.includes("heat level") || s.includes("omegaverse") ||
      s.includes("reverse harem") || s.includes("why choose")) return "Romance";

  if (s.includes("drama") || s.includes("play") || s.includes("theatre") ||
      s.includes("theater") || s.includes("screenplay")) return "Drama";

  // --- Generic fiction last ---
  if (s.includes("fiction") || s.includes("literary fiction") || s.includes("literary") ||
      s.includes("novel") || s.includes("short stories") || s.includes("coming of age") ||
      s.includes("family") || s.includes("friendship") || s.includes("women's fiction")) return "Fiction";

  return null; // return null so caller can try another source before defaulting
}

const DEFAULT_ASSIGNMENTS = [
  { id: 1,  left: "28%", top: "8%",  genre: "Fantasy"            },
  { id: 2,  left: "68%", top: "10%", genre: "Mystery & Thriller" },
  { id: 3,  left: "38%", top: "28%", genre: "Sci-Fi"             },
  { id: 4,  left: "70%", top: "36%", genre: "Romance"            },
  { id: 5,  left: "36%", top: "52%", genre: "Self Help"          },
  { id: 6,  left: "68%", top: "53%", genre: "Dark Romance"       },
  { id: 7,  left: "66%", top: "68%", genre: "Fiction"            },
  { id: 8,  left: "40%", top: "18%", genre: "Historical Fiction" },
  { id: 9,  left: "60%", top: "20%", genre: "Cookbooks"          },
  { id: 10, left: "34%", top: "40%", genre: "Drama"                   },
  { id: 11, left: "51%", top: "32%", genre: "True Crime"              },
  { id: 12, left: "44%", top: "55%", genre: "Gardening & Landscaping" },
  { id: 13, left: "55%", top: "45%", genre: "Classics" },
];

const library = {
  Fantasy: [
    { title: "The Hobbit",           author: "J.R.R. Tolkien",        type: "ebooks",      isbn: "9780547928227", description: "Bilbo Baggins, a comfort-loving hobbit, is swept into an epic quest to reclaim the dwarf kingdom of Erebor from the dragon Smaug. Along the way he encounters trolls, elves, goblins, and a curious creature named Gollum who possesses a very special ring. This beloved classic laid the foundation for Tolkien's entire Middle-earth mythology." },
    { title: "Mistborn",             author: "Brandon Sanderson",      type: "audiobooks",  isbn: "9780765311788", description: "In a world shrouded in ash and mist, a young street thief named Vin discovers she has the rare magical ability to \"burn\" metals and gain extraordinary powers. She joins a crew of rebels plotting to overthrow the seemingly immortal Lord Ruler in a heist a thousand years in the making. Sanderson's intricate magic system and political intrigue make this a standout in epic fantasy." },
    { title: "The Name of the Wind", author: "Patrick Rothfuss",       type: "ebooks",      isbn: "9780756404741", description: "Kvothe, once the most feared wizard in the world, tells the true story of his life to a chronicler in a quiet inn. From his origins as a child performer with a traveling troupe to his years as a student at the legendary University, his tale is one of love, loss, and relentless pursuit of knowledge. Rothfuss's lyrical prose transforms this into something closer to legend than mere fantasy." },
    { title: "A Wizard of Earthsea", author: "Ursula K. Le Guin",      type: "ebooks",      isbn: "9780547773742", description: "On the archipelago world of Earthsea, a gifted but arrogant young boy named Ged earns a place at a school for wizards and accidentally unleashes a terrible shadow creature upon the world. His journey to confront and defeat it becomes a profound story about identity, hubris, and self-acceptance. Le Guin's slim novel is a masterwork of world-building and moral depth." },
    { title: "The Way of Kings",     author: "Brandon Sanderson",      type: "audiobooks",  isbn: "9780765326355", description: "On the storm-swept world of Roshar, a war has raged for years over the death of a king, drawing together a reluctant soldier, a brilliant scholar, and a disgraced prince. Sanderson unveils a vast, meticulously crafted world filled with ancient mysteries, powerful magical armor, and forces that could destroy civilization itself. This is the ambitious first book of the ten-volume Stormlight Archive." },
    { title: "Eragon",               author: "Christopher Paolini",    type: "ebooks",      isbn: "9780375826696", description: "A farm boy named Eragon discovers a polished blue stone in the mountains that turns out to be a dragon egg, and the hatchling bonds with him, changing his destiny forever. Thrust into a world of ancient magic and a brutal empire, he must learn to harness his new powers and join the rebellion. Written by a teenage author, this debut launched the beloved Inheritance Cycle." },
  ],
  "Mystery & Thriller": [
    { title: "Sherlock Holmes",                   author: "Arthur Conan Doyle",  type: "ebooks",      isbn: "9780743273565", description: "The complete adventures of the world's greatest consulting detective, Sherlock Holmes, and his faithful companion Dr. John Watson. Using razor-sharp deduction and an encyclopedic knowledge of crime, Holmes unravels cases that baffle Scotland Yard across Victorian London and beyond. These stories defined the detective fiction genre and made Holmes one of literature's most iconic characters." },
    { title: "Gone Girl",                         author: "Gillian Flynn",        type: "audiobooks",  isbn: "9780307588371", description: "On their fifth wedding anniversary, Amy Dunne goes missing and all evidence points to her husband Nick as the prime suspect. As the investigation unfolds through alternating diary entries and present-day narration, shocking secrets about both characters are revealed. Flynn's psychological thriller is a searing, subversive look at marriage, media, and the stories we tell about ourselves." },
    { title: "The Girl on the Train",             author: "Paula Hawkins",        type: "ebooks",      isbn: "9781594634024", description: "Rachel takes the same commuter train every day and becomes fixated on a seemingly perfect couple she watches from the window — until the woman goes missing and Rachel finds herself entangled in the investigation. Told from three unreliable female perspectives, the novel slowly strips away illusions about domestic life and hidden violence. It became a global phenomenon for its twisty, compulsive plotting." },
    { title: "Big Little Lies",                   author: "Liane Moriarty",       type: "audiobooks",  isbn: "9780399167065", description: "Three women — Madeline, Celeste, and Jane — form an unlikely friendship at their children's school on Australia's Bondi coast, their lives intersecting around a crime that will be revealed at the school's trivia night. Moriarty weaves together dark themes of domestic abuse, bullying, and class tension with sharp wit and compassion. This clever novel became the basis for the acclaimed HBO miniseries." },
    { title: "In the Woods",                      author: "Tana French",          type: "ebooks",      isbn: "9780143113492", description: "Dublin detective Rob Ryan is called to investigate the murder of a young girl found in an ancient wood — the same wood where he was found as a child, the sole survivor of an unexplained incident that erased his memories. As he and his partner Cassie Maddox dig deeper, the past begins to reassert itself dangerously. French's literary debut is a haunting exploration of memory, loss, and the limits of justice." },
    { title: "The Silent Patient",                author: "Alex Michaelides",     type: "ebooks",      isbn: "9781250301697", description: "Alicia Berenson, a famous painter, shoots her husband five times and then never speaks another word. Criminal psychotherapist Theo Faber becomes obsessed with uncovering the motive behind her silence, and takes a job at the secure psychiatric unit where she is held. The novel builds to a stunning twist that recontextualizes everything that came before." },
    { title: "The Girl with the Dragon Tattoo",   author: "Stieg Larsson",        type: "ebooks",      isbn: "9780307454546", description: "Journalist Mikael Blomkvist and hacker Lisbeth Salander are hired by a wealthy industrialist to investigate the decades-old disappearance of his granddaughter, uncovering a dark web of family secrets and serial murder. Larsson's novel is a gripping procedural wrapped in a fierce critique of violence against women in Swedish society. It launched a global phenomenon and introduced one of crime fiction's most unforgettable heroines." },
    { title: "No Country for Old Men",            author: "Cormac McCarthy",      type: "audiobooks",  isbn: "9780307387899", description: "In 1980 West Texas, a welder named Llewelyn Moss stumbles upon the aftermath of a drug deal gone wrong and takes the money — setting a relentless, emotionless killer named Anton Chigurh on his trail. Sheriff Bell, aging and world-weary, pursues both men while reflecting on a world that seems to have left his values behind. McCarthy's lean, violent novel is a philosophical meditation on fate, evil, and mortality." },
    { title: "The Da Vinci Code",                 author: "Dan Brown",            type: "ebooks",      isbn: "9780307474278", description: "Harvard symbologist Robert Langdon is called to the Louvre where a curator has been murdered, leaving behind a series of cryptic clues pointing to a secret society and a conspiracy that could shake the foundations of Christianity. Racing across Europe with cryptologist Sophie Neveu, Langdon must decode symbols hidden in the works of Leonardo da Vinci. Brown's page-turning thriller became one of the best-selling novels in history." },
    { title: "I Am Pilgrim",                      author: "Terry Hayes",          type: "ebooks",      isbn: "9781476717494", description: "A retired American intelligence agent known only as Pilgrim is pulled out of anonymity to track a ghost — a faceless man who has found a way to manufacture a weaponized plague with the potential to kill millions. Spanning continents and decades of espionage tradecraft, Hayes's debut is a masterclass in sustained tension. This modern thriller has earned comparisons to the best of John le Carré." },
    { title: "The Firm",                          author: "John Grisham",         type: "ebooks",      isbn: "9780385319058", description: "Mitch McDeere, a brilliant Harvard Law graduate, joins a small but lucrative Memphis law firm only to discover it is under FBI investigation for its ties to the mob. Trapped between the Mafia and federal agents who each want something from him, Mitch must use every ounce of his intelligence to stay alive and free. Grisham's breakthrough legal thriller is a masterwork of claustrophobic, escalating dread." },
  ],
  "Sci-Fi": [
    { title: "Dune",              author: "Frank Herbert",        type: "ebooks",      isbn: "9780441013593", description: "On the desert planet Arrakis, the only source of the universe's most valuable substance — the spice melange — young Paul Atreides finds himself at the center of a power struggle between noble houses, religious prophecy, and the indigenous Fremen people. Herbert's monumental novel explores ecology, politics, religion, and human potential on an operatic scale. It remains the best-selling science fiction novel of all time." },
    { title: "Neuromancer",       author: "William Gibson",       type: "audiobooks",  isbn: "9780441569595", description: "Case, a washed-up computer hacker living in a dystopian Chiba City underworld, is hired by a mysterious employer to pull off the ultimate hack in cyberspace. Gibson's debut novel invented the aesthetic of cyberpunk and coined the word \"cyberspace,\" predicting the internet age with eerie accuracy. This razor-sharp, neon-lit thriller won the Hugo, Nebula, and Philip K. Dick awards." },
    { title: "The Martian",       author: "Andy Weir",            type: "ebooks",      isbn: "9780553418026", description: "Astronaut Mark Watney is stranded alone on Mars after being left for dead by his crew during an emergency evacuation, with limited food and no way to signal Earth. Using science, ingenuity, and an unbeatable sense of humor, he must figure out how to survive for years until a rescue mission can possibly reach him. Weir's meticulously researched novel is a triumph of optimism and problem-solving." },
    { title: "Ender's Game",      author: "Orson Scott Card",     type: "audiobooks",  isbn: "9780812550702", description: "In a future where Earth has been attacked by insectoid aliens, the military recruits the most gifted children to a Battle School in space to train the next great commander. Young Ender Wiggin, a tactical genius, rises through simulated battle after battle, never knowing how much the stakes will ultimately cost him. This Hugo and Nebula Award winner raises profound questions about war, childhood, and moral responsibility." },
    { title: "Foundation",        author: "Isaac Asimov",         type: "ebooks",      isbn: "9780553293357", description: "Mathematician Hari Seldon predicts using \"psychohistory\" that the Galactic Empire will fall, plunging humanity into 30,000 years of barbarism — unless a Foundation is established to preserve knowledge and shorten the dark age to a single millennium. Asimov's sweeping saga spans centuries of a future civilization's collapse and rebirth. This cornerstone of science fiction influenced generations of writers and thinkers." },
    { title: "Project Hail Mary", author: "Andy Weir",            type: "ebooks",      isbn: "9780593135204", description: "Ryland Grace wakes up alone on a spaceship with no memory of how he got there or what his mission is, only to piece together that he is Earth's last hope against an extinction-level threat to the sun. His only ally is an unlikely friend he discovers millions of miles from home. Weir delivers his most inventive and emotionally resonant novel yet, full of scientific problem-solving and genuine heart." },
  ],
  Romance: [
    { title: "Pride and Prejudice", author: "Jane Austen",        type: "ebooks",      isbn: "9780141439518", description: "When the Bennet family's five daughters must marry well to secure their future, the spirited Elizabeth Bennet meets the proud and wealthy Mr. Darcy and takes an instant dislike to him. Austen's masterpiece of wit and social observation follows their slow, reluctant path from mutual contempt to deep love. More than two centuries later, it remains the definitive romantic novel in the English language." },
    { title: "Outlander",           author: "Diana Gabaldon",     type: "audiobooks",  isbn: "9780440212560", description: "In 1945, British combat nurse Claire Randall is transported back in time to 18th-century Scotland, where she is caught between her life in the present and a passionate bond with Highland warrior Jamie Fraser. Gabaldon's sweeping historical romance blends adventure, time travel, and one of fiction's most enduring love stories. This first novel launched an eight-book series beloved worldwide." },
    { title: "The Notebook",        author: "Nicholas Sparks",    type: "ebooks",      isbn: "9780446676090", description: "In a nursing home, an old man reads to a woman with memory loss from a faded notebook, telling the story of a young couple — Allie and Noah — who fell in love one summer in the 1940s and were separated by class and circumstance. Sparks's debut novel is a tender meditation on enduring love and the way memory shapes us. Its film adaptation became one of the most iconic romantic movies ever made." },
    { title: "Me Before You",       author: "Jojo Moyes",         type: "audiobooks",  isbn: "9780143124542", description: "Louisa Clark, a quirky small-town girl, takes a job caring for Will Traynor, a wealthy, sardonic man paralyzed after an accident who has given up on life. As their unlikely friendship deepens into something more, Louisa is determined to show Will that life is worth living — but Will has already made an irreversible decision. Moyes's novel is a profoundly moving exploration of autonomy, love, and sacrifice." },
    { title: "It Ends with Us",     author: "Colleen Hoover",     type: "ebooks",      isbn: "9781501110368", description: "Lily Bloom moves to Boston, starts her dream business, and falls for the charming neurosurgeon Ryle Kincaid — a man who doesn't believe in love. But when she reconnects with her first love Atlas, long-buried secrets about her past and the cycle of abuse that shaped her begin to surface. Hoover's novel is a fearless, deeply emotional story about the hardest kind of love and the courage it takes to break free." },
    { title: "The Hating Game",     author: "Sally Thorne",       type: "ebooks",      isbn: "9780062439598", description: "Lucy Hutton and Joshua Templeman share an office and an epic mutual loathing — or so Lucy thinks — as they compete for the same promotion at a publishing company born from a merger. The witty, tension-filled banter between these two rivals gradually reveals something entirely different beneath the surface. Thorne's debut is a sparkling, laugh-out-loud enemies-to-lovers romance." },
  ],
  "Self Help": [
    { title: "Atomic Habits",      author: "James Clear",        type: "ebooks",      isbn: "9780735211292", description: "James Clear presents a practical framework for building good habits and breaking bad ones, arguing that tiny, 1% improvements compound over time into remarkable results. Drawing on biology, psychology, and neuroscience, he shows how the environment, identity, and small cues shape nearly all human behavior. This is one of the most actionable and widely read books on personal change published in recent years." },
    { title: "The Power of Now",   author: "Eckhart Tolle",      type: "audiobooks",  isbn: "9781577314806", description: "Eckhart Tolle argues that the root of most human suffering is our identification with the thinking mind and our inability to live in the present moment. Drawing on diverse spiritual traditions without belonging to any one of them, he offers a practical guide to achieving a state of alert, conscious presence. This transformative book has sold millions of copies and is considered a modern spiritual classic." },
    { title: "Think and Grow Rich",author: "Napoleon Hill",      type: "ebooks",      isbn: "9781585424337", description: "Based on over twenty years of research into the habits of America's most successful people, Napoleon Hill distills their philosophies into thirteen principles for achieving wealth and success. The book argues that a burning desire, faith, and a definite plan are the first steps toward any great achievement. Published in 1937, it remains one of the best-selling self-help books of all time." },
    { title: "The 7 Habits",       author: "Stephen Covey",      type: "audiobooks",  isbn: "9781982137274", description: "Stephen Covey presents seven interconnected habits — from being proactive and beginning with the end in mind to sharpening the saw — that he argues are the foundation of personal and professional effectiveness. Moving beyond personality-based success tips, Covey grounds his framework in timeless principles of character and integrity. This landmark book transformed how millions of people think about leadership and daily life." },
    { title: "Untamed",            author: "Glennon Doyle",      type: "ebooks",      isbn: "9781984801258", description: "Glennon Doyle recounts the moment she decided to stop living the life she was supposed to live — as a faithful wife, devoted mother, and successful author — and start listening to the voice inside her that said there was something more. Her memoir is a fierce call to women to stop being \"good\" and start being free, to reclaim their wildness and trust their own knowing. It became a phenomenon, spending years on the bestseller list." },
    { title: "You Are a Badass",   author: "Jen Sincero",        type: "ebooks",      isbn: "9780762447695", description: "Jen Sincero blends irreverent humor with sharp insight to help readers identify and overcome the self-sabotaging beliefs that keep them from the lives they want. Using personal anecdotes and practical exercises, she guides readers toward embracing their inner greatness and taking decisive action. This refreshingly no-nonsense book has empowered millions to stop making excuses and start living boldly." },
  ],
  "Dark Romance": [
    { title: "Haunting Adeline",    author: "H.D. Carlton",       type: "ebooks",      isbn: "9781957635026", description: "Adeline inherits her great-grandmother's Victorian mansion and soon realizes she is being watched — and then hunted — by a shadowy, obsessive stalker who believes she belongs to him. Carlton's dark romance pushes every boundary, exploring a deeply twisted dynamic between predator and prey that is as disturbing as it is compulsive. This is not for the faint of heart, but it has amassed a devoted and passionate readership." },
    { title: "Corrupt",             author: "Penelope Douglas",   type: "audiobooks",  isbn: "9781682305546", description: "Three years after Erika Fane's testimony helped send Michael Crist to prison, he returns on Devil's Night with his friends to make her pay for what she did. But as revenge unfolds in the shadows of Halloween, the lines between hatred and obsession blur dangerously. Douglas's hallmark is high-intensity emotional conflict, and Corrupt delivers it with dark, brooding atmosphere and relentless tension." },
    { title: "Twisted Love",        author: "Ana Huang",          type: "ebooks",      isbn: "9781728269382", description: "Alex Volkov is cold, ruthless, and off-limits — the overprotective best friend's guardian who has promised to look out for sunny, warm-hearted Ava Chen while her brother is abroad. What starts as reluctant proximity becomes something neither of them can control, dragged down by Alex's dangerous past and the secrets he is keeping. Huang's debut in the Twisted series launched a reader frenzy for its tortured anti-hero and slow-burn tension." },
    { title: "Credence",            author: "Penelope Douglas",   type: "audiobooks",  isbn: "9781682308004", description: "After the deaths of her parents, Tiernan de Haas is sent to live with her estranged uncle and his two sons in a remote mountain cabin, completely cut off from the world. What begins as cold indifference from all three men transforms into something primal and consuming. Douglas's most controversial and polarizing novel, Credence challenges every rule of romance with its isolated, claustrophobic intensity." },
    { title: "Terms and Conditions",author: "Lauren Asher",       type: "ebooks",      isbn: "9781728249919", description: "Declan Kane needs a wife on paper to secure his family's company, and his assistant Iris is the logical — and convenient — choice for a fake marriage. But the terms of their arrangement become blurred as proximity and shared secrets chip away at Declan's carefully constructed walls. Asher's slow-burn office romance is filled with delicious tension and a deeply wounded hero learning what it means to truly let someone in." },
    { title: "Vicious",             author: "L.J. Shen",          type: "ebooks",      isbn: "9781250107466", description: "Baron \"Vicious\" Spencer has hated Emilia Clarke since they were teenagers, and she has never understood why — only that his cruelty has followed her like a shadow for years. When fate forces them back together as adults, the hatred between them ignites into something far more dangerous. Shen's Sinners of Saint series opens with this sharp, emotionally intense enemies-to-lovers story drenched in wealth, power, and dark desire." },
  ],
  Fiction: [
    { title: "To Kill a Mockingbird", author: "Harper Lee",        type: "ebooks",     isbn: "9780061935466", description: "Through the eyes of young Scout Finch, Harper Lee's Pulitzer Prize-winning novel explores racial injustice and moral growth in the American South during the 1930s. Her father, lawyer Atticus Finch, defends a Black man accused of a crime he didn't commit, and the trial shakes their small Alabama town to its core. A timeless story of compassion, courage, and the loss of innocence." },
    { title: "The Great Gatsby",      author: "F. Scott Fitzgerald", type: "ebooks",   isbn: "9780743273565", description: "Narrated by the observant Nick Carraway, this Jazz Age masterpiece follows the mysterious millionaire Jay Gatsby and his obsessive pursuit of the beautiful Daisy Buchanan across the glittering, hollow world of Long Island's elite. Fitzgerald's lyrical prose captures the intoxicating promise and crushing disillusionment of the American Dream. A perfect, devastating novel that has never gone out of style." },
    { title: "Normal People",         author: "Sally Rooney",       type: "ebooks",     isbn: "9781984822178", description: "Connell and Marianne grow up in the same small Irish town but move in completely different social circles — until a connection forms that will follow them from secondary school to Trinity College Dublin and beyond. Rooney's spare, precise prose dissects the push and pull of their complicated relationship with remarkable emotional intelligence. A novel about power, class, and the transformative nature of young love." },
    { title: "Conversations with Friends", author: "Sally Rooney", type: "audiobooks", isbn: "9780571333134", description: "Frances is a cool, cerebral Dublin college student who performs spoken word poetry with her ex-girlfriend Bobbi. When they befriend an older married couple — actor Melissa and her husband Nick — Frances finds herself drawn into an affair that will quietly upend her carefully constructed sense of self. Rooney's debut announced a major literary talent with an exacting eye for the emotional textures of contemporary life." },
  ],
  "Historical Fiction": [
    { title: "The Pillars of the Earth", author: "Ken Follett",      type: "ebooks",    isbn: "9780451166890", description: "Set in 12th-century England, this sweeping epic follows the building of a cathedral in the fictional town of Kingsbridge over decades of political intrigue, religious conflict, and personal ambition. Follett populates his medieval world with an unforgettable cast of builders, monks, noble women, and villains across generations. An enormous, addictive novel that makes history breathe." },
    { title: "All the Light We Cannot See", author: "Anthony Doerr", type: "ebooks",   isbn: "9781476746586", description: "A blind French girl and a German boy's paths converge in occupied France during World War II in this Pulitzer Prize-winning novel of extraordinary beauty. Doerr alternates between their stories across time — her escape from Paris, his recruitment into the Nazi war machine — until their inevitable meeting in a besieged coastal town. A luminous meditation on fate, war, and the persistence of goodness." },
    { title: "The Bronze Horseman",   author: "Paullina Simons",    type: "audiobooks", isbn: "9780060956356", description: "In Leningrad in the summer of 1941, eighteen-year-old Tatiana meets a young soldier named Alexander on the day the Nazis invade the Soviet Union. What follows is a devastating love story played out against the Siege of Leningrad — one of history's most brutal — spanning years of war, starvation, and impossible choices. A monumental, heartbreaking romance that readers carry with them forever." },
    { title: "The Nightingale",       author: "Kristin Hannah",     type: "ebooks",     isbn: "9780312577223", description: "Two sisters in Nazi-occupied France choose very different paths of survival and resistance during World War II — one enduring hardship at home, the other joining the French Resistance. Hannah's emotionally shattering novel honors the often-unacknowledged courage of women in wartime. A story of sacrifice, love, and the unbreakable bond between sisters." },
  ],
  Cookbooks: [
    { title: "Salt, Fat, Acid, Heat", author: "Samin Nosrat",       type: "ebooks",     isbn: "9781476753836", description: "Rather than a collection of recipes, this James Beard Award-winning book teaches the fundamental elements that make food delicious — salt, fat, acid, and heat — giving home cooks the instinct to improvise confidently. Nosrat's warm, inviting voice and Wendy MacNaughton's gorgeous illustrations make this as pleasurable to read as it is useful to cook from. It will permanently change the way you think about food." },
    { title: "Jerusalem",             author: "Yotam Ottolenghi",   type: "ebooks",     isbn: "9781607743941", description: "A celebration of the food of Jerusalem from two chefs — one Israeli, one Palestinian — who grew up on opposite sides of a divided city. The book explores the Middle Eastern flavors, spices, and dishes that both communities share, weaving personal history into vibrant recipes. Ottolenghi's influence on modern cooking is immeasurable, and Jerusalem is the book that started it all." },
    { title: "Plenty",                author: "Yotam Ottolenghi",   type: "ebooks",     isbn: "9781452101248", description: "A groundbreaking vegetable-forward cookbook from Yotam Ottolenghi that inspired a generation of cooks to put vegetables at the center of the plate. The recipes are bold, colorful, and full of Middle Eastern and Mediterranean flavors — dishes like charred eggplant with pomegranate and spiced cauliflower cake. Even committed meat-eaters find themselves cooking through this book obsessively." },
    { title: "The Joy of Cooking",    author: "Irma S. Rombauer",   type: "audiobooks", isbn: "9780743246262", description: "First published in 1931, this enduring American classic has taught generations of home cooks everything from roasting a chicken to baking a layer cake, written in a warm, conversational voice that feels like advice from a brilliant friend. The most comprehensive general cookbook ever written, it covers thousands of recipes and techniques and has been updated through the decades while retaining its essential character." },
  ],
  Drama: [
    { title: "Hamlet",                author: "William Shakespeare", type: "ebooks",    isbn: "9780743477123", description: "Prince Hamlet of Denmark is visited by his father's ghost, who reveals he was murdered by Hamlet's uncle Claudius — now king and married to Hamlet's mother. What follows is Shakespeare's most profound exploration of grief, moral corruption, and the paralyzing nature of thought versus action. The most performed and analyzed play in the English language, and arguably the greatest work of literature ever written." },
    { title: "A Streetcar Named Desire", author: "Tennessee Williams", type: "ebooks", isbn: "9780811216029", description: "Blanche DuBois arrives at her sister Stella's cramped New Orleans apartment, seeking refuge from a ruined past, and immediately clashes with Stella's brutish, magnetic husband Stanley Kowalski. Williams's Pulitzer Prize-winning play is a masterwork of simmering tension, desire, and self-delusion — a Southern Gothic tragedy that burns with heat and heartbreak. Brando's Stanley became one of cinema's defining performances." },
    { title: "Death of a Salesman",   author: "Arthur Miller",      type: "ebooks",     isbn: "9780140481341", description: "Willy Loman, an aging, delusional traveling salesman, faces the collapse of his career and his carefully constructed illusions about success and the American Dream as his sons' lives also unravel. Miller's Pulitzer Prize-winning tragedy is one of the defining American plays — a searing, compassionate portrait of a man destroyed by his own myths. It has lost none of its power or relevance." },
    { title: "The Glass Menagerie",   author: "Tennessee Williams", type: "audiobooks", isbn: "9780811214049", description: "Tom Wingfield narrates this memory play about his fragile, dream-haunted family in 1930s St. Louis — his domineering mother Amanda, who clings to faded Southern gentility, and his painfully shy sister Laura, who retreats into her collection of glass animals. Williams's first major success established the poetic, emotionally resonant style that would define his career. A heartbreaking, beautiful elegy for lost time and broken dreams." },
  ],
  "True Crime": [
    { title: "In Cold Blood",              author: "Truman Capote",       type: "ebooks",      isbn: "9780679745587", description: "In November 1959, four members of the Clutter family were murdered in their farmhouse in rural Kansas. Truman Capote spent years interviewing townspeople, investigators, and the killers themselves to reconstruct the crime in extraordinary detail. The result invented the true crime genre as we know it — a work of devastating literary journalism that remains one of the most gripping and haunting books ever written." },
    { title: "Helter Skelter",             author: "Vincent Bugliosi",    type: "ebooks",      isbn: "9780393084245", description: "Written by the prosecutor who convicted Charles Manson, this is the definitive account of the Tate-LaBianca murders and the investigation that followed. Bugliosi takes readers inside the Manson Family, the LAPD investigation, and the courtroom drama of the trial. The best-selling true crime book in publishing history, it remains the most thorough account of one of America's most terrifying crimes." },
    { title: "The Devil in the White City", author: "Erik Larson",        type: "audiobooks",  isbn: "9780375725609", description: "Set against the 1893 World's Fair in Chicago, Larson weaves together two parallel stories — the architect Daniel Burnham's race to build the magnificent fairgrounds and the chilling crimes of Dr. H.H. Holmes, America's first documented serial killer, who used the fair to lure victims to his purpose-built 'murder castle.' A masterpiece of narrative nonfiction that reads like a thriller." },
    { title: "I'll Be Gone in the Dark",   author: "Michelle McNamara",   type: "ebooks",      isbn: "9780062319845", description: "Amateur investigator and writer Michelle McNamara spent years obsessively tracking the East Area Rapist, a serial predator who terrorized California in the 1970s and 80s. Her book — completed posthumously after her death in 2016 — is both a gripping true crime investigation and a profound personal memoir about obsession, fear, and justice. The Golden State Killer was arrested in 2018, in part due to renewed attention from this book." },
    { title: "Mindhunter",                 author: "John Douglas",        type: "audiobooks",  isbn: "9780671013400", description: "John Douglas, the FBI's legendary criminal profiling pioneer, takes readers inside some of the most disturbing criminal minds of the 20th century. He developed the science of criminal profiling by interviewing serial killers including Charles Manson, Ted Bundy, and Jeffrey Dahmer, and used those insights to help solve hundreds of cases. The basis for the hit Netflix series, this is essential reading for anyone fascinated by criminal psychology." },
    { title: "Say Nothing",               author: "Patrick Radden Keefe", type: "ebooks",      isbn: "9780307279286", description: "The 1972 abduction and murder of Jean McConville, a widowed Belfast mother of ten, opens this sweeping account of the Troubles in Northern Ireland. Keefe traces the lives of IRA members — including the charismatic Price sisters and commander Brendan Hughes — whose idealism curdled into something darker. A profound meditation on political violence, memory, and the impossibility of forgetting." },
  ],
  "Gardening & Landscaping": [
    { title: "The Well-Tempered Garden",   author: "Christopher Lloyd",   type: "ebooks",      isbn: "9780812977561", description: "One of the most beloved and opinionated gardening books ever written, Christopher Lloyd's masterwork covers everything from soil preparation to plant combinations with wit, authority, and deep personal passion. His garden at Great Dixter in East Sussex was his living laboratory, and he shares its lessons with the enthusiasm of a true obsessive. Essential reading for anyone serious about creating a beautiful, dynamic garden." },
    { title: "Planting: A New Perspective", author: "Piet Oudolf",        type: "ebooks",      isbn: "9781604693706", description: "The world's most influential garden designer shares his philosophy of naturalistic planting — creating gardens that move through the seasons with grace and work in harmony with ecology rather than against it. Oudolf's approach, seen in the High Line in New York and countless public gardens worldwide, has transformed how we think about designed landscapes. Stunning photography makes this as beautiful as it is instructive." },
    { title: "The Secret Garden",          author: "Frances Hodgson Burnett", type: "ebooks",  isbn: "9780142437056", description: "After being sent to live on the Yorkshire moors, lonely and contrary Mary Lennox discovers a walled garden that has been locked and neglected for years. As she works to restore it with the help of local boy Dickon, the garden becomes a place of healing — for Mary, for her sickly cousin Colin, and for her grieving guardian. This beloved classic beautifully captures the transformative power of tending growing things." },
    { title: "Braiding Sweetgrass",        author: "Robin Wall Kimmerer",  type: "audiobooks", isbn: "9781571313560", description: "Botanist and member of the Citizen Potawatomi Nation Robin Wall Kimmerer weaves together Native plant knowledge and Western scientific understanding in a profound meditation on the relationship between humans and the plant world. Each chapter — centered on a different plant — unfolds as both scientific exploration and spiritual reflection. This extraordinary book has inspired a generation of gardeners, ecologists, and nature lovers." },
    { title: "The Dry Garden",             author: "Beth Chatto",          type: "ebooks",     isbn: "9780460044936", description: "Beth Chatto transformed a patch of East Anglian wasteland into one of England's most celebrated gardens using only plants suited to dry, poor conditions — and this book tells how she did it. Her philosophy of 'right plant, right place' has influenced countless gardeners and transformed how we think about sustainable planting. An inspiring and deeply practical guide to gardening with, rather than against, your conditions." },
    { title: "Landscapes of the Spirit",   author: "Martin Hylton Thomas",  type: "ebooks",    isbn: "9781604694031", description: "A comprehensive guide to designing outdoor spaces that feel both beautiful and purposeful, blending principles of landscape architecture with accessible advice for home gardeners. Covers everything from site analysis and plant selection to hardscaping, water features, and seasonal interest. A practical and inspiring resource for anyone looking to transform their outdoor space into a true extension of the home." },
  ],
};

// Worn aged leather colors — muted, faded, distressed
const SPINE_COLORS = [
  { base: "#5c2a2a", mid: "#4a2020", dark: "#321515", text: "#c8a87a" }, // aged burgundy
  { base: "#2a3a52", mid: "#1e2e42", dark: "#141e2e", text: "#b8c8a0" }, // faded navy
  { base: "#2a3e28", mid: "#1e3018", dark: "#142010", text: "#c0b878" }, // worn forest green
  { base: "#4a3218", mid: "#3a2410", dark: "#28180a", text: "#c8b07a" }, // cracked brown
  { base: "#3a2848", mid: "#2c1e38", dark: "#1c1228", text: "#b8a8c8" }, // dusty purple
  { base: "#1e3838", mid: "#162c2c", dark: "#0e1e1e", text: "#a8c0b8" }, // tarnished teal
  { base: "#503018", mid: "#3c2210", dark: "#28140a", text: "#c8a868" }, // tobacco brown
  { base: "#3a2240", mid: "#2c1830", dark: "#1c1020", text: "#c0a8c0" }, // faded plum
];

function BookSpine({ book, index, rowIndex, onClick, spineWidth }) {
  const c = SPINE_COLORS[(rowIndex * 6 + index) % SPINE_COLORS.length];
  const w = spineWidth || 58;
  const height = 180 + ((rowIndex * 6 + index) % 4) * 20;
  // Raised bands positions as % of height
  const bands = [12, 28, 72, 88];

  return (
    <div
      title={`${book.title} — ${book.author}`}
      onClick={() => onClick && onClick(book)}
      style={{
        width: w,
        height,
        borderRadius: "2px 3px 3px 2px",
        background: `linear-gradient(to right, ${c.dark} 0%, ${c.base} 15%, ${c.mid} 50%, ${c.base} 85%, ${c.dark} 100%)`,
        boxShadow: "4px 0 12px rgba(0,0,0,0.7), -1px 0 4px rgba(0,0,0,0.4), inset 3px 0 6px rgba(255,255,255,0.04)",
        position: "relative",
        cursor: "pointer",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Worn leather texture overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: `repeating-linear-gradient(
          175deg,
          transparent 0px, transparent 3px,
          rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px
        )`,
        pointerEvents: "none",
      }} />

      {/* Raised bands — horizontal ridges */}
      {bands.map((pct, i) => (
        <div key={i} style={{
          position: "absolute",
          top: `${pct}%`,
          left: 0, right: 0,
          height: 7,
          background: `linear-gradient(to bottom,
            rgba(0,0,0,0.35) 0%,
            ${c.base} 20%,
            rgba(255,255,255,0.08) 50%,
            ${c.mid} 80%,
            rgba(0,0,0,0.3) 100%)`,
          boxShadow: "0 1px 2px rgba(0,0,0,0.4), 0 -1px 1px rgba(0,0,0,0.3)",
          zIndex: 2,
        }} />
      ))}

      {/* Top corner flourish */}
      <div style={{
        position: "absolute", top: "14%", left: "50%",
        transform: "translateX(-50%)",
        color: c.text, fontSize: 9, opacity: 0.7,
        zIndex: 3, lineHeight: 1,
        textShadow: "0 0 3px rgba(0,0,0,0.5)",
      }}>❧</div>

      {/* Bottom corner flourish */}
      <div style={{
        position: "absolute", bottom: "10%", left: "50%",
        transform: "translateX(-50%) scaleY(-1)",
        color: c.text, fontSize: 9, opacity:0.7,
        zIndex: 3, lineHeight: 1,
      }}>❧</div>

      {/* Title */}
      <div style={{
        position: "absolute",
        top: "30%", bottom: "30%",
        left: 0, right: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3,
      }}>
        <div style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          color: c.text,
          fontFamily: '"Palatino Linotype", Palatino, serif',
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: "1px",
          textAlign: "center",
          textShadow: `0 0 8px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)`,
          lineHeight: 1.3,
          overflow: "hidden",
          maxHeight: "100%",
          opacity: 0.92,
        }}>
          {book.title}
        </div>
      </div>

      {/* Author — near bottom band */}
      <div style={{
        position: "absolute",
        bottom: "13%",
        left: 0, right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 3,
      }}>
        <div style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          color: c.text,
          fontFamily: '"Palatino Linotype", Palatino, serif',
          fontStyle: "italic",
          fontSize: 8,
          opacity: 0.65,
          textShadow: "0 1px 3px rgba(0,0,0,0.8)",
          overflow: "hidden",
          maxHeight: 60,
        }}>
          {book.author}
        </div>
      </div>

      {/* Spine binding edge */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, bottom: 0, width: 5,
        background: "linear-gradient(to right, rgba(0,0,0,0.4), rgba(255,255,255,0.04) 60%, transparent)",
        borderRadius: "2px 0 0 2px",
        pointerEvents: "none",
        zIndex: 4,
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

function BookCover({ isbn, coverUrl, title, style }) {
  const sources = [
    coverUrl,
    isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg` : null,
    isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-S.jpg` : null,
  ].filter(Boolean);
  const [srcIdx, setSrcIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed || sources.length === 0) return null;
  return (
    <img
      src={sources[srcIdx]}
      alt={title}
      onError={() => {
        if (srcIdx + 1 < sources.length) setSrcIdx(srcIdx + 1);
        else setFailed(true);
      }}
      style={style}
    />
  );
}

function CDCase({ book, index, rowIndex, onClick }) {
  const c = SPINE_COLORS[(rowIndex * 6 + index) % SPINE_COLORS.length];

  return (
    <div
      title={`${book.title} — ${book.author}`}
      onClick={() => onClick && onClick(book)}
      style={{
        width: 90,
        height: 90,
        position: "relative",
        flexShrink: 0,
        alignSelf: "flex-end",
        cursor: "pointer",
        borderRadius: 2,
        boxShadow: "3px 3px 10px rgba(0,0,0,0.6), -1px 0 3px rgba(0,0,0,0.3)",
        background: "#111",
      }}
    >
      {/* Outer jewel case shell */}
      <div style={{
        position: "absolute", inset: 0,
        borderRadius: 2,
        border: "2px solid #2a2a2a",
        background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)",
        zIndex: 4,
        pointerEvents: "none",
      }} />

      {/* Always show title/author on jewel case — cover is shown in the modal when clicked */}
      <div style={{
        width: "100%", height: "100%",
        background: `linear-gradient(145deg, ${c.dark} 0%, ${c.base} 40%, ${c.mid} 70%, ${c.dark} 100%)`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: 6, boxSizing: "border-box",
      }}>
        <div style={{ fontSize: 18, marginBottom: 4, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.8))" }}>🎧</div>
        <div style={{
          color: c.text, fontFamily: '"Palatino Linotype", Palatino, serif',
          fontWeight: 700, fontSize: 9, textAlign: "center",
          textShadow: "0 1px 3px rgba(0,0,0,0.9)", lineHeight: 1.3,
          overflow: "hidden", maxHeight: 42,
        }}>{book.title}</div>
        <div style={{
          color: c.text, fontFamily: "Georgia, serif",
          fontStyle: "italic", fontSize: 7, textAlign: "center",
          opacity: 0.7, marginTop: 3, overflow: "hidden", maxHeight: 18,
        }}>{book.author}</div>
      </div>

      {/* Spine strip on left edge */}
      <div style={{
        position: "absolute", top: 0, left: 0, bottom: 0, width: 8,
        background: "linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 100%)",
        borderRadius: "2px 0 0 2px",
        zIndex: 3, pointerEvents: "none",
      }} />

      {/* Gloss sheen */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "40%",
        background: "linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, transparent 100%)",
        borderRadius: "2px 2px 0 0",
        zIndex: 5, pointerEvents: "none",
      }} />
    </div>
  );
}

function DatePickerModal({ label, value, onSelect, onClose, themeAccent, themeBg, themeText }) {
  const initial = value ? new Date(value) : new Date();
  const [viewMonth, setViewMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [selected, setSelected] = useState(value ? new Date(value) : null);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const monthName = viewMonth.toLocaleString("default", { month: "long" });
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const isSameDay = (d1, d2) => d1 && d2 && d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  const isToday = (day) => isSameDay(today, new Date(year, month, day));
  const isSelected = (day) => selected && isSameDay(selected, new Date(year, month, day));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: themeBg || "#F8F1E4", border: "2px solid #8B5E3C", borderRadius: 14, padding: 20, width: 320, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
        {/* Header */}
        <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 15, color: themeText || "#3A2A1A", textAlign: "center", marginBottom: 14, fontWeight: 700 }}>
          {label}
        </div>
        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <button onClick={() => setViewMonth(new Date(year, month - 1, 1))}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: themeAccent || "#8B5E3C", padding: "0 8px" }}>‹</button>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 14, color: themeText || "#3A2A1A", fontWeight: 700 }}>{monthName} {year}</span>
          <button onClick={() => setViewMonth(new Date(year, month + 1, 1))}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: themeAccent || "#8B5E3C", padding: "0 8px" }}>›</button>
        </div>
        {/* Day labels */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
            <div key={d} style={{ textAlign: "center", fontFamily: "Georgia, serif", fontSize: 10, color: themeAccent || "#8B5E3C", fontWeight: 700, padding: "2px 0" }}>{d}</div>
          ))}
        </div>
        {/* Days grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
          {cells.map((day, i) => day === null ? <div key={`e-${i}`} /> : (
            <button key={day} onClick={() => setSelected(new Date(year, month, day))}
              style={{
                padding: "6px 0", borderRadius: 6, border: "none", cursor: "pointer", textAlign: "center",
                fontFamily: "Georgia, serif", fontSize: 12,
                background: isSelected(day) ? (themeAccent || "#8B5E3C") : isToday(day) ? "rgba(139,94,60,0.15)" : "transparent",
                color: isSelected(day) ? "#F8F1E4" : isToday(day) ? (themeAccent || "#8B5E3C") : (themeText || "#3A2A1A"),
                fontWeight: isToday(day) || isSelected(day) ? 700 : 400,
                outline: isToday(day) && !isSelected(day) ? `1px solid ${themeAccent || "#8B5E3C"}` : "none",
              }}>{day}</button>
          ))}
        </div>
        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: "8px 0", background: "transparent", border: "1px solid #8B5E3C", borderRadius: 8, cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 13, color: themeText || "#3A2A1A" }}>
            Cancel
          </button>
          {selected && (
            <button onClick={() => { onSelect(selected.toISOString()); onClose(); }}
              style={{ flex: 2, padding: "8px 0", background: themeAccent || "#8B5E3C", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 700, color: "#F8F1E4" }}>
              Set {selected.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BookModal({ book, onClose, favorites, setFavorites, statuses, setStatuses, progress, setProgress, mediaType, onBookEdited, onDelete }) {
  const ebookProgressMode = localStorage.getItem("sk_ebook_progress_mode") || "page";
  const audiobookProgressMode = localStorage.getItem("sk_audiobook_progress_mode") || "chapter";
  const progressMode = mediaType === "audiobooks" ? audiobookProgressMode : ebookProgressMode;
  const modalTheme = SK_THEMES[localStorage.getItem("sk_theme") || "cozy"] || SK_THEMES.cozy;
  const thAccent = modalTheme.accent;
  const [imgError, setImgError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showProgressPrompt, setShowProgressPrompt] = useState(false);
  const [promptPercent, setPromptPercent] = useState(null);
  const [rating, setRating] = useState(() => { try { return JSON.parse(localStorage.getItem("sk_ratings") || "{}")[isbn] || 0; } catch { return 0; } });
  const [spice, setSpice] = useState(() => { try { return JSON.parse(localStorage.getItem("sk_spice") || "{}")[isbn] || 0; } catch { return 0; } });
  const [notes, setNotes] = useState(() => { try { return JSON.parse(localStorage.getItem("sk_notes") || "{}")[isbn] || ""; } catch { return ""; } });
  const [hoverRating, setHoverRating] = useState(0);
  const [hoverSpice, setHoverSpice] = useState(0);
  const [lightsOut, setLightsOut] = useState(() => { try { return JSON.parse(localStorage.getItem("sk_lights_out") || "{}")[isbn] || 0; } catch { return 0; } });
  const [hoverLightsOut, setHoverLightsOut] = useState(0);
  const [cryFactor, setCryFactor] = useState(() => { try { return JSON.parse(localStorage.getItem("sk_cry_factor") || "{}")[isbn] || 0; } catch { return 0; } });
  const [hoverCry, setHoverCry] = useState(0);
  const [skullFactor, setSkullFactor] = useState(() => { try { return JSON.parse(localStorage.getItem("sk_skull_factor") || "{}")[isbn] || 0; } catch { return 0; } });
  const [hoverSkull, setHoverSkull] = useState(0);
  const [worldBuilding, setWorldBuilding] = useState(() => { try { return JSON.parse(localStorage.getItem("sk_world_building") || "{}")[isbn] || 0; } catch { return 0; } });
  const [hoverWorld, setHoverWorld] = useState(0);
  const [darkFactor, setDarkFactor] = useState(() => { try { return JSON.parse(localStorage.getItem("sk_dark_factor") || "{}")[isbn] || 0; } catch { return 0; } });
  const [hoverDark, setHoverDark] = useState(0);
  const isThriller = ["Mystery & Thriller", "Cozy Mystery"].includes(book.genre);
  const popupRef = useRef(null);
  const popupPollRef = useRef(null);
  const [editFields, setEditFields] = useState({ title: book.title, author: book.author || "", description: book.description || "", genre: book.genre || "Fiction", coverUrl: book.coverUrl || "", mediaType: book.mediaType || "ebook" });
  const [dates, setDates] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`sk_dates_${mediaType}`)) || {}; } catch { return {}; }
  });
  const [datePickerOpen, setDatePickerOpen] = useState(null); // "start" | "end" | null

  // --- Timer state ---
  const timerKey = `sk_active_timer_${mediaType}`;
  const sessionsKey = `sk_sessions_${mediaType}`;
  const pagesKey = `sk_pages_${mediaType}`;
  const isbn = book.isbn || book.title;

  const [activeTimer, setActiveTimer] = useState(() => {
    try { return JSON.parse(localStorage.getItem(timerKey)) || null; } catch { return null; }
  });
  const [elapsed, setElapsed] = useState(0);
  const [currentPage, setCurrentPage] = useState(() => {
    try { return JSON.parse(localStorage.getItem(pagesKey) || "{}")[isbn] || ""; } catch { return ""; }
  });
  const [currentChapter, setCurrentChapter] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`sk_chapters_ebooks`) || "{}")[isbn] || ""; } catch { return ""; }
  });
  const [sessionSaved, setSessionSaved] = useState(false);

  const isTimerActive = activeTimer?.isbn === isbn;

  // Tick the elapsed timer every second
  useEffect(() => {
    if (!isTimerActive) return;
    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - activeTimer.startTime) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [isTimerActive, activeTimer]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
  };

  const startTimer = () => {
    const timer = { isbn, title: book.title, startTime: Date.now() };
    localStorage.setItem(timerKey, JSON.stringify(timer));
    setActiveTimer(timer);
    setElapsed(0);
    setSessionSaved(false);
    // Auto-mark as reading if unstarted or want-to-read
    const currentStatus = statuses[isbn];
    if (!currentStatus || currentStatus === "want-to-read") {
      handleStatus("reading");
    }
  };

  const stopTimer = () => {
    if (!isTimerActive) return;
    const minutes = Math.max(1, Math.round(elapsed / 60));
    const session = {
      isbn,
      title: book.title,
      date: new Date().toISOString(),
      minutes,
      pages: mediaType === "ebooks" ? (currentPage ? parseInt(currentPage) || 0 : 0) : 0,
      chapters: mediaType === "audiobooks" ? (currentPage ? parseInt(currentPage) || 0 : 0) : (currentChapter ? parseInt(currentChapter) || 0 : 0),
    };
    const sessions = (() => { try { return JSON.parse(localStorage.getItem(sessionsKey) || "[]"); } catch { return []; } })();
    sessions.unshift(session);
    localStorage.setItem(sessionsKey, JSON.stringify(sessions));

    // Lifetime counters — only ever increment, never reset
    const ltMinKey = `sk_lifetime_minutes_${mediaType}`;
    const prevMin = parseInt(localStorage.getItem(ltMinKey) || "0");
    localStorage.setItem(ltMinKey, String(prevMin + minutes));
    if (mediaType === "ebooks" && session.pages > 0) {
      const ltPgKey = "sk_lifetime_pages";
      localStorage.setItem(ltPgKey, String(parseInt(localStorage.getItem(ltPgKey) || "0") + session.pages));
    }
    if (mediaType === "ebooks" && session.chapters > 0) {
      const ltChEKey = "sk_lifetime_chapters_ebooks";
      localStorage.setItem(ltChEKey, String(parseInt(localStorage.getItem(ltChEKey) || "0") + session.chapters));
    }
    if (mediaType === "audiobooks" && session.chapters > 0) {
      const ltChKey = "sk_lifetime_chapters";
      localStorage.setItem(ltChKey, String(parseInt(localStorage.getItem(ltChKey) || "0") + session.chapters));
    }

    localStorage.removeItem(timerKey);
    setActiveTimer(null);
    setElapsed(0);
    setSessionSaved(true);
    setTimeout(() => setSessionSaved(false), 3000);
  };

  const savePage = (val) => {
    const pages = (() => { try { return JSON.parse(localStorage.getItem(pagesKey) || "{}"); } catch { return {}; } })();
    pages[isbn] = val;
    localStorage.setItem(pagesKey, JSON.stringify(pages));
    setCurrentPage(val);
  };

  // Total time logged for this book (from session history)
  const totalMinutes = (() => {
    try {
      const sessions = JSON.parse(localStorage.getItem(sessionsKey) || "[]");
      return sessions.filter(s => s.isbn === isbn).reduce((acc, s) => acc + (s.minutes || 0), 0);
    } catch { return 0; }
  })();
  // Lifetime totals across all books (dedicated counters)
  const lifetimePages = parseInt(localStorage.getItem("sk_lifetime_pages") || "0");
  const lifetimeChapters = parseInt(localStorage.getItem("sk_lifetime_chapters") || "0");
  const lifetimeChaptersEbooks = parseInt(localStorage.getItem("sk_lifetime_chapters_ebooks") || "0");
  const lifetimeMinutes = parseInt(localStorage.getItem(`sk_lifetime_minutes_${mediaType}`) || "0");

  const isUserBook = (() => {
    try {
      const all = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
      return all.some(b => b.title === book.title && b.author === book.author);
    } catch { return false; }
  })();

  const currentGenre = (() => {
    try {
      const overrides = JSON.parse(localStorage.getItem("sk_genre_overrides") || "{}");
      return overrides[isbn] || book.genre || "";
    } catch { return book.genre || ""; }
  })();
  const [selectedGenre, setSelectedGenre] = useState(currentGenre);
  const activeGenre = selectedGenre || book.genre;
  const isDrama = ["Drama", "Fiction", "Historical Fiction", "Romance"].includes(activeGenre);
  const isHorror = activeGenre === "Horror";
  const isFantasy = ["Fantasy", "Sci-Fi"].includes(activeGenre);
  const isDarkRomance = activeGenre === "Dark Romance";

  const handleGenreChange = (newGenre) => {
    setSelectedGenre(newGenre);
    // Always save to overrides — this is the most reliable store and works for all book types
    try {
      const overrides = JSON.parse(localStorage.getItem("sk_genre_overrides") || "{}");
      overrides[isbn] = newGenre;
      localStorage.setItem("sk_genre_overrides", JSON.stringify(overrides));
    } catch { /* ignore */ }
    // Also update sk_user_books directly if it's a user book
    try {
      const all = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
      const idx = all.findIndex(b =>
        (book.isbn && b.isbn === book.isbn) ||
        b.title?.trim() === book.title?.trim()
      );
      if (idx !== -1) {
        all[idx].genre = newGenre;
        localStorage.setItem("sk_user_books", JSON.stringify(all));
      }
    } catch { /* ignore */ }
    if (onBookEdited) onBookEdited({ ...book, genre: newGenre });
  };

  const handleSaveEdit = () => {
    try {
      const all = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
      const idx = all.findIndex(b => b.title === book.title && (b.author === book.author || !book.author));
      if (idx !== -1) {
        all[idx] = { ...all[idx], ...editFields };
        localStorage.setItem("sk_user_books", JSON.stringify(all));
        if (onBookEdited) onBookEdited({ ...all[idx] });
      }
    } catch { /* ignore */ }
    setEditing(false);
  };
  const isFav = !!favorites[isbn];
  const status = statuses[isbn] || null;
  const prog = progress[isbn] || 0;

  useEffect(() => { localStorage.setItem(`sk_dates_${mediaType}`, JSON.stringify(dates)); }, [dates, mediaType]);

  const handleStatus = (s) => {
    setStatuses((prev) => ({ ...prev, [isbn]: s }));
    if (s === "reading") {
      setDates((prev) => {
        const existing = prev[isbn] || {};
        if (existing.startDate) return prev;
        return { ...prev, [isbn]: { ...existing, startDate: new Date().toISOString() } };
      });
    }
    if (s === "finished") {
      setDates((prev) => {
        const existing = prev[isbn] || {};
        return { ...prev, [isbn]: { ...existing, endDate: new Date().toISOString() } };
      });
    }
  };

  const handleFav = () => {
    setFavorites((prev) => {
      const next = { ...prev };
      if (next[isbn]) delete next[isbn];
      else next[isbn] = true;
      return next;
    });
  };

  const handleProgress = (e) => {
    const val = Number(e.target.value);
    setProgress((prev) => ({ ...prev, [isbn]: val }));
    if (val === 100 && statuses[isbn] !== "finished") {
      handleStatus("finished");
    } else if (val > 0 && val < 100 && (!statuses[isbn] || statuses[isbn] === "want-to-read")) {
      handleStatus("reading");
    }
  };

  const [fetching, setFetching] = useState(false);
  const [fetchMsg, setFetchMsg] = useState(null);

  const handleFetchInfo = async () => {
    if (!isUserBook) return;
    setFetching(true);
    setFetchMsg(null);
    try {
      const cleaned = cleanTitle(book.title);
      const queries = [
        book.isbn ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${book.isbn}&maxResults=1&langRestrict=en` : null,
        book.author ? `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(cleaned)}+inauthor:${encodeURIComponent(book.author)}&maxResults=1&langRestrict=en` : null,
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleaned)}&maxResults=1&langRestrict=en`,
      ].filter(Boolean);

      let vol = null;
      for (const url of queries) {
        const res = await fetch(url);
        const json = await res.json();
        vol = json.items?.[0]?.volumeInfo;
        if (vol) break;
      }

      if (vol) {
        const all = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
        const idx = all.findIndex(b => b.title === book.title && (b.author === book.author || !book.author));
        if (idx !== -1) {
          if (!all[idx].author && vol.authors?.length) all[idx].author = vol.authors.join(", ");
          if (vol.imageLinks?.thumbnail) all[idx].coverUrl = vol.imageLinks.thumbnail.replace("http://", "https://").replace("&zoom=1", "&zoom=2");
          if (!all[idx].description && vol.description) all[idx].description = vol.description;
          if (!all[idx].isbn && vol.industryIdentifiers?.length) {
            const id = vol.industryIdentifiers.find(i => i.type === "ISBN_13") || vol.industryIdentifiers[0];
            if (id) all[idx].isbn = id.identifier;
          }
          localStorage.setItem("sk_user_books", JSON.stringify(all));
          setFetchMsg("✅ Updated! Reopen this book to see the changes.");
        }
      } else {
        setFetchMsg("Could not find this book online. Try editing the title manually.");
      }
    } catch {
      setFetchMsg("Network error — please try again.");
    }
    setFetching(false);
  };

  const statusBtnStyle = (s) => ({
    padding: "7px 12px",
    borderRadius: 6,
    border: "1px solid #8B5E3C",
    cursor: "pointer",
    fontFamily: '"Palatino Linotype", Palatino, serif',
    fontSize: 12,
    fontWeight: status === s ? 700 : 400,
    background: status === s ? modalTheme.text : modalTheme.bg,
    color: status === s ? modalTheme.bg : modalTheme.text,
    flex: 1,
    transition: "all 0.15s",
  });

  const divider = (
    <div style={{ borderTop: "1px solid #C9A96E", margin: "14px 0", opacity: 0.6 }} />
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(20,14,8,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 700,
          width: "100%",
          background: modalTheme.bg,
          border: "1px solid #8B5E3C",
          borderRadius: 12,
          padding: "30px 20px",
          position: "relative",
          boxShadow: "0 16px 48px rgba(0,0,0,0.55)",
          maxHeight: "90vh",
          overflowY: "auto",
          boxSizing: "border-box",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 22,
            cursor: "pointer",
            color: modalTheme.textSoft,
            lineHeight: 1,
            padding: "2px 6px",
          }}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Edit button — only for user-imported books */}
        {isUserBook && !editing && (
          <button
            onClick={() => setEditing(true)}
            style={{
              position: "absolute",
              top: 14,
              right: 52,
              background: "none",
              border: "none",
              fontSize: 16,
              cursor: "pointer",
              color: modalTheme.accent,
              lineHeight: 1,
              padding: "2px 6px",
              opacity: 0.7,
            }}
            aria-label="Edit book"
            title="Edit this book"
          >
            ✏️
          </button>
        )}

        {/* Delete button and confirmation — rendered at bottom of modal via portal-style div below */}

        {/* Edit form */}
        {editing && (
          <div>
            <h2 style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 20, color: modalTheme.text, margin: "0 0 16px 0", paddingRight: 30 }}>
              ✏️ Edit Book
            </h2>
            {[
              { label: "Title", field: "title" },
              { label: "Author", field: "author" },
              { label: "Cover URL", field: "coverUrl", placeholder: "https://..." },
            ].map(({ label, field, placeholder }) => (
              <div key={field} style={{ marginBottom: 12 }}>
                <label style={{ fontFamily: "Georgia, serif", fontSize: 12, color: modalTheme.textMid, display: "block", marginBottom: 4 }}>{label}</label>
                <input
                  type="text"
                  value={editFields[field]}
                  placeholder={placeholder || ""}
                  onChange={e => setEditFields(p => ({ ...p, [field]: e.target.value }))}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #8B5E3C", fontFamily: "Georgia, serif", fontSize: 13, background: modalTheme.bgDeep, color: modalTheme.text, boxSizing: "border-box" }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontFamily: "Georgia, serif", fontSize: 12, color: modalTheme.textMid, display: "block", marginBottom: 4 }}>Genre</label>
              <select
                value={editFields.genre}
                onChange={e => setEditFields(p => ({ ...p, genre: e.target.value }))}
                style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #8B5E3C", fontFamily: "Georgia, serif", fontSize: 13, background: modalTheme.bgDeep, color: modalTheme.text }}
              >
                {ALL_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontFamily: "Georgia, serif", fontSize: 12, color: modalTheme.textMid, display: "block", marginBottom: 4 }}>Media Type</label>
              <select
                value={editFields.mediaType}
                onChange={e => setEditFields(p => ({ ...p, mediaType: e.target.value }))}
                style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #8B5E3C", fontFamily: "Georgia, serif", fontSize: 13, background: modalTheme.bgDeep, color: modalTheme.text }}
              >
                <option value="ebook">📚 eBook</option>
                <option value="audiobook">🎧 Audiobook</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: "Georgia, serif", fontSize: 12, color: modalTheme.textMid, display: "block", marginBottom: 4 }}>Description</label>
              <textarea
                value={editFields.description}
                onChange={e => setEditFields(p => ({ ...p, description: e.target.value }))}
                rows={4}
                style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #8B5E3C", fontFamily: "Georgia, serif", fontSize: 13, background: modalTheme.bgDeep, color: modalTheme.text, resize: "vertical", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleSaveEdit}
                style={{ padding: "8px 20px", background: modalTheme.text, color: modalTheme.bg, border: "none", borderRadius: 6, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 14, fontWeight: 700 }}
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{ padding: "8px 16px", background: "none", border: "1px solid #8B5E3C", borderRadius: 6, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 14, color: modalTheme.text }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Two-column layout */}
        {!editing && <>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Left column — book cover */}
          <div style={{ width: 140, flexShrink: 0, margin: "0 auto" }}>
            {!imgError ? (
              <img
                src={book.coverUrl || (isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : "")}
                alt={book.title}
                onError={() => {
                  if (book.coverUrl && !imgError) { setImgError(true); }
                  else setImgError(true);
                }}
                style={{
                  width: "100%",
                  borderRadius: 6,
                  boxShadow: "3px 4px 14px rgba(0,0,0,0.35)",
                  display: "block",
                  border: "1px solid #C9A96E",
                }}
              />
            ) : (
              <div style={{
                width: "100%",
                paddingTop: "145%",
                position: "relative",
                borderRadius: 6,
                background: "linear-gradient(135deg, #3A2A1A 0%, #6B4E32 100%)",
                boxShadow: "3px 4px 14px rgba(0,0,0,0.35)",
                border: "1px solid #C9A96E",
              }}>
                <div style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 12,
                  textAlign: "center",
                  color: modalTheme.bg,
                  fontFamily: '"Palatino Linotype", Palatino, serif',
                  fontSize: 13,
                  fontWeight: 700,
                  lineHeight: 1.4,
                }}>
                  {book.title}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ flex: 1, minWidth: 260, width: "100%" }}>
            <h2 style={{
              fontFamily: '"Palatino Linotype", Palatino, serif',
              fontSize: 22,
              fontWeight: 700,
              color: modalTheme.text,
              margin: "0 0 4px 0",
              lineHeight: 1.3,
              paddingRight: 30,
            }}>
              {book.title}
            </h2>
            <p style={{
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              fontSize: 14,
              color: modalTheme.textSoft,
              margin: "0 0 12px 0",
            }}>
              {book.author}
            </p>

            {divider}

            <p style={{
              fontFamily: "Georgia, serif",
              fontSize: 13,
              color: modalTheme.textMid,
              lineHeight: 1.7,
              margin: "0 0 4px 0",
            }}>
              {book.description}
            </p>

            {/* Read / Listen button */}
            {(() => {
              const PLATFORM_URLS = {
                kindle:    book.readUrl || (book.asin ? `https://read.amazon.com/?asin=${book.asin}` : book.isbn ? `https://read.amazon.com/reader?asin=${book.isbn}` : "https://read.amazon.com"),
                audible:   book.readUrl || (book.asin ? `https://www.audible.com/pd/${book.asin}` : book.isbn ? `https://www.audible.com/pd/${book.isbn}` : "https://www.audible.com/library/titles"),
                chirp:     book.readUrl || "https://www.chirpbooks.com/library",
                apple:     book.storeId ? `https://books.apple.com/us/book/id${book.storeId}` : book.readUrl || "https://books.apple.com/library",
                kobo:      book.readUrl || "https://www.kobo.com/ww/en/account/books",
                libby:     book.readUrl || "https://libbyapp.com/shelf",
                hoopla:    book.readUrl || "https://www.hoopladigital.com/my/borrowed",
                goodreads: null,
              };
              const url = book.platform ? PLATFORM_URLS[book.platform] : null;
              if (!url) return null;
              const isAudio = mediaType === "audiobooks";
              const platformNames = { kindle: "Kindle", audible: "Audible", chirp: "Chirp", apple: "Apple Books", kobo: "Kobo", libby: "Libby", hoopla: "Hoopla", bookfunnel: "BookFunnel" };
              const name = platformNames[book.platform] || book.platform;
              const openInPopup = () => {
                if (!statuses[isbn] || statuses[isbn] === "want-to-read") handleStatus("reading");
                setPromptPercent(null);
                setShowProgressPrompt(false);
                if (popupPollRef.current) clearInterval(popupPollRef.current);
                const openedAt = Date.now();
                const popup = window.open(url, "sk_reader", "width=1200,height=800,noopener");
                popupRef.current = popup;
                popupPollRef.current = setInterval(() => {
                  if (!popupRef.current || popupRef.current.closed) {
                    clearInterval(popupPollRef.current);
                    popupRef.current = null;
                    // Auto-log session from popup open→close time
                    const minutes = Math.max(1, Math.round((Date.now() - openedAt) / 60000));
                    const session = {
                      isbn,
                      title: book.title,
                      date: new Date().toISOString(),
                      minutes,
                      pages: 0,
                      chapters: 0,
                      platform: name,
                    };
                    const allSessions = (() => { try { return JSON.parse(localStorage.getItem(sessionsKey) || "[]"); } catch { return []; } })();
                    allSessions.unshift(session);
                    localStorage.setItem(sessionsKey, JSON.stringify(allSessions));
                    // Increment lifetime minute counter
                    const ltMinKey = `sk_lifetime_minutes_${mediaType}`;
                    localStorage.setItem(ltMinKey, String(parseInt(localStorage.getItem(ltMinKey) || "0") + minutes));
                    setShowProgressPrompt(true);
                  }
                }, 800);
              };
              return (
                <button
                  onClick={openInPopup}
                  style={{
                    display: "inline-block",
                    margin: "10px 0 12px",
                    padding: "8px 20px",
                    background: modalTheme.accent,
                    color: modalTheme.bg,
                    border: "none",
                    borderRadius: 8,
                    fontFamily: '"Palatino Linotype", Palatino, serif',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  }}
                >
                  {isAudio ? "🎧" : "📖"} {isAudio ? "Listen" : "Read"} on {name} →
                </button>
              );
            })()}

            {/* Progress prompt — shown after popup closes */}
            {showProgressPrompt && (
              <div style={{ background: modalTheme.bgMuted, border: "2px solid #8B5E3C", borderRadius: 10, padding: "14px 18px", margin: "8px 0 14px", boxShadow: "0 2px 10px rgba(0,0,0,0.12)" }}>
                <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 14, fontWeight: 700, color: modalTheme.text, marginBottom: 10 }}>
                  Welcome back! {progressMode === "percent" ? "How far did you get?" : mediaType === "audiobooks" ? "Which chapter are you on?" : "What page are you on?"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  {progressMode === "percent" ? (
                    <>
                      <input type="range" min={0} max={100} step={1}
                        value={promptPercent ?? (progress[isbn] || 0)}
                        onChange={e => setPromptPercent(Number(e.target.value))}
                        style={{ flex: 1, accentColor: modalTheme.accent }}
                      />
                      <span style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 700, color: modalTheme.accent, minWidth: 38, textAlign: "right" }}>
                        {promptPercent ?? (progress[isbn] || 0)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <input
                        type="number" min={0}
                        value={promptPercent ?? (book._currentPage || "")}
                        placeholder={mediaType === "audiobooks" ? "Chapter #" : "Page #"}
                        onChange={e => setPromptPercent(Math.max(0, Number(e.target.value) || 0))}
                        style={{ width: 90, padding: "6px 10px", borderRadius: 6, border: "1px solid #8B5E3C", fontFamily: "Georgia, serif", fontSize: 14, background: modalTheme.bgDeep, color: modalTheme.text }}
                      />
                      <span style={{ fontFamily: "Georgia, serif", fontSize: 13, color: modalTheme.textSoft }}>
                        {mediaType === "audiobooks" ? "of " + (book._totalChapters || "?") + " chapters" : "of " + (book._totalPages || "?") + " pages"}
                      </span>
                    </>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      let pct;
                      if (progressMode === "percent") {
                        pct = promptPercent ?? (progress[isbn] || 0);
                      } else {
                        const pageNum = promptPercent ?? (book._currentPage || 0);
                        const total = mediaType === "audiobooks" ? (book._totalChapters || 0) : (book._totalPages || 0);
                        pct = total > 0 ? Math.min(100, Math.round((pageNum / total) * 100)) : (pageNum > 0 ? 50 : 0);
                        const all = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
                        const idx = all.findIndex(b => (b.isbn && b.isbn === book.isbn) || b.title === book.title);
                        if (idx !== -1) { all[idx]._currentPage = pageNum; localStorage.setItem("sk_user_books", JSON.stringify(all)); }
                        // Update lifetime page/chapter counter and patch the auto-logged session
                        if (pageNum > 0) {
                          if (mediaType === "ebooks") {
                            const ltPgKey = "sk_lifetime_pages";
                            localStorage.setItem(ltPgKey, String(parseInt(localStorage.getItem(ltPgKey) || "0") + pageNum));
                          } else {
                            const ltChKey = "sk_lifetime_chapters";
                            localStorage.setItem(ltChKey, String(parseInt(localStorage.getItem(ltChKey) || "0") + pageNum));
                          }
                          // Patch the most recent auto-logged session with the page/chapter number
                          const allSess = (() => { try { return JSON.parse(localStorage.getItem(sessionsKey) || "[]"); } catch { return []; } })();
                          if (allSess.length > 0 && allSess[0].platform) {
                            if (mediaType === "ebooks") allSess[0].pages = pageNum;
                            else allSess[0].chapters = pageNum;
                            localStorage.setItem(sessionsKey, JSON.stringify(allSess));
                          }
                        }
                      }
                      setProgress(prev => {
                        const updated = { ...prev, [isbn]: pct };
                        localStorage.setItem(`sk_progress_${mediaType}`, JSON.stringify(updated));
                        return updated;
                      });
                      setShowProgressPrompt(false);
                    }}
                    style={{ flex: 1, padding: "7px 0", background: modalTheme.accent, color: modalTheme.bg, border: "none", borderRadius: 7, fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    Save Progress
                  </button>
                  <button
                    onClick={() => {
                      setProgress(prev => {
                        const updated = { ...prev, [isbn]: 100 };
                        localStorage.setItem(`sk_progress_${mediaType}`, JSON.stringify(updated));
                        return updated;
                      });
                      handleStatus("finished");
                      setShowProgressPrompt(false);
                    }}
                    style={{ flex: 1, padding: "7px 0", background: "#3A6B3A", color: modalTheme.bg, border: "none", borderRadius: 7, fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    ✓ Finished!
                  </button>
                  <button
                    onClick={() => setShowProgressPrompt(false)}
                    style={{ padding: "7px 12px", background: "none", color: modalTheme.accent, border: "1px solid #8B5E3C", borderRadius: 7, fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, cursor: "pointer" }}
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {/* Genre row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0 4px" }}>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 12, color: modalTheme.textSoft, fontStyle: "italic", whiteSpace: "nowrap" }}>
                Genre:
              </span>
              <select
                value={selectedGenre}
                onChange={e => handleGenreChange(e.target.value)}
                style={{
                  fontFamily: '"Palatino Linotype", Palatino, serif',
                  fontSize: 13,
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "1px solid #8B5E3C",
                  background: modalTheme.bg,
                  color: modalTheme.text,
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                {ALL_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              {selectedGenre !== currentGenre && (
                <span style={{ fontFamily: "Georgia, serif", fontSize: 11, color: modalTheme.textSoft, fontStyle: "italic" }}>
                  ✓ saved
                </span>
              )}
            </div>

            {divider}

            {/* Status buttons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button style={statusBtnStyle("want-to-read")} onClick={() => handleStatus("want-to-read")}>
                {mediaType === "audiobooks" ? "🎧 Want to Listen" : "📖 Want to Read"}
              </button>
              <button style={statusBtnStyle("reading")} onClick={() => handleStatus("reading")}>
                {mediaType === "audiobooks" ? "🎧 Listening" : "📚 Reading"}
              </button>
              <button style={statusBtnStyle("finished")} onClick={() => handleStatus("finished")}>
                ✅ Finished
              </button>
            </div>

            {/* Editable start / finish dates */}
            {(status === "reading" || status === "finished") && (
              <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                <button onClick={() => setDatePickerOpen("start")}
                  style={{ flex: 1, minWidth: 150, padding: "6px 10px", borderRadius: 8, border: `1px solid ${modalTheme.accent || "#8B5E3C"}`, background: dates[isbn]?.startDate ? (modalTheme.bgDeep || modalTheme.bg) : "transparent", color: modalTheme.text, fontFamily: "Georgia, serif", fontSize: 12, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>📅</span>
                  <span style={{ flex: 1, color: dates[isbn]?.startDate ? modalTheme.text : (modalTheme.textSoft || "#8B7355") }}>
                    {dates[isbn]?.startDate
                      ? new Date(dates[isbn].startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "Set start date"}
                  </span>
                </button>
                {status === "finished" && (
                  <button onClick={() => setDatePickerOpen("end")}
                    style={{ flex: 1, minWidth: 150, padding: "6px 10px", borderRadius: 8, border: `1px solid ${modalTheme.accent || "#8B5E3C"}`, background: dates[isbn]?.endDate ? (modalTheme.bgDeep || modalTheme.bg) : "transparent", color: modalTheme.text, fontFamily: "Georgia, serif", fontSize: 12, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 6 }}>
                    <span>✅</span>
                    <span style={{ flex: 1, color: dates[isbn]?.endDate ? modalTheme.text : (modalTheme.textSoft || "#8B7355") }}>
                      {dates[isbn]?.endDate
                        ? new Date(dates[isbn].endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "Set finish date"}
                    </span>
                  </button>
                )}
              </div>
            )}
            {datePickerOpen === "start" && (
              <DatePickerModal
                label="📅 When did you start?"
                value={dates[isbn]?.startDate}
                onSelect={iso => setDates(prev => ({ ...prev, [isbn]: { ...prev[isbn], startDate: iso } }))}
                onClose={() => setDatePickerOpen(null)}
                themeAccent={modalTheme.accent}
                themeBg={modalTheme.bgDeep || modalTheme.bg}
                themeText={modalTheme.text}
              />
            )}
            {datePickerOpen === "end" && (
              <DatePickerModal
                label="✅ When did you finish?"
                value={dates[isbn]?.endDate}
                onSelect={iso => setDates(prev => ({ ...prev, [isbn]: { ...prev[isbn], endDate: iso } }))}
                onClose={() => setDatePickerOpen(null)}
                themeAccent={modalTheme.accent}
                themeBg={modalTheme.bgDeep || modalTheme.bg}
                themeText={modalTheme.text}
              />
            )}

            {/* Progress — page number for ebooks, chapter for audiobooks */}
            {status === "reading" && (
              <div style={{ marginBottom: 14 }}>
                {progressMode === "percent" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label style={{ fontFamily: "Georgia, serif", fontSize: 12, color: modalTheme.textMid, whiteSpace: "nowrap" }}>
                      {mediaType === "audiobooks" ? "Listening Progress:" : "Reading Progress:"}
                    </label>
                    <input type="range" min={0} max={100} value={prog} onChange={handleProgress} style={{ flex: 1, accentColor: modalTheme.accent, cursor: "pointer" }} />
                    <span style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, color: modalTheme.accent, minWidth: 36, textAlign: "right" }}>{prog}%</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label style={{ fontFamily: "Georgia, serif", fontSize: 12, color: modalTheme.textMid, whiteSpace: "nowrap" }}>
                      {mediaType === "audiobooks" ? "Current Chapter:" : "Current Page:"}
                    </label>
                    <input
                      type="number" min={0}
                      value={book._currentPage || ""}
                      placeholder={mediaType === "audiobooks" ? "Ch. #" : "Pg. #"}
                      onChange={e => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        const total = mediaType === "audiobooks" ? (book._totalChapters || 0) : (book._totalPages || 0);
                        const pct = total > 0 ? Math.min(100, Math.round((val / total) * 100)) : 0;
                        const all = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
                        const idx = all.findIndex(b => (b.isbn && b.isbn === book.isbn) || b.title === book.title);
                        if (idx !== -1) { all[idx]._currentPage = val; localStorage.setItem("sk_user_books", JSON.stringify(all)); }
                        if (pct > 0) setProgress(prev => ({ ...prev, [isbn]: pct }));
                        if (pct >= 100) handleStatus("finished");
                        else if (val > 0 && (!statuses[isbn] || statuses[isbn] === "want-to-read")) handleStatus("reading");
                      }}
                      style={{ width: 75, padding: "4px 8px", borderRadius: 6, border: "1px solid #8B5E3C", fontFamily: "Georgia, serif", fontSize: 13, background: modalTheme.bgDeep, color: modalTheme.text }}
                    />
                    {mediaType === "audiobooks" ? (
                      <span style={{ fontFamily: "Georgia, serif", fontSize: 12, color: modalTheme.textSoft }}>
                        of <input type="number" min={0} value={book._totalChapters || ""} placeholder="Total" onChange={e => {
                          const all = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
                          const idx = all.findIndex(b => (b.isbn && b.isbn === book.isbn) || b.title === book.title);
                          if (idx !== -1) { all[idx]._totalChapters = Number(e.target.value) || 0; localStorage.setItem("sk_user_books", JSON.stringify(all)); }
                        }} style={{ width: 55, padding: "4px 6px", borderRadius: 6, border: "1px solid #C9A96E", fontFamily: "Georgia, serif", fontSize: 12, background: modalTheme.bgDeep, color: modalTheme.text }} /> ch.
                      </span>
                    ) : (
                      <span style={{ fontFamily: "Georgia, serif", fontSize: 12, color: modalTheme.textSoft }}>
                        of <input type="number" min={0} value={book._totalPages || ""} placeholder="Total" onChange={e => {
                          const all = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
                          const idx = all.findIndex(b => (b.isbn && b.isbn === book.isbn) || b.title === book.title);
                          if (idx !== -1) { all[idx]._totalPages = Number(e.target.value) || 0; localStorage.setItem("sk_user_books", JSON.stringify(all)); }
                        }} style={{ width: 55, padding: "4px 6px", borderRadius: 6, border: "1px solid #C9A96E", fontFamily: "Georgia, serif", fontSize: 12, background: modalTheme.bgDeep, color: modalTheme.text }} /> pg.
                      </span>
                    )}
                    {prog > 0 && <span style={{ fontFamily: "Georgia, serif", fontSize: 12, color: modalTheme.accent, fontStyle: "italic" }}>{prog}%</span>}
                  </div>
                )}
              </div>
            )}

            {/* ── Session Timer & Pages ── */}
            <div style={{ background: "rgba(255,255,255,0.5)", border: "1px solid #D8C3A5", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontWeight: 700, fontSize: 13, color: modalTheme.text, marginBottom: 10 }}>
                {mediaType === "audiobooks" ? "🎧 Listening Session" : "📖 Reading Session"}
              </div>

              {/* Timer */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                {isTimerActive ? (
                  <>
                    <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 22, fontWeight: 700, color: modalTheme.accent, minWidth: 90 }}>
                      🔴 {formatTime(elapsed)}
                    </div>
                    <button onClick={stopTimer} style={{ padding: "7px 16px", background: "#7A2A2A", color: modalTheme.bg, border: "none", borderRadius: 6, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 700 }}>
                      ⏹ Stop & Save
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={startTimer} style={{ padding: "7px 16px", background: modalTheme.text, color: modalTheme.bg, border: "none", borderRadius: 6, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 700 }}>
                      ▶ Start Session
                    </button>
                    {sessionSaved && <span style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#2d6a2d", fontStyle: "italic" }}>✓ Session saved!</span>}
                  </>
                )}
                <div style={{ marginLeft: "auto", textAlign: "right", flexShrink: 0 }}>
                    {totalMinutes > 0 && (
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 11, color: modalTheme.textSoft, fontStyle: "italic" }}>
                        ⏱ {totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes}m`} this book
                      </div>
                    )}
                    {mediaType === "ebooks" && lifetimePages > 0 && (
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 11, color: modalTheme.accent, fontStyle: "italic" }}>
                        📖 {lifetimePages.toLocaleString()} pages lifetime
                      </div>
                    )}
                    {mediaType === "ebooks" && lifetimeChaptersEbooks > 0 && (
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 11, color: modalTheme.accent, fontStyle: "italic" }}>
                        🔖 {lifetimeChaptersEbooks.toLocaleString()} chapters lifetime
                      </div>
                    )}
                    {mediaType === "audiobooks" && lifetimeChapters > 0 && (
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 11, color: modalTheme.accent, fontStyle: "italic" }}>
                        🎧 {lifetimeChapters.toLocaleString()} chapters lifetime
                      </div>
                    )}
                    {lifetimeMinutes > 0 && (
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 11, color: modalTheme.accent, fontStyle: "italic" }}>
                        🕰 {lifetimeMinutes >= 60 ? `${Math.floor(lifetimeMinutes / 60)}h ${lifetimeMinutes % 60}m` : `${lifetimeMinutes}m`} lifetime
                      </div>
                    )}
                  </div>
              </div>

              {/* Pages / Chapter reached — logged with session */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {mediaType === "audiobooks" ? (
                  <>
                    <label style={{ fontFamily: "Georgia, serif", fontSize: 12, color: modalTheme.textMid, whiteSpace: "nowrap" }}>Chapter reached:</label>
                    <input type="number" min={0} value={currentPage} onChange={e => savePage(e.target.value)} placeholder="e.g. 12"
                      style={{ width: 70, padding: "4px 8px", borderRadius: 6, border: "1px solid #8B5E3C", fontFamily: "Georgia, serif", fontSize: 13, background: modalTheme.bgDeep, color: modalTheme.text }} />
                  </>
                ) : (
                  <>
                    <label style={{ fontFamily: "Georgia, serif", fontSize: 12, color: modalTheme.textMid, whiteSpace: "nowrap" }}>Page reached:</label>
                    <input type="number" min={0} value={currentPage} onChange={e => savePage(e.target.value)} placeholder="e.g. 142"
                      style={{ width: 70, padding: "4px 8px", borderRadius: 6, border: "1px solid #8B5E3C", fontFamily: "Georgia, serif", fontSize: 13, background: modalTheme.bgDeep, color: modalTheme.text }} />
                    <label style={{ fontFamily: "Georgia, serif", fontSize: 12, color: modalTheme.textMid, whiteSpace: "nowrap", marginLeft: 6 }}>Chapter:</label>
                    <input type="number" min={0} value={currentChapter} onChange={e => {
                      const val = e.target.value;
                      setCurrentChapter(val);
                      const all = (() => { try { return JSON.parse(localStorage.getItem("sk_chapters_ebooks") || "{}"); } catch { return {}; } })();
                      all[isbn] = val;
                      localStorage.setItem("sk_chapters_ebooks", JSON.stringify(all));
                    }} placeholder="e.g. 5"
                      style={{ width: 70, padding: "4px 8px", borderRadius: 6, border: "1px solid #8B5E3C", fontFamily: "Georgia, serif", fontSize: 13, background: modalTheme.bgDeep, color: modalTheme.text }} />
                  </>
                )}
                <span style={{ fontFamily: "Georgia, serif", fontSize: 11, color: "#8B7355", fontStyle: "italic" }}>(saved with session)</span>
              </div>
            </div>

            {/* Find Cover & Info — for imported books */}
            {isUserBook && (
              <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {(!book.coverUrl || !book.description) && (
                  <button
                    onClick={handleFetchInfo}
                    disabled={fetching}
                    style={{
                      padding: "6px 14px",
                      background: fetching ? modalTheme.border : "transparent",
                      border: "1px solid #8B5E3C",
                      borderRadius: 6,
                      cursor: fetching ? "default" : "pointer",
                      fontFamily: '"Palatino Linotype", Palatino, serif',
                      fontSize: 12,
                      color: modalTheme.text,
                    }}
                  >
                    {fetching ? "Searching…" : "🔍 Find Cover & Info"}
                  </button>
                )}
                {book.coverUrl && (
                  <button
                    onClick={async () => {
                      setFetching(true);
                      setFetchMsg(null);
                      try {
                        const cleaned = cleanTitle(book.title);
                        const queries = [
                          book.isbn ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${book.isbn}&maxResults=1&langRestrict=en` : null,
                          book.author ? `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(cleaned)}+inauthor:${encodeURIComponent(book.author)}&maxResults=1&langRestrict=en` : null,
                          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleaned)}&maxResults=1&langRestrict=en`,
                        ].filter(Boolean);
                        let newCover = null;
                        for (const url of queries) {
                          const res = await fetch(url);
                          const json = await res.json();
                          const vol = json.items?.[0]?.volumeInfo;
                          if (vol?.imageLinks?.thumbnail) {
                            newCover = vol.imageLinks.thumbnail.replace("http://", "https://").replace("&zoom=1", "&zoom=2");
                            break;
                          }
                        }
                        if (newCover) {
                          const all = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
                          const idx = all.findIndex(b => (book.isbn && b.isbn === book.isbn) || b.title?.trim() === book.title?.trim());
                          if (idx !== -1) {
                            all[idx].coverUrl = newCover;
                            localStorage.setItem("sk_user_books", JSON.stringify(all));
                            // Also update genre overrides store so shelf stays correct
                            if (onBookEdited) onBookEdited({ ...all[idx] });
                            setFetchMsg("✅ Cover refreshed! Reopen to see the new cover.");
                          }
                        } else {
                          setFetchMsg("No alternative cover found online.");
                        }
                      } catch {
                        setFetchMsg("Network error — please try again.");
                      }
                      setFetching(false);
                    }}
                    disabled={fetching}
                    style={{
                      padding: "6px 14px",
                      background: "transparent",
                      border: "1px solid #8B5E3C",
                      borderRadius: 6,
                      cursor: fetching ? "default" : "pointer",
                      fontFamily: '"Palatino Linotype", Palatino, serif',
                      fontSize: 12,
                      color: modalTheme.text,
                    }}
                  >
                    {fetching ? "Searching…" : "🖼 Refresh Cover"}
                  </button>
                )}
                {fetchMsg && (
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 11, color: modalTheme.textSoft, fontStyle: "italic", width: "100%", marginTop: 2 }}>
                    {fetchMsg}
                  </div>
                )}
              </div>
            )}

            {/* Favorites row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <button
                onClick={handleFav}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                  color: isFav ? "#8B2020" : modalTheme.accent,
                  padding: 0,
                  lineHeight: 1,
                }}
                aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
              >
                {isFav ? "♥" : "♡"}
              </button>
              <span style={{
                fontFamily: "Georgia, serif",
                fontSize: 13,
                color: isFav ? "#8B2020" : modalTheme.textSoft,
                fontStyle: "italic",
              }}>
                {isFav ? "Favorited" : "Add to Favorites"}
              </span>
            </div>

            {/* Rating, Spice & Notes — excluded for non-fiction reference genres */}
            {!["Cookbooks", "Self Help", "Gardening & Landscaping", "Home & DIY", "Health & Wellness", "Sewing & Crafts"].includes(book.genre) && (
            <div style={{ background: "rgba(255,255,255,0.5)", border: "1px solid #D8C3A5", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>

              {/* Star Rating */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 12, color: modalTheme.textMid, whiteSpace: "nowrap", minWidth: 60 }}>My Rating:</span>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => {
                        const val = rating === n ? 0 : n;
                        setRating(val);
                        const all = (() => { try { return JSON.parse(localStorage.getItem("sk_ratings") || "{}"); } catch { return {}; } })();
                        if (val === 0) delete all[isbn]; else all[isbn] = val;
                        localStorage.setItem("sk_ratings", JSON.stringify(all));
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 22, lineHeight: 1, color: (hoverRating || rating) >= n ? thAccent : thAccent + "55" }}
                    >★</button>
                  ))}
                </div>
                {rating > 0 && <span style={{ fontFamily: "Georgia, serif", fontSize: 12, color: modalTheme.accent, fontStyle: "italic" }}>{rating} of 5</span>}
              </div>

              {/* Spice Level (non-thriller) / Lights Out (thriller) */}
              {(() => {
                const ratingRow = (icon, label, value, setter, hover, setHover, storageKey, labels, labelColor) => (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <span style={{ fontFamily: "Georgia, serif", fontSize: 12, color: modalTheme.textMid, whiteSpace: "nowrap", minWidth: 60 }}>{label}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[1,2,3,4,5].map(n => (
                        <button key={n}
                          onMouseEnter={() => setHover(n)}
                          onMouseLeave={() => setHover(0)}
                          onClick={() => {
                            const val = value === n ? 0 : n;
                            setter(val);
                            const all = (() => { try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { return {}; } })();
                            if (val === 0) delete all[isbn]; else all[isbn] = val;
                            localStorage.setItem(storageKey, JSON.stringify(all));
                          }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 20, lineHeight: 1, opacity: (hover || value) >= n ? 1 : 0.25 }}
                        >{icon}</button>
                      ))}
                    </div>
                    {value > 0 && <span style={{ fontFamily: "Georgia, serif", fontSize: 12, color: labelColor, fontStyle: "italic" }}>{labels[value - 1]}</span>}
                  </div>
                );
                if (isDrama) return ratingRow("💧","Cry Factor:",cryFactor,setCryFactor,hoverCry,setHoverCry,"sk_cry_factor",["Dry Eye","Misty","Full Cry","Ugly Cry","Destroyed"],"#4A6B8B");
                if (isHorror) return ratingRow("💀","Scare Factor:",skullFactor,setSkullFactor,hoverSkull,setHoverSkull,"sk_skull_factor",["Spooked","Creepy","Frightening","Terrifying","Nightmare Fuel"],"#5A2A2A");
                if (isFantasy) return ratingRow("🌍","World Building:",worldBuilding,setWorldBuilding,hoverWorld,setHoverWorld,"sk_world_building",["Surface","Layered","Rich","Immersive","Universe"],"#2A5A3A");
                if (isDarkRomance) return ratingRow("🖤","Dark Factor:",darkFactor,setDarkFactor,hoverDark,setHoverDark,"sk_dark_factor",["Soft","Moody","Intense","Twisted","Unhinged"],"#3A2A4A");
                if (isThriller) return (
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontFamily: "Georgia, serif", fontSize: 12, color: modalTheme.textMid, whiteSpace: "nowrap", minWidth: 60 }}>Lights Out:</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n}
                        onMouseEnter={() => setHoverLightsOut(n)}
                        onMouseLeave={() => setHoverLightsOut(0)}
                        onClick={() => {
                          const val = lightsOut === n ? 0 : n;
                          setLightsOut(val);
                          const all = (() => { try { return JSON.parse(localStorage.getItem("sk_lights_out") || "{}"); } catch { return {}; } })();
                          if (val === 0) delete all[isbn]; else all[isbn] = val;
                          localStorage.setItem("sk_lights_out", JSON.stringify(all));
                        }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 20, lineHeight: 1, opacity: (hoverLightsOut || lightsOut) >= n ? 1 : 0.25 }}
                      >🔦</button>
                    ))}
                  </div>
                  {lightsOut > 0 && <span style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#5A3A6B", fontStyle: "italic" }}>{["Nightlight","Flickering","Dim","Dark","Total Blackout"][lightsOut - 1]}</span>}
                </div>
                );
                return ratingRow("🌶️","Spice Level:",spice,setSpice,hoverSpice,setHoverSpice,"sk_spice",["Mild","Warm","Medium","Hot","🔥 Fiery"],modalTheme.accent);
              })()}

              {/* My Notes */}
              <div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: modalTheme.textMid, marginBottom: 6 }}>My Notes:</div>
                <textarea
                  value={notes}
                  onChange={e => {
                    setNotes(e.target.value);
                    const all = (() => { try { return JSON.parse(localStorage.getItem("sk_notes") || "{}"); } catch { return {}; } })();
                    all[isbn] = e.target.value;
                    localStorage.setItem("sk_notes", JSON.stringify(all));
                  }}
                  placeholder="Your thoughts, quotes, favourite moments…"
                  rows={4}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "8px 10px", borderRadius: 8,
                    border: "1px solid #C9A96E",
                    fontFamily: "Georgia, serif", fontSize: 13,
                    background: modalTheme.bgDeep, color: modalTheme.text,
                    resize: "vertical", lineHeight: 1.6,
                  }}
                />
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Delete from Library — bottom of modal */}
        {!confirmDelete && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #D8C3A5", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                padding: "7px 16px",
                background: "none",
                border: "1px solid #8B3A3A",
                borderRadius: 6,
                cursor: "pointer",
                color: "#8B3A3A",
                fontFamily: '"Palatino Linotype", Palatino, serif',
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: 0.85,
              }}
            >
              🗑️ Delete from Library
            </button>
          </div>
        )}

        {confirmDelete && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #D8C3A5", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
            <span style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, color: modalTheme.text }}>
              Delete from library?
            </span>
            <button
              onClick={() => { if (onDelete) onDelete(book); onClose(); }}
              style={{ padding: "6px 16px", background: "#8B3A3A", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 700 }}
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{ padding: "6px 16px", background: "#E8D9C0", color: modalTheme.text, border: "none", borderRadius: 6, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13 }}
            >
              Cancel
            </button>
          </div>
        )}

        </>}
      </div>
    </div>
  );
}

// Plant left-position % for each shelf row — varies so each shelf looks different
const SHELF_PLANT_POSITIONS = [10, 75, 20, 65, 30, 80, 15, 70, 25, 60];

const PLANT_IMAGES = ["plant2.png"];

function ShelfPlant({ plantIndex }) {
  const src = "/" + PLANT_IMAGES[plantIndex % PLANT_IMAGES.length];
  return (
    <img
      src={src}
      alt="plant"
      style={{
        width: 240,
        height: 520,
        objectFit: "contain",
        objectPosition: "bottom center",
        display: "block",
      }}
    />
  );
}

function LyingBookSpine({ book, index, rowIndex, onClick }) {
  const c = SPINE_COLORS[(rowIndex * 6 + index) % SPINE_COLORS.length];
  const width = 260 + ((rowIndex * 4 + index) % 4) * 16;
  // Stagger: each book shifts slightly left/right so the pile looks natural
  const staggerOffsets = [6, -4, 10, -8, 4, -6, 8, -2];
  const marginLeft = staggerOffsets[(rowIndex * 3 + index) % staggerOffsets.length];

  // Raised bands at same proportions as BookSpine (12%, 28%, 72%, 88%) but vertical
  const bands = [12, 28, 72, 88];

  return (
    <div
      onClick={() => onClick && onClick(book)}
      title={`${book.title} — ${book.author}`}
      style={{
        width,
        height: 52,
        marginLeft,
        background: `linear-gradient(to bottom, ${c.dark} 0%, ${c.base} 15%, ${c.mid} 50%, ${c.base} 85%, ${c.dark} 100%)`,
        borderRadius: "2px 2px 3px 3px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.7), 0 -1px 4px rgba(0,0,0,0.4), inset 0 3px 6px rgba(255,255,255,0.04)",
        position: "relative",
        flexShrink: 0,
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      {/* Worn leather texture — same as BookSpine */}
      <div style={{
        position: "absolute", inset: 0,
        background: `repeating-linear-gradient(85deg, transparent 0px, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)`,
        pointerEvents: "none",
      }} />

      {/* Raised bands — vertical ridges (horizontal equivalent of BookSpine's horizontal bands) */}
      {bands.map((pct, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${pct}%`,
          top: 0, bottom: 0,
          width: 7,
          background: `linear-gradient(to right,
            rgba(0,0,0,0.35) 0%,
            ${c.base} 20%,
            rgba(255,255,255,0.08) 50%,
            ${c.mid} 80%,
            rgba(0,0,0,0.3) 100%)`,
          boxShadow: "1px 0 2px rgba(0,0,0,0.4), -1px 0 1px rgba(0,0,0,0.3)",
          zIndex: 2,
        }} />
      ))}

      {/* Left corner flourish */}
      <div style={{
        position: "absolute", top: "50%", left: "15%",
        transform: "translateY(-50%) rotate(-90deg)",
        color: c.text, fontSize: 9, opacity: 0.7,
        zIndex: 3, lineHeight: 1,
        textShadow: "0 0 3px rgba(0,0,0,0.5)",
      }}>❧</div>

      {/* Right corner flourish */}
      <div style={{
        position: "absolute", top: "50%", right: "4%",
        transform: "translateY(-50%) rotate(90deg)",
        color: c.text, fontSize: 9, opacity: 0.7,
        zIndex: 3, lineHeight: 1,
      }}>❧</div>

      {/* Title */}
      <div style={{
        position: "absolute", top: "50%", left: "22%", right: "12%",
        transform: "translateY(-50%)",
        color: c.text,
        fontFamily: '"Palatino Linotype", Palatino, serif',
        fontWeight: 700, fontSize: 13,
        letterSpacing: "0.8px",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        textShadow: `0 0 8px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)`,
        opacity: 0.92,
        zIndex: 3,
      }}>
        {book.title}
      </div>

      {/* Author — tucked between last band and page edge */}
      <div style={{
        position: "absolute", top: "50%", right: "6%",
        transform: "translateY(-50%)",
        color: c.text, opacity: 0.65,
        fontFamily: '"Palatino Linotype", Palatino, serif',
        fontStyle: "italic", fontSize: 9,
        whiteSpace: "nowrap", overflow: "hidden", maxWidth: "8%",
        textShadow: "0 1px 3px rgba(0,0,0,0.8)",
        zIndex: 3,
      }}>
        {book.author}
      </div>

      {/* Top binding edge (spine side) */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 5,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(255,255,255,0.04) 60%, transparent)",
        borderRadius: "2px 2px 0 0",
        pointerEvents: "none", zIndex: 4,
      }} />

      {/* Bottom page-edge */}
      <div style={{
        position: "absolute", bottom: 0, left: 2, right: 2, height: 6,
        background: "linear-gradient(to top, #f5e6c8, #e8d5a0 60%, transparent)",
        borderRadius: "0 0 3px 3px",
        pointerEvents: "none",
      }} />

      {/* Left shadow edge */}
      <div style={{
        position: "absolute", top: 0, left: 0, bottom: 0, width: 5,
        background: "linear-gradient(to right, rgba(0,0,0,0.35), transparent)",
        pointerEvents: "none",
      }} />
    </div>
  );
}

function StackedBooks({ books, rowIndex, startColorIndex, onBookClick, mediaType }) {
  const count = 4;
  const isAudio = mediaType === "audiobooks";

  return (
    <div style={{
      flexShrink: 0,
      alignSelf: "flex-end",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: isAudio ? 3 : 2,
      marginLeft: 12,
      marginRight: 12,
    }}>
      {Array.from({ length: count }, (_, i) => {
        const book = books && books[i];
        if (book) {
          return isAudio
            ? <CDCase key={i} book={book} index={startColorIndex + i} rowIndex={rowIndex} onClick={onBookClick} />
            : <LyingBookSpine key={i} book={book} index={startColorIndex + i} rowIndex={rowIndex} onClick={onBookClick} />;
        }
        return isAudio
          ? <div key={i} style={{ width: 90, height: 90, flexShrink: 0 }} />
          : <div key={i} style={{ width: 160 + (i % 4) * 12, height: 34, flexShrink: 0 }} />;
      })}
      <div style={{ width: "85%", height: 4, alignSelf: "center", background: "radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 100%)", marginTop: 1 }} />
    </div>
  );
}


function BookShelf({ genre, mediaType, onClose, autoOpenBook, onAutoOpenDone }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterQuery, setFilterQuery] = useState("");
  const [sortBy, setSortBy] = useState(() => localStorage.getItem("sk_shelf_sort") || "default");

  const loadBooks = () => {
    const genreOverrides = (() => { try { return JSON.parse(localStorage.getItem("sk_genre_overrides") || "{}"); } catch { return {}; } })();
    const hiddenBooks = (() => { try { return new Set(JSON.parse(localStorage.getItem("sk_hidden_books") || "[]")); } catch { return new Set(); } })();
    const allBooks = (library[genre] || [])
      .filter(b => b.type === mediaType)
      .filter(b => (genreOverrides[b.isbn] || genre) === genre)
      .filter(b => !hiddenBooks.has(b.isbn || b.title));
    const overriddenToHere = Object.values(library).flat()
      .filter(b => b.type === mediaType && genreOverrides[b.isbn] === genre && !(library[genre] || []).some(lb => lb.isbn === b.isbn))
      .filter(b => !hiddenBooks.has(b.isbn || b.title));
    const userBooks = (() => {
      try {
        const all = JSON.parse(localStorage.getItem("sk_user_books")) || [];
        return all.filter(b => {
          const bookMedia = b.type || (b.mediaType === "audiobook" ? "audiobooks" : b.mediaType === "ebook" ? "ebooks" : b.mediaType);
          const effectiveGenre = genreOverrides[b.isbn || b.title] || b.genre;
          return effectiveGenre === genre && bookMedia === mediaType;
        });
      } catch { return []; }
    })();
    return [...allBooks, ...overriddenToHere, ...userBooks];
  };

  const [allShelfBooks, setAllShelfBooks] = useState(() => loadBooks());

  useEffect(() => {
    setAllShelfBooks(loadBooks());
  }, [refreshKey, genre, mediaType]);
  const sortBooks = (arr) => {
    if (sortBy === "title") return [...arr].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    if (sortBy === "author") return [...arr].sort((a, b) => {
      const aLast = (a.author || "").split(" ").pop().toLowerCase();
      const bLast = (b.author || "").split(" ").pop().toLowerCase();
      return aLast.localeCompare(bLast);
    });
    if (sortBy === "series") return [...arr].sort((a, b) => {
      const aS = (a.series || "").toLowerCase() || "zzz";
      const bS = (b.series || "").toLowerCase() || "zzz";
      if (aS !== bS) return aS.localeCompare(bS);
      return (a.title || "").localeCompare(b.title || "");
    });
    return arr;
  };

  const filtered = filterQuery.trim()
    ? allShelfBooks.filter(b =>
        b.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
        (b.author || "").toLowerCase().includes(filterQuery.toLowerCase())
      )
    : allShelfBooks;
  const books = sortBooks(filtered);

  const handleDelete = (book) => {
    const bookKey = book.isbn || book.title;
    // Check if it's a user-imported book
    const userBooksAll = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
    const isUser = userBooksAll.some(b => (b.isbn && b.isbn === book.isbn) || b.title === book.title);
    if (isUser) {
      const updated = userBooksAll.filter(b => !((b.isbn && b.isbn === book.isbn) || b.title === book.title));
      localStorage.setItem("sk_user_books", JSON.stringify(updated));
    } else {
      // Built-in book: add to hidden set
      const hidden = JSON.parse(localStorage.getItem("sk_hidden_books") || "[]");
      if (!hidden.includes(bookKey)) hidden.push(bookKey);
      localStorage.setItem("sk_hidden_books", JSON.stringify(hidden));
    }
    setRefreshKey(k => k + 1);
  };

  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    if (autoOpenBook) {
      setSelectedBook(autoOpenBook);
      if (onAutoOpenDone) onAutoOpenDone();
    }
  }, [autoOpenBook]);

  const favKey      = `sk_favorites_${mediaType}`;
  const statusKey   = `sk_statuses_${mediaType}`;
  const progressKey = `sk_progress_${mediaType}`;

  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`sk_favorites_${mediaType}`)) || {}; } catch { return {}; }
  });
  const [statuses, setStatuses] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`sk_statuses_${mediaType}`)) || {}; } catch { return {}; }
  });
  const [progress, setProgress] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`sk_progress_${mediaType}`)) || {}; } catch { return {}; }
  });

  useEffect(() => { localStorage.setItem(favKey,      JSON.stringify(favorites)); }, [favorites, favKey]);
  useEffect(() => { localStorage.setItem(statusKey,   JSON.stringify(statuses));  }, [statuses, statusKey]);
  useEffect(() => { localStorage.setItem(progressKey, JSON.stringify(progress));  }, [progress, progressKey]);

  // Split books into rows of 12
  const rows = [];
  const chunkSize = mediaType === "audiobooks" ? 16 : 12;
  const minRows = 3;
  for (let i = 0; i < books.length; i += chunkSize) {
    rows.push(books.slice(i, i + chunkSize));
  }
  while (rows.length < minRows) rows.push([]);

  const scrollRef = useRef(null);
  const [atTop, setAtTop] = useState(true);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 550,
        backgroundColor: "#F8F1E4",
        backgroundImage:
          'url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Back button — hidden when scrolled down */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 56,
          left: 20,
          padding: "8px 18px",
          borderRadius: "50px",
          border: "1px solid #8B5E3C",
          cursor: "pointer",
          background: '#F8F1E4 url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg") center/cover fixed',
          color: "#3A2A1A",
          fontFamily: '"Baskerville", "Book Antiqua", "Goudy Old Style", Georgia, serif',
          fontWeight: 700,
          fontStyle: "italic",
          fontSize: 15,
          letterSpacing: "0.5px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
          zIndex: 201,
          opacity: atTop ? 1 : 0,
          pointerEvents: atTop ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      >
        ← Return to Reading Nook
      </button>

      {/* Back to top button */}
      <button
        onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
        style={{
          position: "absolute",
          bottom: 28,
          right: 28,
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "1px solid #8B5E3C",
          cursor: "pointer",
          background: '#F8F1E4 url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg") center/cover fixed',
          color: "#3A2A1A",
          fontSize: 20,
          boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
          zIndex: 201,
          opacity: atTop ? 0 : 1,
          pointerEvents: atTop ? "none" : "auto",
          transition: "opacity 0.25s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title="Back to top"
      >
        ↑
      </button>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        onScroll={(e) => setAtTop(e.currentTarget.scrollTop < 40)}
        style={{ position: "absolute", inset: 0, overflowY: "auto", padding: "60px 40px 30px" }}
      >

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 30, paddingTop: 10 }}>
        <h1 style={{
          fontFamily: '"Palatino Linotype", Palatino, serif',
          color: "#3A2A1A",
          fontSize: 34,
          letterSpacing: "1.5px",
          marginBottom: 6,
        }}>
          {mediaType === "ebooks" ? "📚" : "🎧"} {genre}
        </h1>
        <p style={{
          fontFamily: '"Palatino Linotype", Palatino, serif',
          color: "#4B3A2A",
          fontStyle: "italic",
          fontSize: 15,
        }}>
          {mediaType === "ebooks" ? "📘" : "🎧"} {filterQuery ? `${books.length} of ${allShelfBooks.length}` : books.length} {mediaType === "ebooks" ? "eBooks" : "Audiobooks"} in this collection
        </p>

        {/* Filter + Sort bar */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.7)", border: "1px solid #C4A882",
            borderRadius: 20, padding: "5px 14px", flex: "1 1 220px", maxWidth: 340,
          }}>
            <span style={{ fontSize: 13, opacity: 0.5, color: "#5a3a1a" }}>🔍</span>
            <input
              type="text"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder="Filter by title or author…"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13,
                color: "#3A2A1A", fontStyle: filterQuery ? "normal" : "italic",
              }}
            />
            {filterQuery && (
              <button onMouseDown={() => setFilterQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#8B5E3C", fontSize: 14, padding: 0, lineHeight: 1 }}>✕</button>
            )}
          </div>
          {/* Sort buttons */}
          <div style={{ display: "flex", gap: 4 }}>
            {[["default", "Default"], ["title", "A–Z Title"], ["author", "A–Z Author"], ["series", "Series"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => { setSortBy(val); localStorage.setItem("sk_shelf_sort", val); }}
                style={{
                  padding: "5px 10px",
                  borderRadius: 14,
                  border: `1px solid ${sortBy === val ? "#8B5E3C" : "#C4A882"}`,
                  background: sortBy === val ? "#8B5E3C" : "rgba(255,255,255,0.7)",
                  color: sortBy === val ? "#F8F1E4" : "#5a3a1a",
                  fontFamily: '"Palatino Linotype", Palatino, serif',
                  fontSize: 12,
                  cursor: "pointer",
                  fontWeight: sortBy === val ? 700 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookshelves */}
      <div style={{ maxWidth: 1050, margin: "0 auto", paddingRight: mediaType === "audiobooks" ? 0 : 160 }}>
        {rows.map((row, rowIndex) => {
          if (mediaType === "audiobooks") {
            // Alternate plant position: left, right, middle
            const audioPlantConfigs = [
              { x: 870, skipIdx: 8 }, // even rows: plant on right
              { x: 50,  skipIdx: 0 }, // odd rows: plant on left
            ];
            const { x: plantPx, skipIdx } = audioPlantConfigs[rowIndex % 2];

            const renderAudioRow = (source, startIdx, rowMultiplier) => {
              const slots = [];
              let bookIdx = 0;
              for (let slot = 0; slot < 9; slot++) {
                if (slot === skipIdx) {
                  slots.push(<div key={`spacer-${slot}`} style={{ width: 96, flexShrink: 0 }} />);
                } else {
                  const book = source[bookIdx++];
                  if (book) {
                    slots.push(<CDCase key={slot} book={book} index={startIdx + slot} rowIndex={rowMultiplier} onClick={setSelectedBook} />);
                  } else {
                    slots.push(<div key={slot} style={{ width: 90, height: 90, flexShrink: 0 }} />);
                  }
                }
              }
              return slots;
            };

            return (
              <div key={rowIndex} style={{ marginBottom: 0, position: "relative", overflow: "visible" }}>
                {/* Top row of CDs */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, padding: "0 16px", flexWrap: "nowrap", overflow: "hidden", minHeight: 100 }}>
                  {renderAudioRow(row.slice(0, 8), 0, rowIndex * 2)}
                </div>
                {/* Shelf between rows */}
                <img src="/shelf2.jpg" alt="shelf" style={{ width: 920, height: 28, objectFit: "cover", objectPosition: "center center", display: "block", boxShadow: "0 6px 14px rgba(0,0,0,0.4)", position: "relative", zIndex: 5 }} />
                <div style={{ height: 6, background: "linear-gradient(to bottom, rgba(0,0,0,0.18), transparent)", width: 920 }} />

                {/* Bottom row of CDs */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, padding: "0 16px", flexWrap: "nowrap", overflow: "hidden", minHeight: 100 }}>
                  {renderAudioRow(row.slice(8, 16), 8, rowIndex * 2 + 1)}
                </div>

                {/* Plant */}
                <div style={{ position: "absolute", bottom: -90, left: plantPx, transform: "translateX(-50%)", zIndex: 15, pointerEvents: "none" }}>
                  <ShelfPlant plantIndex={rowIndex} />
                </div>

                {/* Shelf below */}
                <img src="/shelf2.jpg" alt="shelf" style={{ width: 920, height: 28, objectFit: "cover", objectPosition: "center center", display: "block", boxShadow: "0 6px 14px rgba(0,0,0,0.4)", position: "relative", zIndex: 5 }} />
                <div style={{ height: 8, background: "linear-gradient(to bottom, rgba(0,0,0,0.18), transparent)", marginBottom: 32 }} />
              </div>
            );
          }

          const layout = rowIndex % 3;

          // Fixed slot counts per layout — never changes regardless of book count
          const UPRIGHT_COUNT = 8;
          const STACK_COUNT = 4;

          const leftBooks  = layout === 2 ? row.slice(0, STACK_COUNT)                        : (layout === 0 ? row.slice(0, UPRIGHT_COUNT) : []);
          const stackBooks = layout === 2 ? row.slice(STACK_COUNT, STACK_COUNT * 2)          : row.slice(UPRIGHT_COUNT, UPRIGHT_COUNT + STACK_COUNT);
          const rightBooks = layout === 2 ? row.slice(STACK_COUNT * 2, STACK_COUNT * 3)      : (layout === 0 ? [] : row.slice(0, UPRIGHT_COUNT));

          // Fixed plant positions based on full-capacity layout
          const FIXED_PLANT = {
            0: { x: 582, bottom: -90  }, // 8 upright left, plant in gap, stack right
            1: { x: 950, bottom: -100 }, // stack left, plant far right
            2: { x: 317, bottom: -110 }, // 4 upright left, plant in gap, stack + 4 right
          };
          const { x: plantPxFixed, bottom: plantBottom } = FIXED_PLANT[layout];
          const plantX = plantPxFixed + "px";

          const renderUpright = (books, count, startIdx) =>
            Array.from({ length: count }, (_, i) => {
              const book = books[i];
              return book
                ? <BookSpine key={i} book={book} index={startIdx + i} rowIndex={rowIndex} onClick={setSelectedBook} />
                : <div key={i} style={{ width: 58, height: 200, flexShrink: 0 }} />;
            });

          return (
            <div key={rowIndex} style={{ marginBottom: 0, position: "relative", overflow: "visible" }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-start", gap: 4, padding: "0 12px", flexWrap: "nowrap", overflow: "hidden", minHeight: 230 }}>
                {layout === 0 && <>
                  {renderUpright(leftBooks, UPRIGHT_COUNT, 0)}
                  <div style={{ marginLeft: "auto", marginRight: 60 }}>
                    <StackedBooks books={stackBooks} rowIndex={rowIndex} startColorIndex={UPRIGHT_COUNT} onBookClick={setSelectedBook} mediaType={mediaType} />
                  </div>
                </>}
                {layout === 1 && <>
                  <div style={{ marginRight: 8 }}>
                    <StackedBooks books={stackBooks} rowIndex={rowIndex} startColorIndex={0} onBookClick={setSelectedBook} mediaType={mediaType} />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginRight: 60 }}>
                    {renderUpright(rightBooks, UPRIGHT_COUNT, STACK_COUNT)}
                  </div>
                </>}
                {layout === 2 && <>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
                    {renderUpright(leftBooks, STACK_COUNT, 0)}
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <StackedBooks books={stackBooks} rowIndex={rowIndex} startColorIndex={STACK_COUNT} onBookClick={setSelectedBook} mediaType={mediaType} />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginLeft: 16, marginRight: 60 }}>
                    {renderUpright(rightBooks, STACK_COUNT, STACK_COUNT * 2)}
                  </div>
                </>}
              </div>

              <div style={{ position: "absolute", bottom: plantBottom, left: plantX, transform: "translateX(-50%)", zIndex: 15, pointerEvents: "none" }}>
                <ShelfPlant plantIndex={rowIndex} />
              </div>

              <img src="/shelf2.jpg" alt="shelf" style={{ width: "100%", height: 28, objectFit: "cover", objectPosition: "center center", display: "block", boxShadow: "0 6px 14px rgba(0,0,0,0.4)", position: "relative", zIndex: 5 }} />
              <div style={{ height: 8, background: "linear-gradient(to bottom, rgba(0,0,0,0.18), transparent)", marginBottom: 32 }} />
            </div>
          );
        })}

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

      </div>{/* end scrollable content */}

      {/* Book detail modal */}
      {selectedBook && (
        <BookModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          favorites={favorites}
          setFavorites={setFavorites}
          statuses={statuses}
          setStatuses={setStatuses}
          progress={progress}
          setProgress={setProgress}
          mediaType={mediaType}
          onDelete={handleDelete}
          onBookEdited={() => {
            setRefreshKey(k => k + 1);
          }}
        />
      )}
    </div>
  );
}

function FavoritesShelf({ onClose }) {
  const [selectedBook, setSelectedBook] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDelete = (book) => {
    const bookKey = book.isbn || book.title;
    const userBooksAll = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
    const isUser = userBooksAll.some(b => (b.isbn && b.isbn === book.isbn) || b.title === book.title);
    if (isUser) {
      const updated = userBooksAll.filter(b => !((b.isbn && b.isbn === book.isbn) || b.title === book.title));
      localStorage.setItem("sk_user_books", JSON.stringify(updated));
    } else {
      const hidden = JSON.parse(localStorage.getItem("sk_hidden_books") || "[]");
      if (!hidden.includes(bookKey)) hidden.push(bookKey);
      localStorage.setItem("sk_hidden_books", JSON.stringify(hidden));
    }
    setRefreshKey(k => k + 1);
  };

  // Merge ebook + audiobook favorites — re-read from localStorage when refreshKey changes
  const readFavorites = () => {
    try {
      const eb = JSON.parse(localStorage.getItem("sk_favorites_ebooks")) || {};
      const ab = JSON.parse(localStorage.getItem("sk_favorites_audiobooks")) || {};
      return { ...eb, ...ab };
    } catch { return {}; }
  };
  const [favorites, setFavorites] = useState(readFavorites);
  useEffect(() => { setFavorites(readFavorites()); }, [refreshKey]);
  const [statuses, setStatuses] = useState(() => {
    try {
      const eb = JSON.parse(localStorage.getItem("sk_statuses_ebooks")) || {};
      const ab = JSON.parse(localStorage.getItem("sk_statuses_audiobooks")) || {};
      return { ...eb, ...ab };
    } catch { return {}; }
  });
  const [progress, setProgress] = useState(() => {
    try {
      const eb = JSON.parse(localStorage.getItem("sk_progress_ebooks")) || {};
      const ab = JSON.parse(localStorage.getItem("sk_progress_audiobooks")) || {};
      return { ...eb, ...ab };
    } catch { return {}; }
  });

  // Collect all favorited books — built-in library + user-imported
  const favoritedBooks = [];

  // Built-in library books
  Object.values(library).forEach((genreBooks) => {
    genreBooks.forEach((book) => {
      const key = book.isbn || book.title;
      if (favorites[key]) favoritedBooks.push(book);
    });
  });

  // User-imported books
  try {
    const userBooks = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
    userBooks.forEach((book) => {
      const key = book.isbn || book.title;
      if (favorites[key] && !favoritedBooks.some(b => (b.isbn && b.isbn === book.isbn) || b.title === book.title)) {
        favoritedBooks.push(book);
      }
    });
  } catch { /* ignore */ }

  // Split into rows of 12
  const rows = [];
  for (let i = 0; i < favoritedBooks.length; i += 12) {
    rows.push(favoritedBooks.slice(i, i + 12));
  }

  const scrollRef = useRef(null);
  const [atTop, setAtTop] = useState(true);

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
      }}
    >
      {/* Back button — hidden when scrolled down */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 56,
          left: 20,
          padding: "8px 18px",
          borderRadius: "50px",
          border: "1px solid #8B5E3C",
          cursor: "pointer",
          background: '#F8F1E4 url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg") center/cover fixed',
          color: "#3A2A1A",
          fontFamily: '"Baskerville", "Book Antiqua", "Goudy Old Style", Georgia, serif',
          fontWeight: 700,
          fontStyle: "italic",
          fontSize: 15,
          letterSpacing: "0.5px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
          zIndex: 201,
          opacity: atTop ? 1 : 0,
          pointerEvents: atTop ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      >
        ← Return to Reading Nook
      </button>

      {/* Back to top button */}
      <button
        onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
        style={{
          position: "absolute",
          bottom: 28,
          right: 28,
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "1px solid #8B5E3C",
          cursor: "pointer",
          background: '#F8F1E4 url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg") center/cover fixed',
          color: "#3A2A1A",
          fontSize: 20,
          boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
          zIndex: 201,
          opacity: atTop ? 0 : 1,
          pointerEvents: atTop ? "none" : "auto",
          transition: "opacity 0.25s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title="Back to top"
      >
        ↑
      </button>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        onScroll={(e) => setAtTop(e.currentTarget.scrollTop < 40)}
        style={{ position: "absolute", inset: 0, overflowY: "auto", padding: "60px 40px 30px" }}
      >

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 30, paddingTop: 10 }}>
        <h1 style={{
          fontFamily: '"Palatino Linotype", Palatino, serif',
          color: "#3A2A1A",
          fontSize: 34,
          letterSpacing: "1.5px",
          marginBottom: 6,
        }}>
          ♥ My Favorites
        </h1>
        <p style={{
          fontFamily: '"Palatino Linotype", Palatino, serif',
          color: "#4B3A2A",
          fontStyle: "italic",
          fontSize: 15,
        }}>
          Your most beloved books, all in one place
        </p>
      </div>

      {/* Bookshelves */}
      <div style={{ maxWidth: 1050, margin: "0 auto", paddingRight: 160 }}>
        {favoritedBooks.length === 0 ? (
          <p style={{
            textAlign: "center",
            fontFamily: '"Palatino Linotype", Palatino, serif',
            fontStyle: "italic",
            color: "#6B4E32",
            fontSize: 16,
            marginTop: 40,
          }}>
            You haven&apos;t added any favorites yet. Click the ♡ on any book to add it here.
          </p>
        ) : (
          rows.map((row, rowIndex) => {
            const layout = rowIndex % 3;
            const plantLeft = SHELF_PLANT_POSITIONS[rowIndex % SHELF_PLANT_POSITIONS.length];
            const third = Math.max(2, Math.floor(row.length / 3));
            const leftBooks  = layout === 2 ? row.slice(0, third)         : (layout === 0 ? row.slice(0, -Math.min(4, row.length)) : []);
            const stackBooks = layout === 2 ? row.slice(third, third * 2) : row.slice(-Math.min(4, row.length));
            const rightBooks = layout === 2 ? row.slice(third * 2)        : (layout === 0 ? [] : row.slice(0, -Math.min(4, row.length)));
            const hasStack   = row.length >= 6;
            const renderUpright = (books, startIdx) => books.map((book, i) => (
              <BookSpine key={i} book={book} index={startIdx + i} rowIndex={rowIndex} onClick={setSelectedBook} />
            ));
            const bookW = 62;
            const stackW = 300;
            const padL = 24;
            const containerW = 890;
            let plantPx;
            if (layout === 0) plantPx = padL + leftBooks.length * bookW + 60;
            else if (layout === 1) plantPx = padL + stackW + 24;
            else plantPx = padL + leftBooks.length * bookW + stackW + 16;
            const plantX = Math.min(plantPx, 950) + "px";
            const plantBottom = layout === 0 ? -90 : layout === 1 ? -100 : -110;
            return (
              <div key={rowIndex} style={{ marginBottom: 0, position: "relative", overflow: "visible" }}>
                <div style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "flex-start",
                  gap: 4,
                  padding: "0 12px",
                  flexWrap: "nowrap",
                  overflow: "hidden",
                  minHeight: 230,
                }}>
                  {layout === 0 && <>
                    {renderUpright(leftBooks, 0)}
                    {hasStack && <div style={{ marginLeft: "auto", marginRight: 60 }}>
                      <StackedBooks books={stackBooks} rowIndex={rowIndex} startColorIndex={leftBooks.length} onBookClick={setSelectedBook} mediaType={stackBooks[0]?.type || "ebooks"} />
                    </div>}
                  </>}
                  {layout === 1 && <>
                    {hasStack && <div style={{ marginRight: 8 }}>
                      <StackedBooks books={stackBooks} rowIndex={rowIndex} startColorIndex={rightBooks.length} onBookClick={setSelectedBook} mediaType={stackBooks[0]?.type || "ebooks"} />
                    </div>}
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginRight: 60 }}>
                      {renderUpright(rightBooks, 0)}
                    </div>
                  </>}
                  {layout === 2 && <>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>{renderUpright(leftBooks, 0)}</div>
                    {hasStack && <div style={{ marginLeft: "auto" }}>
                      <StackedBooks books={stackBooks} rowIndex={rowIndex} startColorIndex={leftBooks.length} onBookClick={setSelectedBook} mediaType={stackBooks[0]?.type || "ebooks"} />
                    </div>}
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginLeft: 16, marginRight: 60 }}>{renderUpright(rightBooks, leftBooks.length + stackBooks.length)}</div>
                  </>}
                </div>

                <div style={{ position: "absolute", bottom: plantBottom, left: plantX, transform: "translateX(-50%)", zIndex: 15, pointerEvents: "none" }}>
                  <ShelfPlant plantIndex={rowIndex} />
                </div>

                <img
                  src="/shelf2.jpg"
                  alt="shelf"
                  style={{ width: "100%", height: 28, objectFit: "cover", objectPosition: "center center", display: "block", boxShadow: "0 6px 14px rgba(0,0,0,0.4)", position: "relative", zIndex: 5 }}
                />
                <div style={{ height: 8, background: "linear-gradient(to bottom, rgba(0,0,0,0.18), transparent)", marginBottom: 32 }} />
              </div>
            );
          })
        )}
      </div>

      </div>{/* end scrollable content */}

      {/* Book detail modal */}
      {selectedBook && (
        <BookModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          favorites={favorites}
          setFavorites={setFavorites}
          statuses={statuses}
          setStatuses={setStatuses}
          progress={progress}
          setProgress={setProgress}
          mediaType={selectedBook.type}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function TBRShelf({ onClose }) {
  const th = SK_THEMES[localStorage.getItem("sk_theme") || "firelight"] || SK_THEMES.firelight;
  const [tbrBooks, setTbrBooks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sk_tbr_books") || "[]"); } catch { return []; }
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [uploadCover, setUploadCover] = useState(null);
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [msg, setMsg] = useState("");
  const [moveTarget, setMoveTarget] = useState(null); // { book, index }
  const [moveMediaType, setMoveMediaType] = useState("ebooks");
  const coverUploadRef = useRef(null);
  const scrollRef = useRef(null);
  const [atTop, setAtTop] = useState(true);

  const saveTbr = (books) => {
    setTbrBooks(books);
    localStorage.setItem("sk_tbr_books", JSON.stringify(books));
  };

  const addBook = (book) => {
    const already = tbrBooks.some(b => (b.isbn && b.isbn === book.isbn) || b.title === book.title);
    if (already) { setMsg("Already on your TBR!"); setTimeout(() => setMsg(""), 2000); return; }
    const updated = [...tbrBooks, { ...book, addedAt: Date.now() }];
    saveTbr(updated);
    setSearchQuery(""); setSearchResults([]); setShowSearch(false);
    setMsg(`"${book.title}" added to TBR!`); setTimeout(() => setMsg(""), 2500);
  };

  const removeBook = (index) => {
    const updated = tbrBooks.filter((_, i) => i !== index);
    saveTbr(updated);
  };

  const confirmMoveToLibrary = (platformId) => {
    const { book, index } = moveTarget;
    const isAudio = moveMediaType === "audiobooks";
    const userBooks = (() => { try { return JSON.parse(localStorage.getItem("sk_user_books") || "[]"); } catch { return []; } })();
    const already = userBooks.some(b => (b.isbn && b.isbn === book.isbn) || b.title === book.title);
    if (!already) {
      userBooks.push({
        ...book,
        type: moveMediaType,
        mediaType: isAudio ? "audiobook" : "ebook",
        platform: platformId,
        status: "unread",
        addedAt: Date.now(),
      });
      localStorage.setItem("sk_user_books", JSON.stringify(userBooks));
    }
    removeBook(index);
    setMoveTarget(null);
    setMsg(`"${book.title}" added to your library!`); setTimeout(() => setMsg(""), 2500);
  };

  const searchBooks = async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);

    // Search local cache first
    const lower = q.toLowerCase();
    const localHits = [];
    Object.values(library).forEach(genreBooks => {
      genreBooks.forEach(b => {
        if ((b.title?.toLowerCase().includes(lower) || b.author?.toLowerCase().includes(lower)) &&
            !localHits.some(h => h.isbn === b.isbn && h.title === b.title)) {
          localHits.push(b);
        }
      });
    });
    const userBooks = (() => { try { return JSON.parse(localStorage.getItem("sk_user_books") || "[]"); } catch { return []; } })();
    userBooks.forEach(b => {
      if ((b.title?.toLowerCase().includes(lower) || b.author?.toLowerCase().includes(lower)) &&
          !localHits.some(h => h.isbn === b.isbn && h.title === b.title)) {
        localHits.push(b);
      }
    });

    if (localHits.length >= 5) {
      setSearchResults(localHits.slice(0, 10));
      setSearching(false);
      return;
    }

    // Fetch Google Books and Open Library in parallel
    const gKey = localStorage.getItem("sk_google_api_key") || "";
    const keySuffix = gKey ? `&key=${gKey}` : "";

    const [gData, olData] = await Promise.allSettled([
      fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10&langRestrict=en${keySuffix}`).then(r => r.json()),
      fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=10&fields=title,author_name,isbn,cover_i`).then(r => r.json()),
    ]);

    const gResults = gData.status === "fulfilled"
      ? (gData.value.items || []).map(item => ({
          title: item.volumeInfo?.title || "Unknown",
          author: (item.volumeInfo?.authors || []).join(", "),
          isbn: item.volumeInfo?.industryIdentifiers?.find(i => i.type === "ISBN_13")?.identifier || "",
          cover: item.volumeInfo?.imageLinks?.thumbnail?.replace("http:", "https:") || null,
          description: item.volumeInfo?.description || "",
          source: "Google Books",
        }))
      : [];

    const olResults = olData.status === "fulfilled"
      ? (olData.value.docs || []).map(doc => ({
          title: doc.title || "Unknown",
          author: (doc.author_name || []).join(", "),
          isbn: (doc.isbn || [])[0] || "",
          cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
          source: "Open Library",
        }))
      : [];

    // Merge: local first, then Google Books, then Open Library — deduplicate by title
    const seen = new Set(localHits.map(b => b.title.toLowerCase()));
    const merged = [...localHits];
    for (const b of [...gResults, ...olResults]) {
      if (!seen.has(b.title.toLowerCase())) {
        seen.add(b.title.toLowerCase());
        merged.push(b);
      }
    }
    setSearchResults(merged.slice(0, 15));
    setSearching(false);
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxH = 300;
        const scale = Math.min(maxH / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        setUploadCover(canvas.toDataURL("image/jpeg", 0.85));
        setShowManual(true);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Rows of 4 for display
  const rows = [];
  for (let i = 0; i < tbrBooks.length; i += 4) rows.push(tbrBooks.slice(i, i + 4));

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      backgroundColor: "#F8F1E4",
      backgroundImage: 'url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg")',
      backgroundSize: "cover", backgroundPosition: "center",
    }}>
      <button onClick={onClose} style={{
        position: "absolute", top: 56, left: 20,
        padding: "8px 18px", borderRadius: "50px", border: "1px solid #8B5E3C",
        cursor: "pointer",
        background: '#F8F1E4 url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg") center/cover fixed',
        color: "#3A2A1A",
        fontFamily: '"Baskerville", "Book Antiqua", "Goudy Old Style", Georgia, serif',
        fontWeight: 700, fontStyle: "italic", fontSize: 15, letterSpacing: "0.5px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.12)", zIndex: 201,
        opacity: atTop ? 1 : 0, pointerEvents: atTop ? "auto" : "none", transition: "opacity 0.25s ease",
      }}>← Return to Reading Nook</button>

      <button onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })} style={{
        position: "fixed", bottom: 32, right: 20, zIndex: 202,
        background: "#8B5E3C", border: "none", borderRadius: "50%", width: 40, height: 40,
        color: "#fff", fontSize: 18, cursor: "pointer",
        opacity: atTop ? 0 : 1, pointerEvents: atTop ? "none" : "auto", transition: "opacity 0.25s ease",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>↑</button>

      <div ref={scrollRef} onScroll={e => setAtTop(e.currentTarget.scrollTop < 40)}
        style={{ height: "100%", overflowY: "auto", paddingTop: 100, paddingBottom: 60 }}>

        <h1 style={{
          textAlign: "center", fontFamily: '"Baskerville", "Book Antiqua", Georgia, serif',
          fontSize: 28, color: "#3A2A1A", marginBottom: 4, fontStyle: "italic",
        }}>📚 My TBR Shelf</h1>
        <p style={{ textAlign: "center", fontSize: 13, color: "#6B4C2A", marginBottom: 24, fontFamily: "Georgia, serif" }}>
          Books you want to read — your wishlist, all in one place.
        </p>

        {/* Add buttons */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20, paddingInline: 20 }}>
          <button onClick={() => { setShowSearch(v => !v); setShowManual(false); }}
            style={{ flex: 1, maxWidth: 180, padding: "10px 16px", borderRadius: 8, border: "1px solid #8B5E3C", background: showSearch ? "#8B5E3C" : "rgba(255,255,255,0.6)", color: showSearch ? "#fff" : "#3A2A1A", cursor: "pointer", fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif', fontWeight: 600 }}>
            🔍 Search Books
          </button>
          <button onClick={() => { setShowManual(v => !v); setShowSearch(false); setUploadCover(null); setManualTitle(""); setManualAuthor(""); }}
            style={{ flex: 1, maxWidth: 180, padding: "10px 16px", borderRadius: 8, border: "1px solid #8B5E3C", background: showManual ? "#8B5E3C" : "rgba(255,255,255,0.6)", color: showManual ? "#fff" : "#3A2A1A", cursor: "pointer", fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif', fontWeight: 600 }}>
            ✏️ Add Manually
          </button>
        </div>

        {msg && <div style={{ textAlign: "center", fontSize: 13, color: "#5C3A1E", marginBottom: 12, fontStyle: "italic", fontFamily: "Georgia, serif" }}>{msg}</div>}

        {/* Search panel */}
        {showSearch && (
          <div style={{ marginInline: 20, marginBottom: 20, background: "rgba(255,255,255,0.75)", borderRadius: 12, padding: 16, backdropFilter: "blur(4px)" }}>
            <input
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); searchBooks(e.target.value); }}
              placeholder="Search by title or author..."
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: "1px solid #C4A882", background: "rgba(255,255,255,0.9)", fontSize: 14, fontFamily: "Georgia, serif", outline: "none" }}
            />
            {searching && <div style={{ textAlign: "center", padding: 12, color: "#8B5E3C", fontSize: 13 }}>Searching...</div>}
            {searchResults.map((book, i) => (
              <div key={i} onClick={() => addBook(book)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                borderBottom: "1px solid #D4B896", cursor: "pointer",
              }}>
                {book.cover
                  ? <img src={book.cover} alt="" style={{ width: 36, height: 52, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
                  : <div style={{ width: 36, height: 52, background: "#C4A882", borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📖</div>
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#3A2A1A", fontFamily: "Georgia, serif" }}>{book.title}</div>
                  {book.author && <div style={{ fontSize: 11, color: "#6B4C2A" }}>{book.author}</div>}
                </div>
                <div style={{ fontSize: 11, color: "#8B5E3C", fontWeight: 600 }}>+ Add</div>
              </div>
            ))}
          </div>
        )}

        {/* Manual add panel */}
        {showManual && (
          <div style={{ marginInline: 20, marginBottom: 20, background: "rgba(255,255,255,0.75)", borderRadius: 12, padding: 16, backdropFilter: "blur(4px)" }}>
            <input ref={coverUploadRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverUpload} />
            <div onClick={() => coverUploadRef.current?.click()} style={{
              width: 80, height: 110, margin: "0 auto 14px", borderRadius: 6,
              border: "2px dashed #8B5E3C", background: uploadCover ? "none" : "rgba(255,255,255,0.5)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
            }}>
              {uploadCover
                ? <img src={uploadCover} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ textAlign: "center", color: "#8B5E3C", fontSize: 11 }}>📷<br/>Upload<br/>Cover</div>
              }
            </div>
            <input value={manualTitle} onChange={e => setManualTitle(e.target.value)} placeholder="Book title *"
              style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: "1px solid #C4A882", background: "rgba(255,255,255,0.9)", fontSize: 13, fontFamily: "Georgia, serif", outline: "none", marginBottom: 8 }} />
            <input value={manualAuthor} onChange={e => setManualAuthor(e.target.value)} placeholder="Author"
              style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: "1px solid #C4A882", background: "rgba(255,255,255,0.9)", fontSize: 13, fontFamily: "Georgia, serif", outline: "none", marginBottom: 12 }} />
            <button onClick={() => {
              if (!manualTitle.trim()) { setMsg("Please enter a title."); setTimeout(() => setMsg(""), 2000); return; }
              addBook({ title: manualTitle.trim(), author: manualAuthor.trim(), cover: uploadCover || null });
              setManualTitle(""); setManualAuthor(""); setUploadCover(null); setShowManual(false);
            }} style={{ width: "100%", padding: "10px", borderRadius: 8, background: "#8B5E3C", border: "none", color: "#fff", fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif', fontWeight: 600, cursor: "pointer" }}>
              Add to TBR
            </button>
          </div>
        )}

        {/* TBR books grid */}
        {tbrBooks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#6B4C2A", fontFamily: "Georgia, serif", fontSize: 14, fontStyle: "italic" }}>
            Your TBR shelf is empty. Search for books or add them manually above!
          </div>
        ) : (
          rows.map((row, ri) => (
            <div key={ri} style={{ marginBottom: 40, paddingInline: 12 }}>
              {/* Shelf row */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-start", flexWrap: "wrap" }}>
                {row.map((book, bi) => {
                  const idx = ri * 4 + bi;
                  return (
                    <div key={idx} style={{ width: "calc(25% - 8px)", minWidth: 70, maxWidth: 100, position: "relative" }}>
                      <div style={{ position: "relative", paddingBottom: 8 }}>
                        {book.cover
                          ? <img src={book.cover} alt={book.title} style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", borderRadius: 4, boxShadow: "2px 3px 8px rgba(0,0,0,0.25)", display: "block" }} />
                          : <div style={{ width: "100%", aspectRatio: "2/3", background: "linear-gradient(135deg, #8B5E3C, #C4A882)", borderRadius: 4, boxShadow: "2px 3px 8px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", padding: 6, boxSizing: "border-box" }}>
                              <span style={{ fontSize: 10, color: "#fff", textAlign: "center", fontFamily: "Georgia, serif", lineHeight: 1.3 }}>{book.title}</span>
                            </div>
                        }
                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                          <button onClick={() => { setMoveTarget({ book, index: idx }); setMoveMediaType("ebooks"); }} title="Move to library"
                            style={{ flex: 1, padding: "4px 0", borderRadius: 4, background: "#8B5E3C", border: "none", color: "#fff", fontSize: 9, cursor: "pointer", fontFamily: "Georgia, serif" }}>
                            + Library
                          </button>
                          <button onClick={() => removeBook(idx)} title="Remove"
                            style={{ width: 24, padding: "4px 0", borderRadius: 4, background: "rgba(0,0,0,0.15)", border: "none", color: "#3A2A1A", fontSize: 11, cursor: "pointer" }}>
                            ×
                          </button>
                        </div>
                        <div style={{ fontSize: 9, color: "#3A2A1A", textAlign: "center", marginTop: 4, fontFamily: "Georgia, serif", lineHeight: 1.2, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {book.title}
                        </div>
                        {book.author && <div style={{ fontSize: 8, color: "#6B4C2A", textAlign: "center", marginTop: 2, fontFamily: "Georgia, serif" }}>{book.author}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Shelf plank */}
              <div style={{ height: 14, background: "linear-gradient(to bottom, #8B5E3C, #6B4326)", borderRadius: "0 0 4px 4px", boxShadow: "0 4px 8px rgba(0,0,0,0.3)", marginTop: 2 }} />
            </div>
          ))
        )}
      </div>

      {/* Move to Library modal */}
      {moveTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setMoveTarget(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#F8F1E4", borderRadius: 16, padding: 24, width: "100%", maxWidth: 340,
            fontFamily: '"Palatino Linotype", Palatino, serif',
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, color: "#3A2A1A", textAlign: "center" }}>Add to Library</h3>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: "#6B4C2A", textAlign: "center", fontStyle: "italic" }}>"{moveTarget.book.title}"</p>

            {/* eBook or Audiobook */}
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6B4C2A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Format</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[{ id: "ebooks", label: "📖 eBook" }, { id: "audiobooks", label: "🎧 Audiobook" }].map(opt => (
                <button key={opt.id} onClick={() => setMoveMediaType(opt.id)} style={{
                  flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 13, cursor: "pointer",
                  fontFamily: '"Palatino Linotype", Palatino, serif', fontWeight: 600,
                  background: moveMediaType === opt.id ? "#8B5E3C" : "rgba(255,255,255,0.6)",
                  color: moveMediaType === opt.id ? "#fff" : "#3A2A1A",
                  border: `1px solid ${moveMediaType === opt.id ? "#8B5E3C" : "#C4A882"}`,
                }}>{opt.label}</button>
              ))}
            </div>

            {/* Platform selection */}
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6B4C2A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Where did you get it?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto" }}>
              {(moveMediaType === "audiobooks" ? AUDIO_PLATFORMS : EBOOK_PLATFORMS).map(p => (
                <button key={p.id} onClick={() => confirmMoveToLibrary(p.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8,
                  background: "rgba(255,255,255,0.7)", border: "1px solid #C4A882",
                  cursor: "pointer", textAlign: "left", fontFamily: '"Palatino Linotype", Palatino, serif',
                }}>
                  <span style={{ fontSize: 20 }}>{p.emoji}</span>
                  <span style={{ fontSize: 13, color: "#3A2A1A", fontWeight: 600 }}>{p.name}</span>
                </button>
              ))}
              <button onClick={() => confirmMoveToLibrary("other")} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8,
                background: "rgba(255,255,255,0.7)", border: "1px solid #C4A882",
                cursor: "pointer", textAlign: "left", fontFamily: '"Palatino Linotype", Palatino, serif',
              }}>
                <span style={{ fontSize: 20 }}>📦</span>
                <span style={{ fontSize: 13, color: "#3A2A1A", fontWeight: 600 }}>Other / Physical</span>
              </button>
            </div>

            <button onClick={() => setMoveTarget(null)} style={{
              width: "100%", marginTop: 14, padding: "9px", borderRadius: 8,
              background: "none", border: "1px solid #C4A882", color: "#6B4C2A",
              cursor: "pointer", fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif',
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsPage({ onClose, mediaType: initialMediaType }) {
  const [mediaType, setMediaType] = useState(initialMediaType || "ebooks");
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedTallyMonth, setSelectedTallyMonth] = useState(null); // { yr, mi }
  const [calendarBook, setCalendarBook] = useState(null);
  const [calFavorites, setCalFavorites] = useState(() => { try { return JSON.parse(localStorage.getItem(`sk_favorites_${initialMediaType}`) || "{}"); } catch { return {}; } });
  const [calStatuses, setCalStatuses] = useState(() => { try { return JSON.parse(localStorage.getItem(`sk_statuses_${initialMediaType}`) || "{}"); } catch { return {}; } });
  const [calProgress, setCalProgress] = useState(() => { try { return JSON.parse(localStorage.getItem(`sk_progress_${initialMediaType}`) || "{}"); } catch { return {}; } });

  const statuses = (() => { try { return JSON.parse(localStorage.getItem(`sk_statuses_${mediaType}`)) || {}; } catch { return {}; } })();
  const favorites = (() => { try { return JSON.parse(localStorage.getItem(`sk_favorites_${mediaType}`)) || {}; } catch { return {}; } })();
  const progress = (() => { try { return JSON.parse(localStorage.getItem(`sk_progress_${mediaType}`)) || {}; } catch { return {}; } })();
  const dates = (() => { try { return JSON.parse(localStorage.getItem(`sk_dates_${mediaType}`)) || {}; } catch { return {}; } })();

  // Session data
  const sessions = (() => { try { return JSON.parse(localStorage.getItem(`sk_sessions_${mediaType}`) || "[]"); } catch { return []; } })();
  const now = new Date();
  const thisMonth = sessions.filter(s => { const d = new Date(s.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const totalMinutesAllTime = parseInt(localStorage.getItem(`sk_lifetime_minutes_${mediaType}`) || "0") || sessions.reduce((a, s) => a + (s.minutes || 0), 0);
  const totalMinutesThisMonth = thisMonth.reduce((a, s) => a + (s.minutes || 0), 0);
  const totalPagesAllTime = parseInt(localStorage.getItem("sk_lifetime_pages") || "0");
  const totalChaptersAllTime = parseInt(localStorage.getItem("sk_lifetime_chapters") || "0");
  const totalChaptersEbooksAllTime = parseInt(localStorage.getItem("sk_lifetime_chapters_ebooks") || "0");
  const formatMins = (m) => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;

  // Flatten all books
  const allBooks = Object.values(library).flat();

  const finishedBooks = allBooks.filter((b) => statuses[b.isbn] === "finished");
  const readingBooks = allBooks.filter((b) => statuses[b.isbn] === "reading");
  const favCount = Object.values(favorites).filter(Boolean).length;

  const avgDays = (() => {
    const withDates = finishedBooks.filter((b) => dates[b.isbn]?.startDate && dates[b.isbn]?.endDate);
    if (withDates.length === 0) return null;
    const total = withDates.reduce((acc, b) => {
      const start = new Date(dates[b.isbn].startDate);
      const end = new Date(dates[b.isbn].endDate);
      return acc + Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    }, 0);
    return Math.round(total / withDates.length);
  })();

  // Calendar helpers
  const today = new Date();
  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = calMonth.toLocaleString("default", { month: "long" });

  const booksOnDay = (day) => {
    const dayDate = new Date(year, month, day);
    const dayStart = new Date(dayDate); dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(dayDate); dayEnd.setHours(23,59,59,999);
    return allBooks.filter((b) => {
      const d = dates[b.isbn];
      if (!d?.startDate) return false;
      const start = new Date(d.startDate);
      const end = d.endDate ? new Date(d.endDate) : new Date();
      return start <= dayEnd && end >= dayStart;
    });
  };

  const isToday = (day) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const daysSince = (iso) => {
    if (!iso) return null;
    return Math.max(0, Math.round((new Date() - new Date(iso)) / (1000 * 60 * 60 * 24)));
  };

  const daysBetween = (startIso, endIso) => {  // eslint-disable-line no-unused-vars
    if (!startIso || !endIso) return null;
    return Math.max(0, Math.round((new Date(endIso) - new Date(startIso)) / (1000 * 60 * 60 * 24)));
  };

  const cardStyle = {
    background: "rgba(255,255,255,0.7)",
    border: "1px solid #D8C3A5",
    borderRadius: 10,
    padding: "16px 12px",
    textAlign: "center",
  };

  const sectionTitle = (text) => (
    <h2 style={{
      fontFamily: '"Palatino Linotype", Palatino, serif',
      fontSize: 20,
      color: "#3A2A1A",
      marginBottom: 16,
      marginTop: 0,
    }}>{text}</h2>
  );

  const divider = <div style={{ borderTop: "1px solid #D8C3A5", margin: "0 0 32px 0", opacity: 0.7 }} />;

  // Build calendar grid cells
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const scrollRef = useRef(null);
  const [atTop, setAtTop] = useState(true);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 700,
      backgroundColor: "#F8F1E4",
      backgroundImage: 'url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      {/* Back button — hidden when scrolled down */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 56,
          left: 20,
          padding: "8px 18px",
          borderRadius: "50px",
          border: "1px solid #8B5E3C",
          cursor: "pointer",
          background: '#F8F1E4 url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg") center/cover fixed',
          color: "#3A2A1A",
          fontFamily: '"Baskerville", "Book Antiqua", "Goudy Old Style", Georgia, serif',
          fontWeight: 700,
          fontStyle: "italic",
          fontSize: 15,
          letterSpacing: "0.5px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
          zIndex: 201,
          opacity: atTop ? 1 : 0,
          pointerEvents: atTop ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      >
        ← Return to Reading Nook
      </button>

      {/* Back to top button */}
      <button
        onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
        style={{
          position: "absolute",
          bottom: 28,
          right: 28,
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "1px solid #8B5E3C",
          cursor: "pointer",
          background: '#F8F1E4 url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg") center/cover fixed',
          color: "#3A2A1A",
          fontSize: 20,
          boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
          zIndex: 201,
          opacity: atTop ? 0 : 1,
          pointerEvents: atTop ? "none" : "auto",
          transition: "opacity 0.25s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title="Back to top"
      >
        ↑
      </button>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        onScroll={(e) => setAtTop(e.currentTarget.scrollTop < 40)}
        style={{ position: "absolute", inset: 0, overflowY: "auto", padding: "80px 40px 30px" }}
      >
      <div style={{ maxWidth: 900, margin: "0 auto", paddingTop: 20 }}>
        {/* Header */}
        <h1 style={{
          fontFamily: '"Palatino Linotype", Palatino, serif',
          fontSize: 32,
          color: "#3A2A1A",
          textAlign: "center",
          marginBottom: 16,
        }}>{mediaType === "audiobooks" ? "🎧 My Story So Far" : "📖 My Story So Far"}</h1>

        {/* eBooks / Audiobooks toggle */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 30 }}>
          {["ebooks", "audiobooks"].map(t => (
            <button key={t} onClick={() => setMediaType(t)}
              style={{
                padding: "8px 24px", borderRadius: 20, cursor: "pointer",
                fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 14, fontWeight: 700,
                border: mediaType === t ? "2px solid #8B5E3C" : "1px solid #C4A870",
                background: mediaType === t ? "#8B5E3C" : "transparent",
                color: mediaType === t ? "#F8F1E4" : "#6B4E32",
                transition: "all 0.2s",
              }}>
              {t === "ebooks" ? "📚 eBooks" : "🎧 Audiobooks"}
            </button>
          ))}
        </div>

        {/* Section 1 — Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 40 }}>
          <div style={cardStyle}>
            <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 28, fontWeight: 700, color: "#3A2A1A" }}>{finishedBooks.length}</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: "#6B4E32" }}>{mediaType === "audiobooks" ? "🎧 Books Listened To" : "📚 Books Read"}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 28, fontWeight: 700, color: "#3A2A1A" }}>{readingBooks.length}</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: "#6B4E32" }}>{mediaType === "audiobooks" ? "🎧 Currently Listening" : "📖 In Progress"}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 28, fontWeight: 700, color: "#3A2A1A" }}>{favCount}</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: "#6B4E32" }}>⭐ Favourites</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 28, fontWeight: 700, color: "#3A2A1A" }}>{avgDays !== null ? avgDays : "—"}</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: "#6B4E32" }}>{mediaType === "audiobooks" ? "⏱ Avg Listen Days" : "⏱ Avg Days"}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 28, fontWeight: 700, color: "#3A2A1A" }}>{totalMinutesThisMonth > 0 ? formatMins(totalMinutesThisMonth) : "—"}</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: "#6B4E32" }}>{mediaType === "audiobooks" ? "🎧 This Month" : "📖 This Month"}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 28, fontWeight: 700, color: "#3A2A1A" }}>{totalMinutesAllTime > 0 ? formatMins(totalMinutesAllTime) : "—"}</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: "#6B4E32" }}>{mediaType === "audiobooks" ? "🎧 Lifetime Listening Time" : "📖 Lifetime Reading Time"}</div>
          </div>
          {mediaType === "ebooks" && (
            <div style={cardStyle}>
              <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 28, fontWeight: 700, color: "#3A2A1A" }}>{totalChaptersEbooksAllTime > 0 ? totalChaptersEbooksAllTime.toLocaleString() : "—"}</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: "#6B4E32" }}>🔖 Lifetime Chapters Read</div>
            </div>
          )}
          {mediaType === "ebooks" && (
            <div style={cardStyle}>
              <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 28, fontWeight: 700, color: "#3A2A1A" }}>{totalPagesAllTime > 0 ? totalPagesAllTime.toLocaleString() : "—"}</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: "#6B4E32" }}>📄 Lifetime Pages Read</div>
            </div>
          )}
          {mediaType === "audiobooks" && (
            <div style={cardStyle}>
              <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 28, fontWeight: 700, color: "#3A2A1A" }}>{totalChaptersAllTime > 0 ? totalChaptersAllTime.toLocaleString() : "—"}</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: "#6B4E32" }}>🔖 Lifetime Chapters Listened</div>
            </div>
          )}
        </div>

        {divider}

        {/* Section 2 — Monthly Reading Calendar */}
        <div style={{ marginBottom: 40, marginLeft: -40, marginRight: -40 }}>
          <div style={{ paddingLeft: 40, paddingRight: 40 }}>
          {sectionTitle(mediaType === "audiobooks" ? "📅 Monthly Listening Calendar" : "📅 Monthly Reading Calendar")}
          </div>

          {/* Month navigation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 12 }}>
            <button
              onClick={() => setCalMonth(new Date(year, month - 1, 1))}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#8B5E3C" }}
            >‹</button>
            <span style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 18, color: "#3A2A1A", fontWeight: 700 }}>
              {monthName} {year}
            </span>
            <button
              onClick={() => setCalMonth(new Date(year, month + 1, 1))}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#8B5E3C" }}
            >›</button>
          </div>

          {/* Day headers + grid — horizontally scrollable so tiles stay a useful size */}
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <div style={{ minWidth: 490 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
              <div key={d} style={{ textAlign: "center", fontFamily: "Georgia, serif", fontSize: 11, color: "#6B4E32", fontWeight: 700, padding: "4px 0" }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const books = booksOnDay(day);
              const single = books.length === 1;
              return (
                <div key={day} style={{
                  aspectRatio: "1/1",
                  border: isToday(day) ? "2px solid #8B5E3C" : "1px solid #D8C3A5",
                  borderRadius: 6,
                  padding: single ? 0 : 5,
                  background: isToday(day) ? "rgba(139,94,60,0.15)" : "rgba(255,255,255,0.4)",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  {/* Day number — overlaid on cover for single book */}
                  <div style={{
                    position: single && books[0]?.coverUrl ? "absolute" : "relative",
                    top: 4, left: 6, zIndex: 2,
                    fontSize: 11, color: single && books[0]?.coverUrl ? "#fff" : "#6B4E32",
                    fontFamily: "Georgia, serif",
                    fontWeight: 700,
                    textShadow: single && books[0]?.coverUrl ? "0 1px 3px rgba(0,0,0,0.8)" : "none",
                    marginBottom: single ? 0 : 4,
                  }}>{day}</div>

                  {/* Single book: full-size cover */}
                  {single && (
                    <img
                      src={books[0].coverUrl || (books[0].isbn ? `https://covers.openlibrary.org/b/isbn/${books[0].isbn}-M.jpg` : "")}
                      alt={books[0].title}
                      title={books[0].title}
                      onClick={() => setCalendarBook(books[0])}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: 5, cursor: "pointer" }}
                    />
                  )}

                  {/* Multiple books: small thumbnails */}
                  {!single && books.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                      {books.map((b) => (
                        <img
                          key={b.isbn || b.title}
                          src={b.coverUrl || (b.isbn ? `https://covers.openlibrary.org/b/isbn/${b.isbn}-M.jpg` : "")}
                          alt={b.title}
                          title={b.title}
                          onClick={() => setCalendarBook(b)}
                          style={{ width: 30, height: 42, objectFit: "cover", borderRadius: 3, border: "1px solid #C9A96E", boxShadow: "1px 1px 4px rgba(0,0,0,0.2)", cursor: "pointer" }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
            </div>
          </div>
        </div>

        {divider}

        {/* Section — Monthly & Yearly Tally */}
        {(() => {
          const allBooks = Object.values(library).flat();
          const datesData = JSON.parse(localStorage.getItem(`sk_dates_${mediaType}`) || "{}");
          const statusData = JSON.parse(localStorage.getItem(`sk_statuses_${mediaType}`) || "{}");

          // Build monthly counts grouped by year
          const monthlyCounts = {};
          allBooks.forEach((b) => {
            if (statusData[b.isbn] === "finished" && datesData[b.isbn]?.endDate) {
              const d = new Date(datesData[b.isbn].endDate);
              const yr = d.getFullYear();
              const mo = d.getMonth();
              if (!monthlyCounts[yr]) monthlyCounts[yr] = Array(12).fill(0);
              monthlyCounts[yr][mo]++;
            }
          });

          const years = Object.keys(monthlyCounts).sort((a, b) => b - a);
          const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

          return (
            <div style={{ marginBottom: 40 }}>
              {sectionTitle(mediaType === "audiobooks" ? "📅 Monthly & Yearly Listening Tally" : "📅 Monthly & Yearly Reading Tally")}
              {years.length === 0 ? (
                <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#6B4E32" }}>Finish a book to start building your tally!</p>
              ) : years.map((yr) => {
                const counts = monthlyCounts[yr];
                const yearTotal = counts.reduce((a, b) => a + b, 0);
                return (
                  <div key={yr} style={{ marginBottom: 30 }}>
                    {/* Year total box */}
                    <div style={{ ...cardStyle, display: "inline-flex", flexDirection: "column", alignItems: "center", marginBottom: 16, minWidth: 160 }}>
                      <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 28, fontWeight: 700, color: "#3A2A1A" }}>{yearTotal}</div>
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: "#6B4E32" }}>{mediaType === "audiobooks" ? `🎧 Books Listened To in ${yr}` : `📚 Books Read in ${yr}`}</div>
                    </div>

                    {/* Monthly boxes */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
                      {counts.map((count, mi) => {
                        const isSelected = selectedTallyMonth?.yr === yr && selectedTallyMonth?.mi === mi;
                        return (
                          <div
                            key={mi}
                            onClick={() => count > 0 && setSelectedTallyMonth(isSelected ? null : { yr, mi })}
                            style={{
                              ...cardStyle,
                              padding: "12px 8px",
                              minWidth: 0,
                              opacity: count === 0 ? 0.4 : 1,
                              cursor: count > 0 ? "pointer" : "default",
                              border: isSelected ? "2px solid #8B5E3C" : "1px solid #D8C3A5",
                              background: isSelected ? "rgba(139,94,60,0.12)" : "rgba(255,255,255,0.7)",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 22, fontWeight: 700, color: "#3A2A1A" }}>
                              {count}
                            </div>
                            <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: "#6B4E32" }}>
                              {monthNames[mi]}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Expanded book list for selected month */}
                    {selectedTallyMonth?.yr === yr && (() => {
                      const monthBooks = allBooks.filter((b) => {
                        if (statusData[b.isbn] !== "finished" || !datesData[b.isbn]?.endDate) return false;
                        const d = new Date(datesData[b.isbn].endDate);
                        return d.getFullYear().toString() === yr && d.getMonth() === selectedTallyMonth.mi;
                      });
                      return (
                        <div style={{ marginTop: 16, padding: "16px", background: "rgba(255,255,255,0.5)", border: "1px solid #D8C3A5", borderRadius: 8 }}>
                          <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 15, fontWeight: 700, color: "#3A2A1A", marginBottom: 12 }}>
                            ✅ Finished in {monthNames[selectedTallyMonth.mi]} {yr}
                          </div>
                          {monthBooks.map((b) => {
                            const d = datesData[b.isbn] || {};
                            const took = d.startDate && d.endDate
                              ? Math.max(0, Math.round((new Date(d.endDate) - new Date(d.startDate)) / (1000*60*60*24)))
                              : null;
                            return (
                              <div key={b.isbn} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, padding: "8px 10px", background: "rgba(255,255,255,0.6)", borderRadius: 6, border: "1px solid #D8C3A5" }}>
                                <img
                                  src={`https://covers.openlibrary.org/b/isbn/${b.isbn}-S.jpg`}
                                  alt={b.title}
                                  style={{ width: 36, height: 50, objectFit: "cover", borderRadius: 3, border: "1px solid #C9A96E", flexShrink: 0 }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontWeight: 700, color: "#3A2A1A", fontSize: 13 }}>{b.title}</div>
                                  <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#6B4E32", fontSize: 11 }}>{b.author}</div>
                                  {took !== null && <div style={{ fontFamily: "Georgia, serif", fontSize: 11, color: "#8B5E3C", marginTop: 2 }}>📅 {took} days to read</div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {divider}

        {/* Session Log */}
        {sessions.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            {sectionTitle(mediaType === "audiobooks" ? "🎧 Listening Sessions" : "📖 Reading Sessions")}
            <div style={{ border: "1px solid #D8C3A5", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 80px 70px", gap: 0, background: "#3A2A1A", padding: "8px 14px" }}>
                {["Date", "Book", "Time", mediaType === "audiobooks" ? "Chapter" : "Page"].map(h => (
                  <div key={h} style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 12, fontWeight: 700, color: "#F8F1E4" }}>{h}</div>
                ))}
              </div>
              {sessions.slice(0, 30).map((s, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 80px 70px", gap: 0, padding: "8px 14px", background: i % 2 === 0 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)", borderTop: "1px solid #E8D9C5" }}>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#6B4E32" }}>{new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                  <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 12, color: "#3A2A1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#3A2A1A" }}>
                    {formatMins(s.minutes)}
                    {s.platform && <span style={{ fontSize: 10, color: "#8B7355", marginLeft: 4 }}>via {s.platform}</span>}
                  </div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#6B4E32" }}>
                    {mediaType === "audiobooks"
                      ? (s.chapters > 0 ? `ch. ${s.chapters}` : "—")
                      : (s.pages > 0 ? `p. ${s.pages}` : "—")}
                  </div>
                </div>
              ))}
              {sessions.length > 30 && (
                <div style={{ padding: "8px 14px", fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: "#8B5E3C", textAlign: "center" }}>
                  Showing 30 most recent sessions of {sessions.length} total
                </div>
              )}
            </div>
          </div>
        )}

        {divider}

        {/* Section 3 — Currently Reading */}
        <div style={{ marginBottom: 40 }}>
          {sectionTitle(mediaType === "audiobooks" ? "🎧 Currently Listening" : "📖 Currently Reading")}
          {readingBooks.length === 0 ? (
            <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#6B4E32" }}>{mediaType === "audiobooks" ? "No audiobooks currently in progress" : "No books currently in progress"}</p>
          ) : (
            readingBooks.map((b) => {
              const prog = progress[b.isbn] || 0;
              const start = dates[b.isbn]?.startDate;
              const days = start ? daysSince(start) : null;
              return (
                <div key={b.isbn} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 14,
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.6)",
                  border: "1px solid #D8C3A5",
                  borderRadius: 8,
                }}>
                  <img
                    src={`https://covers.openlibrary.org/b/isbn/${b.isbn}-S.jpg`}
                    alt={b.title}
                    style={{ width: 40, height: 55, objectFit: "cover", borderRadius: 3, border: "1px solid #C9A96E", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontWeight: 700, color: "#3A2A1A", fontSize: 14, marginBottom: 2 }}>{b.title}</div>
                    <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#6B4E32", fontSize: 12, marginBottom: 6 }}>{b.author}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: "#D8C3A5", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${prog}%`, height: "100%", background: "#8B5E3C", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: "Georgia, serif", fontSize: 11, color: "#6B4E32", whiteSpace: "nowrap" }}>{prog}%</span>
                    </div>
                  </div>
                  {days !== null && (
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 20, fontWeight: 700, color: "#8B5E3C" }}>{days}</div>
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 10, color: "#6B4E32", fontStyle: "italic" }}>days</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {divider}

      </div>
      </div>{/* end scrollable content */}

      {/* Book modal launched from calendar */}
      {calendarBook && (
        <BookModal
          book={calendarBook}
          onClose={() => setCalendarBook(null)}
          favorites={calFavorites} setFavorites={(v) => { setCalFavorites(v); localStorage.setItem(`sk_favorites_${mediaType}`, JSON.stringify(v)); }}
          statuses={calStatuses} setStatuses={(v) => { setCalStatuses(v); localStorage.setItem(`sk_statuses_${mediaType}`, JSON.stringify(v)); }}
          progress={calProgress} setProgress={(v) => { setCalProgress(v); localStorage.setItem(`sk_progress_${mediaType}`, JSON.stringify(v)); }}
          mediaType={mediaType}
          onBookEdited={(updated) => {
            const userBooks = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
            const idx = userBooks.findIndex(b => (b.isbn && b.isbn === calendarBook.isbn) || b.title === calendarBook.title);
            if (idx >= 0) { userBooks[idx] = { ...userBooks[idx], ...updated }; localStorage.setItem("sk_user_books", JSON.stringify(userBooks)); }
            setCalendarBook(prev => ({ ...prev, ...updated }));
          }}
          onDelete={() => setCalendarBook(null)}
        />
      )}
    </div>
  );
}

const COMING_SOON_PLATFORMS = new Set(["kobo", "nook", "googleplay", "scribd", "librofm", "hoopla", "graphicaudio"]);

const EBOOK_PLATFORMS = [
  { id: "kindle",     name: "Kindle",           emoji: "📱", desc: "Amazon's ebook library",         url: "https://read.amazon.com" },
  { id: "apple",      name: "Apple Books",       emoji: "📖", desc: "Apple's book platform",          url: "https://books.apple.com" },
  { id: "kobo",       name: "Kobo",              emoji: "📚", desc: "Rakuten's ebook platform",       url: "https://www.kobo.com" },
  { id: "nook",       name: "Nook",              emoji: "📗", desc: "Barnes & Noble ebooks",          url: "https://www.barnesandnoble.com/b/nook" },
  { id: "googleplay", name: "Google Play Books", emoji: "📘", desc: "Google's ebook store",           url: "https://play.google.com/books" },
  { id: "scribd",     name: "Scribd",            emoji: "📜", desc: "Unlimited reading subscription",  url: "https://www.scribd.com" },
  { id: "bookfunnel", name: "BookFunnel",        emoji: "🎁", desc: "Indie author book delivery",     url: "https://bookfunnel.com" },
  { id: "libby",      name: "Libby / OverDrive", emoji: "🏛️", desc: "Free library ebooks & audio",    url: "https://libbyapp.com" },
  { id: "goodreads",  name: "Goodreads",         emoji: "🌸", desc: "Import your full Goodreads library", url: "https://www.goodreads.com", csvExport: "https://www.goodreads.com/review/import" },
];

const AUDIO_PLATFORMS = [
  { id: "audible",      name: "Audible",        emoji: "🎧", desc: "Amazon's audiobook platform",  url: "https://www.audible.com" },
  { id: "librofm",      name: "Libro.fm",       emoji: "🎙️", desc: "Indie bookstore audiobooks",   url: "https://libro.fm" },
  { id: "hoopla",       name: "Hoopla",         emoji: "🎵", desc: "Free library audiobooks",      url: "https://www.hoopladigital.com" },
  { id: "chirp",        name: "Chirp",          emoji: "🐦", desc: "Audiobook deals platform",     url: "https://www.chirpbooks.com" },
  { id: "graphicaudio", name: "Graphic Audio",  emoji: "🎭", desc: "Full-cast audio productions",  url: "https://www.graphicaudio.net" },
];

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').toLowerCase().trim());
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] || '').replace(/^=?"?|"?$/g, '').trim(); });
    return obj;
  });
}

function detectGenreFromGoodreads(bookshelves, exclusiveShelf) {
  const shelves = (bookshelves + ' ' + exclusiveShelf).toLowerCase();
  if (shelves.includes('dark-romance') || shelves.includes('dark romance')) return 'Dark Romance';
  if (shelves.includes('cooking') || shelves.includes('cookbook') || shelves.includes('cookbooks') || shelves.includes('recipes') || shelves.includes('baking') || shelves.includes('food')) return 'Cookbooks';
  if (shelves.includes('true-crime') || shelves.includes('true crime') || shelves.includes('murder') || shelves.includes('serial-killer') || shelves.includes('forensic') || shelves.includes('crime-investigation')) return 'True Crime';
  if (shelves.includes('garden') || shelves.includes('gardening') || shelves.includes('landscape') || shelves.includes('landscaping') || shelves.includes('horticulture') || shelves.includes('botany') || shelves.includes('plants')) return 'Gardening & Landscaping';
  if (shelves.includes('historical-fiction') || shelves.includes('historical fiction') || shelves.includes('historical') || shelves.includes('world-war') || shelves.includes('medieval')) return 'Historical Fiction';
  if (shelves.includes('drama') || shelves.includes('play') || shelves.includes('theatre') || shelves.includes('shakespeare')) return 'Drama';
  if (shelves.includes('romance') || shelves.includes('love') || shelves.includes('chick-lit')) return 'Romance';
  if (shelves.includes('fantasy') || shelves.includes('magic') || shelves.includes('dragon') || shelves.includes('wizard')) return 'Fantasy';
  if (shelves.includes('mystery') || shelves.includes('detective') || shelves.includes('crime') || shelves.includes('cozy') ||
      shelves.includes('thriller') || shelves.includes('suspense') || shelves.includes('horror')) return 'Mystery & Thriller';
  if (shelves.includes('sci-fi') || shelves.includes('science-fiction') || shelves.includes('science fiction') || shelves.includes('scifi') || shelves.includes('space')) return 'Sci-Fi';
  if (shelves.includes('self-help') || shelves.includes('self help') || shelves.includes('nonfiction') || shelves.includes('non-fiction') || shelves.includes('personal-development') || shelves.includes('business')) return 'Self Help';
  if (shelves.includes('literary') || shelves.includes('literary-fiction') || shelves.includes('classics') || shelves.includes('fiction')) return 'Fiction';
  return null;
}

function BookmarkletCopyButton({ code, label, isScript }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); })}
      style={{ padding: "7px 16px", background: copied ? "#2d6a2d" : "#3A2A1A", color: "#F8F1E4", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 700 }}
    >
      {copied ? "✓ Copied! Paste it in the Console and press Enter" : "📋 Copy Script"}
    </button>
  );
}

function ImportModal({ platform, mediaType, onClose, onImport }) {
  const csvPlatforms = ["kindle", "kobo", "goodreads", "audible", "chirp", "apple", "bookfunnel"];
  const showCSV = csvPlatforms.includes(platform.id);
  const [activeTab, setActiveTab] = useState(showCSV ? "csv" : "search");

  // CSV tab state
  const [csvBooks, setCsvBooks] = useState([]);
  const [csvSkipped, setCsvSkipped] = useState(0);
  const [csvGenres, setCsvGenres] = useState({});
  const csvUserEditedRef = useRef(new Set());
  const [csvEnriching, setCsvEnriching] = useState(false);
  const [csvEnrichProgress, setCsvEnrichProgress] = useState(null);
  const [csvDragOver, setCsvDragOver] = useState(false);

  // Bulk paste state
  const [bulkText, setBulkText] = useState("");
  const [bulkSearching, setBulkSearching] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(null); // { done, total }
  const [bulkPending, setBulkPending] = useState([]);
  const [bulkGenres, setBulkGenres] = useState({});

  // Search tab state
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [results, setResults] = useState([]);
  const [pending, setPending] = useState([]);
  const [pendingGenres, setPendingGenres] = useState({});

  const handleBulkSearch = async () => {
    const titles = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
    if (!titles.length) return;
    setBulkSearching(true);
    setBulkProgress({ done: 0, total: titles.length });
    setBulkPending([]);
    setBulkGenres({});

    const existingUserBooks = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
    const allLibraryBooks = Object.values(library).flat();
    const existingTitles = new Set([...existingUserBooks, ...allLibraryBooks].map(b => b.title.toLowerCase().trim()));

    const found = [];
    for (let i = 0; i < titles.length; i++) {
      const title = titles[i];
      setBulkProgress({ done: i + 1, total: titles.length });
      if (existingTitles.has(title.toLowerCase().trim())) continue;
      try {
        // Try Google Books first (better audiobook coverage)
        const gRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=1&langRestrict=en`);
        const gJson = await gRes.json();
        const vol = gJson.items?.[0]?.volumeInfo;
        if (vol) {
          const id13 = vol.industryIdentifiers?.find(i => i.type === "ISBN_13");
          const id10 = vol.industryIdentifiers?.find(i => i.type === "ISBN_10");
          const isbn = (id13 || id10)?.identifier || "";
          const pendingId = `bulk-${i}`;
          const genre = detectGenre(vol.categories || [], title);
          const book = {
            _pendingId: pendingId,
            title: vol.title || title,
            author: (vol.authors || []).join(", "),
            isbn,
            coverUrl: vol.imageLinks?.thumbnail?.replace("http://", "https://") || "",
            description: vol.description || "",
            genre,
            type: mediaType,
            platform: platform.id,
          };
          found.push(book);
          setBulkGenres(prev => ({ ...prev, [pendingId]: genre }));
          existingTitles.add(book.title.toLowerCase().trim());
        }
      } catch { /* skip */ }
      await new Promise(r => setTimeout(r, 120));
    }
    setBulkPending(found);
    setBulkSearching(false);
  };

  const handleConfirmBulk = () => {
    const books = bulkPending.map(b => ({
      title: b.title, author: b.author, isbn: b.isbn,
      coverUrl: b.coverUrl, description: b.description,
      type: mediaType, genre: bulkGenres[b._pendingId] || b.genre,
      platform: platform.id,
    }));
    onImport(books);
  };

  const handleCSVFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const rows = parseCSV(ev.target.result);
      const isGoodreads = platform.id === "goodreads";
      const isApple = platform.id === "apple";

      // Build duplicate lookup from existing books
      const existingUserBooks = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
      const allLibraryBooks = Object.values(library).flat();
      const existingIsbns = new Set([
        ...existingUserBooks.map(b => b.isbn).filter(Boolean),
        ...allLibraryBooks.map(b => b.isbn).filter(Boolean),
      ]);
      const existingTitles = new Set([
        ...existingUserBooks.map(b => b.title.toLowerCase().trim()),
        ...allLibraryBooks.map(b => b.title.toLowerCase().trim()),
      ]);

      const isAudible = platform.id === "audible";
      const isChirp = platform.id === "chirp";
      const isBookFunnel = platform.id === "bookfunnel";

      // Helper to extract text from ALE HYPERLINK formulas: =HYPERLINK("url";"Title Text")
      const extractHyperlink = (val) => {
        const m = val.match(/HYPERLINK\([^;]+[;,]\s*"([^"]+)"\s*\)/i);
        return m ? m[1] : val;
      };
      // Helper to extract image URL from ALE IMAGE formulas inside HYPERLINK
      const extractImageUrl = (val) => {
        const m = val.match(/IMAGE\("([^"]+)"/i);
        return m ? m[1] : "";
      };

      const seenInCsv = new Set();
      const books = rows.map((row, idx) => {
        let rawTitle = row["title"] || row["book title"] || row["asin title"] || "";
        // BookFunnel prefixes direct-download books with "DIRECT - " — strip it
        if (isBookFunnel) rawTitle = rawTitle.replace(/^DIRECT\s*-\s*/i, "").trim();
        // ALE wraps titles in =HYPERLINK formulas — extract the display text
        if (isAudible && rawTitle.includes("HYPERLINK")) rawTitle = extractHyperlink(rawTitle);
        const title = rawTitle;
        const author = row["author"] || row["author(s)"] || row["authors"] || row["narrator"] || "";
        // ALE prefixes ASIN with apostrophe to prevent Excel auto-format — strip it
        const rawAsin = (row["asin"] || "").replace(/^'/, "").trim();
        const rawCoverForIsbn = row["coverurl"] || row["cover_url"] || "";
        const chirpIsbnMatch = isChirp ? rawCoverForIsbn.match(/\/(\d{13})(?:\.jpg|$)/) : null;
        const chirpIsbn = chirpIsbnMatch ? chirpIsbnMatch[1] : "";
        const isbn = (row["isbn13"] || row["isbn"] || chirpIsbn || rawAsin || "").replace(/[="]/g, "").replace(/\s/g, "");
        const storeId = row["storeid"] || "";
        // ALE wraps cover in =HYPERLINK(...; IMAGE("url")) — extract the image URL
        const rawCover = row["cover"] || "";
        const coverUrl = (isAudible && rawCover.includes("IMAGE"))
          ? extractImageUrl(rawCover)
          : (row["coverurl"] || row["cover_url"] || row["image url"] || row["image"] ||
             (storeId ? `https://is1-ssl.mzstatic.com/image/thumb/Music/${storeId}/source/300x300bb.jpg` : ""));
        const readUrl = row["readurl"] || row["read_url"] || row["webReaderUrl"] || row["readerurl"] || "";
        if (!title) return null;

        // Duplicate check (against existing library AND within this CSV)
        const titleKey = title.toLowerCase().trim();
        const isDuplicate = (isbn && existingIsbns.has(isbn)) ||
          existingTitles.has(titleKey) || seenInCsv.has(titleKey);
        if (isDuplicate) return null;
        seenInCsv.add(titleKey);

        const shelves = isGoodreads ? (row["bookshelves"] || "") : "";
        const exclusiveShelf = isGoodreads ? (row["exclusive shelf"] || "") : "";
        const dateRead = isGoodreads ? (row["date read"] || "") : "";
        const dateAdded = isGoodreads ? (row["date added"] || "") : "";

        // Apple Books specific
        const description = isApple ? (row["description"] || "") : (row["blurb"] || "");
        const appleMediaType = isApple ? (row["mediatype"] || "ebook") : null;
        const appleProgress = isApple ? parseFloat(row["readingprogress"] || "0") : null;

        // Audible specific — strip leading apostrophe ALE adds to prevent Excel auto-formatting
        const stripAle = (v) => (v || "").replace(/^'+/, "").trim();
        const narrator = isAudible ? stripAle(row["narrators"]) : "";
        const series = isAudible ? stripAle(row["series"]) : "";

        // Genre detection
        const rawGenre = isApple ? (row["genre"] || "") : isAudible ? (row["parent category"] || row["categories"] || "") : "";
        const audibleBlurb = isAudible ? stripAle(row["blurb"]) : "";
        const audibleSeries = isAudible ? (row["series"] || "") : "";
        const chirpBlurb = isChirp ? (row["description"] || row["blurb"] || "") : "";
        const bfBlurb = isBookFunnel ? (row["description"] || row["blurb"] || "") : "";
        const shelfGenre = isGoodreads
          ? (detectGenreFromGoodreads(shelves, exclusiveShelf) || "Fiction")
          : isApple
            ? (detectGenre([rawGenre], title) || "Fiction")
            : isAudible
              ? (detectGenre([audibleBlurb, audibleSeries, rawGenre], title) || "Fiction")
              : isChirp
                ? (detectGenre([chirpBlurb, title], title) || "Fiction")
                : isBookFunnel
                  ? (detectGenre([bfBlurb, title], title) || "Romance")
                  : (detectGenre([title], title) || "Fiction");

        // Status mapping
        let status = null;
        if (isGoodreads) {
          if (exclusiveShelf === "read") status = "finished";
          else if (exclusiveShelf === "currently-reading") status = "reading";
          else if (exclusiveShelf === "to-read") status = "want-to-read";
        } else if (isApple && appleProgress !== null) {
          if (appleProgress >= 0.95) status = "finished";
          else if (appleProgress > 0) status = "reading";
        } else if (isAudible) {
          const pctRaw = row["percent complete"] || row["percentcomplete"] || row["listening progress"] || row["progress"] || "";
          const pct = parseFloat(pctRaw);
          if (!isNaN(pct)) {
            if (pct >= 95) status = "finished";
            else if (pct > 0) status = "reading";
          }
          const audibleStatus = (row["status"] || "").toLowerCase();
          if (audibleStatus === "finished" || audibleStatus === "completed") status = "finished";
          else if (audibleStatus === "started" || audibleStatus === "in progress") status = "reading";
        } else {
          // Generic fallback for any platform that exports a status column
          const rawStatus = (row["status"] || row["read status"] || row["reading status"] || "").toLowerCase();
          if (rawStatus === "read" || rawStatus === "finished" || rawStatus === "completed") status = "finished";
          else if (rawStatus === "reading" || rawStatus === "in progress" || rawStatus === "currently reading") status = "reading";
          else if (rawStatus === "to read" || rawStatus === "want to read") status = "want-to-read";
        }

        const mediaType = isAudible ? "audiobook" : isChirp ? "audiobook" : isBookFunnel ? (row["mediatype"] || "ebook") : appleMediaType;
        return { _csvIdx: idx, title, author, isbn, coverUrl, readUrl, shelfGenre, status, dateRead, dateAdded, description, mediaType, storeId, narrator, series };
      }).filter(Boolean);

      csvUserEditedRef.current = new Set();
      setCsvBooks(books);
      setCsvSkipped(rows.filter(r => r["title"] || r["book title"]).length - books.length);
      const genreMap = {};
      books.forEach(b => { genreMap[b._csvIdx] = b.shelfGenre || "Fiction"; });
      setCsvGenres(genreMap);

      if (!isGoodreads && books.length > 0) {
        setCsvEnriching(true);
        setCsvEnrichProgress({ done: 0, total: books.length });
        const updatedGenres = { ...genreMap };
        const enrichedBooks = books.map(b => ({ ...b }));
        for (let i = 0; i < books.length; i++) {
          const b = books[i];
          try {
            const cleaned = cleanTitle(b.title);
            const normAuthor = normalizeAuthor(b.author);

            const applySubjects = (subjects) => {
              const genre = detectGenre(subjects, b.title);
              if (genre && !csvUserEditedRef.current.has(b._csvIdx)) {
                if (updatedGenres[b._csvIdx] === "Fiction" || !updatedGenres[b._csvIdx] || genre !== "Fiction")
                  updatedGenres[b._csvIdx] = genre;
              }
            };

            const applyOLWork = async (workKey) => {
              if (!workKey) return;
              try {
                const res = await fetch(`https://openlibrary.org${workKey}.json`);
                const work = await res.json();
                if (!enrichedBooks[i].description) {
                  const d = work.description?.value || work.description || work.first_sentence?.value || "";
                  if (d && typeof d === "string" && d.length > 20) enrichedBooks[i].description = d;
                }
                if (!enrichedBooks[i].coverUrl && work.covers?.length) {
                  const coverId = work.covers.find(c => c > 0);
                  if (coverId) enrichedBooks[i].coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
                }
                if (work.subjects?.length) applySubjects(work.subjects);
                if (!enrichedBooks[i].coverUrl) {
                  try {
                    const edRes = await fetch(`https://openlibrary.org${workKey}/editions.json?limit=10`);
                    const edData = await edRes.json();
                    for (const ed of (edData.entries || [])) {
                      if (ed.covers?.length && ed.covers[0] > 0) {
                        enrichedBooks[i].coverUrl = `https://covers.openlibrary.org/b/id/${ed.covers[0]}-M.jpg`;
                        break;
                      }
                    }
                  } catch { /* ignore */ }
                }
              } catch { /* ignore */ }
            };

            const applyOLSearchDoc = async (doc) => {
              if (!enrichedBooks[i].coverUrl && doc.cover_i)
                enrichedBooks[i].coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
              if (doc.subject?.length) applySubjects(doc.subject);
              if (doc.key && (!enrichedBooks[i].description || !enrichedBooks[i].coverUrl))
                await applyOLWork(doc.key);
            };

            // Step 1: OL edition by ISBN (direct — richest data)
            if (b.isbn && (!enrichedBooks[i].description || !enrichedBooks[i].coverUrl)) {
              try {
                const res = await fetch(`https://openlibrary.org/isbn/${b.isbn}.json`);
                if (res.ok) {
                  const ed = await res.json();
                  if (!enrichedBooks[i].coverUrl && ed.covers?.length && ed.covers[0] > 0)
                    enrichedBooks[i].coverUrl = `https://covers.openlibrary.org/b/id/${ed.covers[0]}-M.jpg`;
                  if (!enrichedBooks[i].description) {
                    const d = ed.description?.value || ed.description || "";
                    if (d && typeof d === "string" && d.length > 20) enrichedBooks[i].description = d;
                  }
                  const workKey = ed.works?.[0]?.key;
                  if (workKey) await applyOLWork(workKey);
                }
              } catch { /* ignore */ }
            }

            // Step 2: OL search by ISBN
            if (b.isbn && (!enrichedBooks[i].description || !enrichedBooks[i].coverUrl)) {
              try {
                const res = await fetch(`https://openlibrary.org/search.json?isbn=${encodeURIComponent(b.isbn)}&limit=1&fields=key,title,author_name,isbn,subject,cover_i`);
                const doc = (await res.json()).docs?.[0];
                if (doc) await applyOLSearchDoc(doc);
              } catch { /* ignore */ }
            }

            // Step 3: OL by title + author if still missing cover or description
            if (!enrichedBooks[i].coverUrl || !enrichedBooks[i].description) {
              try {
                const q = normAuthor
                  ? `title=${encodeURIComponent(cleaned)}&author=${encodeURIComponent(normAuthor)}`
                  : `q=${encodeURIComponent(cleaned)}`;
                const res = await fetch(`https://openlibrary.org/search.json?${q}&limit=1&fields=key,title,author_name,isbn,subject,cover_i`);
                const doc = (await res.json()).docs?.[0];
                if (doc) await applyOLSearchDoc(doc);
              } catch { /* ignore */ }
            }

            // Step 3: Google Books fallback if still no description or genre
            if (!enrichedBooks[i].description || updatedGenres[b._csvIdx] === "Fiction") {
              try {
                const gKey = localStorage.getItem("sk_google_api_key") || "";
                const gKeySuffix = gKey ? `&key=${gKey}` : "";
                const gq = normAuthor
                  ? `intitle:${encodeURIComponent(cleaned)}+inauthor:${encodeURIComponent(normAuthor)}`
                  : `intitle:${encodeURIComponent(cleaned)}`;
                const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${gq}&maxResults=1&langRestrict=en${gKeySuffix}`);
                const json = await res.json();
                if (!json.error) {
                  const vol = json.items?.[0]?.volumeInfo;
                  if (vol?.description) enrichedBooks[i].description = vol.description;
                  if (!enrichedBooks[i].coverUrl && vol?.imageLinks?.thumbnail)
                    enrichedBooks[i].coverUrl = vol.imageLinks.thumbnail.replace("http://", "https://");
                  if (vol?.categories?.length) {
                    const genre = detectGenre(vol.categories, b.title);
                    if (genre && genre !== "Fiction") updatedGenres[b._csvIdx] = genre;
                  }
                }
              } catch { /* Google unavailable */ }
            }
          } catch { /* leave defaults */ }
          setCsvEnrichProgress({ done: i + 1, total: books.length });
          // Merge enrichment updates but preserve any genres the user manually changed
          setCsvGenres(prev => {
            const merged = { ...updatedGenres };
            csvUserEditedRef.current.forEach(idx => {
              if (prev[idx] !== undefined) merged[idx] = prev[idx];
            });
            return merged;
          });
          setCsvBooks([...enrichedBooks]);
        }
        setCsvEnriching(false);
        setCsvEnrichProgress(null);
      }
    };
    reader.readAsText(file);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setResults([]);
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=title,author_name,isbn,subject,cover_i,description`
      );
      const data = await res.json();
      setResults(data.docs || []);
    } catch {
      setSearchError("Search failed. Please check your connection and try again.");
    } finally {
      setSearching(false);
    }
  };

  const addToPending = (result, resultIndex) => {
    const title = result.title || "";
    const genre = detectGenre(result.subject || [], title);
    const isbn = result.isbn ? result.isbn[0] : null;
    const coverUrl = result.cover_i ? `https://covers.openlibrary.org/b/id/${result.cover_i}-S.jpg` : "";

    // Duplicate check
    const existingUserBooks = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
    const allLibraryBooks = Object.values(library).flat();
    const existingIsbns = new Set([...existingUserBooks, ...allLibraryBooks].map(b => b.isbn).filter(Boolean));
    const existingTitles = new Set([...existingUserBooks, ...allLibraryBooks].map(b => b.title.toLowerCase().trim()));
    const alreadyInPending = pending.some(b => b.title.toLowerCase().trim() === title.toLowerCase().trim());

    if ((isbn && existingIsbns.has(isbn)) || existingTitles.has(title.toLowerCase().trim()) || alreadyInPending) {
      alert(`"${title}" is already in your library!`);
      return;
    }

    const book = {
      _pendingId: `result-${resultIndex}-${pending.length}`,
      title,
      author: (result.author_name || []).join(", "),
      isbn: isbn || "",
      coverUrl,
      genre,
      type: mediaType,
      platform: platform.id,
    };
    setPending(prev => [...prev, book]);
    setPendingGenres(prev => ({ ...prev, [book._pendingId]: genre }));
  };

  const removePending = (pendingId) => {
    setPending(prev => prev.filter(b => b._pendingId !== pendingId));
    setPendingGenres(prev => { const n = { ...prev }; delete n[pendingId]; return n; });
  };

  const handleConfirmSearch = () => {
    const books = pending.map(b => ({
      title: b.title,
      author: b.author,
      isbn: b.isbn,
      coverUrl: b.coverUrl,
      type: mediaType,
      genre: pendingGenres[b._pendingId] || b.genre,
      platform: platform.id,
      description: "",
    }));
    onImport(books);
  };

  const handleConfirmCSV = () => {
    const isGoodreads = platform.id === "goodreads";
    const isApple = platform.id === "apple";
    const books = csvBooks.map(b => ({
      title: b.title,
      author: b.author,
      isbn: b.isbn || "",
      coverUrl: b.coverUrl || "",
      readUrl: b.readUrl || "",
      type: isApple && b.mediaType ? (b.mediaType === "audiobook" ? "audiobooks" : "ebooks") : mediaType,
      genre: csvGenres[b._csvIdx] || "Fiction",
      platform: platform.id,
      description: b.description || "",
      storeId: isApple ? (b.storeId || "") : undefined,
      _status: b.status || null,
      _dateRead: isGoodreads ? b.dateRead : null,
      _dateAdded: isGoodreads ? b.dateAdded : null,
    }));
    onImport(books);
  };

  const tabBtnStyle = (tab) => ({
    padding: "8px 18px",
    borderRadius: 6,
    border: "1px solid #8B5E3C",
    cursor: "pointer",
    fontFamily: '"Palatino Linotype", Palatino, serif',
    fontSize: 13,
    fontWeight: activeTab === tab ? 700 : 400,
    background: activeTab === tab ? "#3A2A1A" : "#F8F1E4",
    color: activeTab === tab ? "#F8F1E4" : "#3A2A1A",
    transition: "all 0.15s",
  });

  const genreSelect = (value, onChange) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        fontFamily: "Georgia, serif",
        fontSize: 12,
        padding: "3px 6px",
        borderRadius: 4,
        border: "1px solid #8B5E3C",
        background: "#F8F1E4",
        color: "#3A2A1A",
        cursor: "pointer",
      }}
    >
      {ALL_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
    </select>
  );

  const PLATFORM_CONFIG = {
    kindle:     { url: "https://www.amazon.com/hz/mycd/myx#/home/content/booksAll/dateDsc/", step1: 'Open DevTools (F12 or Cmd+Option+J), go to the Console tab, paste the script below, and press Enter. A CSV will download automatically.' },
    kobo:       { url: "https://www.kobo.com/ww/en/account/books", step1: 'Go to My Books, click "Export" in the top right to download your library CSV.' },
    goodreads:  { url: "https://www.goodreads.com/review/import", step1: 'Scroll down to "Export Library" and click the export button. A CSV file will download.' },
    apple:      { url: null, step1: 'Run the export script below in Terminal. It reads your Apple Books library directly from your Mac and saves a CSV file to your Desktop.' },
    audible:    { url: "https://www.audible.com/library/titles", step1: 'Open your Audible library, then export using the Chrome extension or the console script below.' },
    chirp:       { url: "https://www.chirpbooks.com/library", step1: 'Open DevTools (F12 or Cmd+Option+J), go to the Console tab, paste the script below, and press Enter. A CSV will download automatically.' },
    bookfunnel:  { url: "https://my.bookfunnel.com", step1: 'Open DevTools (F12 or Cmd+Option+J), go to the Console tab, paste the script below, and press Enter. A CSV will download automatically.' },
  };
  const platformConfig = PLATFORM_CONFIG[platform.id] || null;

  const chirpScript = `async function exportChirp() {
  const seen = new Map();
  function getDescription(card) {
    const selectors = [
      '[class*="description"]', '[class*="blurb"]', '[class*="synopsis"]',
      '[class*="summary"]', '[class*="subtitle"]', 'p'
    ];
    for (const s of selectors) {
      const el = card && card.querySelector(s);
      if (el && el.innerText && el.innerText.trim().length > 20) {
        return el.innerText.trim().replace(/\\n/g, ' ');
      }
    }
    return '';
  }
  async function collectPage() {
    await new Promise(r => setTimeout(r, 2500));
    document.querySelectorAll('img[alt^="Book cover for"]').forEach(img => {
      const match = img.alt.match(/^Book cover for (.+?) by (.+)$/);
      if (!match) return;
      const [, title, author] = match;
      if (seen.has(title)) return;
      const coverUrl = img.src || '';
      const card = img.closest('[class*="card"], [class*="item"], [class*="book"], li, article') || img.parentElement?.parentElement;
      const description = getDescription(card);
      seen.set(title, { author, coverUrl, description });
    });
    console.log('Collected ' + seen.size + ' books so far');
  }
  await collectPage();
  for (let page = 2; page <= 50; page++) {
    const nextBtn = [...document.querySelectorAll('a, button')].find(el =>
      el.href?.includes('page=' + page) || el.innerText?.trim() === String(page)
    );
    if (!nextBtn) { console.log('Done.'); break; }
    nextBtn.click();
    await collectPage();
  }
  const esc = s => '"' + (s || '').replace(/"/g, '""') + '"';
  const csv = ['title,author,coverUrl,description,mediaType',
    ...[...seen.entries()].map(([t, b]) =>
      [esc(t), esc(b.author), esc(b.coverUrl), esc(b.description), esc('audiobook')].join(',')
    )
  ].join('\\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'chirp_library.csv';
  a.click();
  console.log('Done! ' + seen.size + ' books exported.');
}
exportChirp();`;

  const kindleScript = `async function exportKindle() {
  const books = [];
  let token = '0';
  while (token !== null) {
    const url = 'https://read.amazon.com/kindle-library/search?query=&libraryType=BOOKS&sortType=recency&querySize=50&paginationToken=' + token;
    const data = await fetch(url).then(r => r.json());
    (data.itemsList || []).forEach(b => {
      books.push({
        title: b.title || '',
        author: (b.authors || []).join(', '),
        coverUrl: b.productUrl || '',
        readUrl: b.webReaderUrl || ''
      });
    });
    console.log('Fetched ' + books.length + ' books so far...');
    token = data.paginationToken || null;
    await new Promise(r => setTimeout(r, 300));
  }
  const csv = ['title,author,coverUrl,readUrl', ...books.map(b =>
    '"' + b.title.replace(/"/g, '""') + '","' + b.author.replace(/"/g, '""') + '","' + b.coverUrl + '","' + b.readUrl + '"'
  )].join('\\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'kindle_library.csv';
  a.click();
  console.log('Done! ' + books.length + ' books exported.');
}
exportKindle();`;

  // Bookmarklet versions (minified for href use)
  const kindleBookmarklet = `async function(){const b=[];let t='0';while(t!==null){const d=await fetch('https://read.amazon.com/kindle-library/search?query=&libraryType=BOOKS&sortType=recency&querySize=50&paginationToken='+t).then(r=>r.json());(d.itemsList||[]).forEach(x=>b.push({title:x.title||'',author:(x.authors||[]).join(', '),coverUrl:x.productUrl||''}));console.log('Fetched '+b.length+' books...');t=d.paginationToken||null;await new Promise(r=>setTimeout(r,300));}const csv=['title,author,coverUrl',...b.map(x=>'"'+x.title.replace(/"/g,'""')+'","'+x.author.replace(/"/g,'""')+'","'+x.coverUrl+'"')].join('\\n');const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='kindle_library.csv';a.click();console.log('Done! '+b.length+' books.');}`;
  const chirpBookmarklet = `async function(){const seen=new Map();async function c(){await new Promise(r=>setTimeout(r,2500));document.querySelectorAll('img[alt^="Book cover for"]').forEach(img=>{const m=img.alt.match(/^Book cover for (.+?) by (.+)$/);if(m)seen.set(m[1],m[2]);});console.log('Collected '+seen.size+' books');}await c();for(let p=2;p<=50;p++){const n=[...document.querySelectorAll('a,button')].find(el=>el.href?.includes('page='+p)||el.innerText?.trim()===String(p));if(!n){console.log('Done.');break;}n.click();await c();}const csv=['title,author',...[...seen.entries()].map(([t,a])=>'"'+t.replace(/"/g,'""')+'","'+a.replace(/"/g,'""')+'"')].join('\\n');const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='chirp_library.csv';a.click();}`;

  const audibleScript = `async function exportAudible() {
  const books = [];
  async function scrapePage() {
    await new Promise(r => setTimeout(r, 2000));
    const rows = document.querySelectorAll('li[id^="adbl-library-content-row"]');
    rows.forEach(row => {
      const asin = row.id.replace('adbl-library-content-row-', '');
      const titleEl = row.querySelector('.bc-size-headline3, h3.bc-heading, .bc-heading');
      const title = titleEl ? titleEl.textContent.trim() : '';
      const authorLinks = row.querySelectorAll('li.authorLabel a');
      const author = authorLinks.length
        ? [...authorLinks].map(a => a.textContent.trim()).join(', ')
        : (row.querySelector('.authorLabel')?.textContent?.replace(/^By:?\\s*/i, '').trim() || '');
      const img = row.querySelector('img.bc-image-inset-border, .bc-image img');
      const coverUrl = img ? img.src : '';
      if (title && asin) books.push({ title, author, coverUrl, asin });
    });
    console.log('Collected ' + books.length + ' books so far...');
  }
  await scrapePage();
  for (let p = 2; p <= 200; p++) {
    const nextBtn = document.querySelector('span.nextButton:not(.bc-button-disabled) button') ||
      [...document.querySelectorAll('button, a')].find(el =>
        el.getAttribute('aria-label') === 'Next page' || el.textContent.trim() === 'Next page');
    if (!nextBtn) { console.log('No more pages. Done!'); break; }
    nextBtn.click();
    await scrapePage();
  }
  if (books.length === 0) {
    console.log('No books found. Make sure you are on https://www.audible.com/library/titles and logged in.');
    return;
  }
  const csv = ['title,author,coverUrl,asin', ...books.map(b =>
    '"' + b.title.replace(/"/g, '""') + '","' + b.author.replace(/"/g, '""') + '","' + b.coverUrl + '","' + b.asin + '"'
  )].join('\\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'audible_library.csv';
  a.click();
  console.log('Done! ' + books.length + ' books exported.');
}
exportAudible();`;

  const bookfunnelScript = `async function exportBookFunnel() {
  console.log('Scrolling to load all books...');
  let lastHeight = 0;
  while (true) {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 1200));
    if (document.body.scrollHeight === lastHeight) break;
    lastHeight = document.body.scrollHeight;
  }
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 800));
  console.log('Scraping books...');
  const books = [];
  const seen = new Set();
  // Collect all [class*="book"] elements that have text content (covers cards with or without images)
  const cardSet = new Set();
  document.querySelectorAll('[class*="book"]').forEach(el => {
    if ((el.innerText || '').trim().length > 2) cardSet.add(el);
  });
  // Also catch cards via their images
  document.querySelectorAll('[class*="book"] img').forEach(img => {
    const card = img.closest('[class*="book"]');
    if (card) cardSet.add(card);
  });
  const skipped = [];
  cardSet.forEach(card => {
    const img = card.querySelector('img');
    const titleEl = card.querySelector('[class*="title"], [class*="name"], h2, h3, h4, strong');
    const authorEl = card.querySelector('[class*="author"], [class*="by"]');
    const lines = (card.innerText || '').trim().split('\\n').map(s => s.trim()).filter(Boolean);
    const rawTitle = (titleEl?.innerText || lines[0] || '').trim();
    const title = rawTitle.replace(/^by\\s+/i, '').replace(/^DIRECT\\s*-\\s*/i, '').trim();
    if (!title || title.length < 2) { skipped.push('EMPTY: ' + rawTitle.substring(0,40)); return; }
    if (seen.has(title)) { skipped.push('DUP: ' + title.substring(0,40)); return; }
    const author = (authorEl?.innerText || lines[1] || '').replace(/^by\\s+/i, '').trim();
    const coverUrl = img?.src || '';
    const readUrl = card.querySelector('a[href*="download"], a[href*="read"]')?.href || card.querySelector('a')?.href || '';
    seen.add(title);
    books.push({ title, author, coverUrl, readUrl });
  });
  if (skipped.length) console.log('Skipped (' + skipped.length + '):', skipped);
  console.log('Found ' + books.length + ' books (from ' + cardSet.size + ' card elements)');
  if (books.length === 0) {
    console.warn('No books found — try scrolling manually to the bottom first, then run again.');
    return;
  }
  const esc = s => '"' + (s || '').replace(/"/g, '""') + '"';
  const csv = ['title,author,coverUrl,readUrl',
    ...books.map(b => [esc(b.title), esc(b.author), esc(b.coverUrl), esc(b.readUrl)].join(','))
  ].join('\\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'bookfunnel_library.csv';
  a.click();
  console.log('Done! ' + books.length + ' books exported.');
}
exportBookFunnel();`;

  const [scriptCopied, setScriptCopied] = useState(false);
  const [kindleScriptCopied, setKindleScriptCopied] = useState(false);
  const [audibleScriptCopied, setAudibleScriptCopied] = useState(false);
  const copyScript = () => {
    navigator.clipboard.writeText(chirpScript).then(() => {
      setScriptCopied(true);
      setTimeout(() => setScriptCopied(false), 2000);
    });
  };
  const copyKindleScript = () => {
    navigator.clipboard.writeText(kindleScript).then(() => {
      setKindleScriptCopied(true);
      setTimeout(() => setKindleScriptCopied(false), 2000);
    });
  };
  const copyAudibleScript = () => {
    navigator.clipboard.writeText(audibleScript).then(() => {
      setAudibleScriptCopied(true);
      setTimeout(() => setAudibleScriptCopied(false), 2000);
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 400,
        background: "rgba(20,14,8,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 600,
          width: "100%",
          background: "#F8F1E4",
          border: "1px solid #8B5E3C",
          borderRadius: 12,
          padding: 28,
          position: "relative",
          boxShadow: "0 16px 48px rgba(0,0,0,0.55)",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6B4E32", lineHeight: 1, padding: "2px 6px" }}
          aria-label="Close"
        >✕</button>

        {/* Header */}
        <h2 style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 20, color: "#3A2A1A", margin: "0 0 18px 0", paddingRight: 30 }}>
          {platform.emoji} {platform.name} — Import Library
        </h2>

        {/* CSV platform: step-by-step flow */}
        {showCSV && platformConfig && (
          <div style={{ marginBottom: 20 }}>

            {/* Apple Books: Terminal script export */}
            {platform.id === "apple" && (
              <>
                <div style={{ background: "#FFF3CD", border: "1px solid #E6C86E", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18, lineHeight: 1.3 }}>⚠️</span>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#5C4A00", lineHeight: 1.6 }}>
                    <strong>Mac required for library export.</strong> The export script runs in Terminal on a Mac. Once you have the CSV file, you can upload it here from any device.
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.5)", border: "1px solid #D8C3A5", borderRadius: 8, padding: 14, marginBottom: 12 }}>
                  <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontWeight: 700, fontSize: 13, color: "#3A2A1A", marginBottom: 6 }}>
                    Step 1 — Run the Export Script
                  </div>
                  <ol style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#4B3A2A", margin: "0 0 10px 0", paddingLeft: 18, lineHeight: 2 }}>
                    <li>Open <strong>Terminal</strong> on your Mac (search Spotlight for "Terminal")</li>
                    <li>Click <strong>Copy Script</strong> below, paste it into Terminal, and press <strong>Enter</strong></li>
                    <li>A file called <strong>apple-books-export.csv</strong> will appear on your Desktop</li>
                  </ol>
                  <pre style={{ background: "#2A1A0A", color: "#C9A96E", fontSize: 10, padding: 10, borderRadius: 6, overflowX: "auto", marginBottom: 8, whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 100, overflowY: "auto" }}>
{`DB="$HOME/Library/Containers/com.apple.iBooksX/Data/Documents/BKLibrary/BKLibrary-1-091020131601.sqlite"
OUT="$HOME/Desktop/apple-books-export.csv"
sqlite3 -csv "$DB" "SELECT COALESCE(ZTITLE,''),COALESCE(ZAUTHOR,''),COALESCE(REPLACE(ZBOOKDESCRIPTION,CHAR(10),' '),''),COALESCE(ZGENRE,''),CASE WHEN ZISSTOREAUDIOBOOK=1 THEN 'audiobook' ELSE 'ebook' END,COALESCE(ZSTOREID,''),COALESCE(ZREADINGPROGRESS,0) FROM ZBKLIBRARYASSET WHERE ZTITLE IS NOT NULL ORDER BY ZTITLE;" > "$OUT.tmp"
echo "title,author,description,genre,mediaType,storeId,readingProgress" > "$OUT"
cat "$OUT.tmp" >> "$OUT" && rm "$OUT.tmp"
echo "✅ Done! Check your Desktop for apple-books-export.csv"`}
                  </pre>
                  <BookmarkletCopyButton code={`DB="$HOME/Library/Containers/com.apple.iBooksX/Data/Documents/BKLibrary/BKLibrary-1-091020131601.sqlite"\nOUT="$HOME/Desktop/apple-books-export.csv"\nsqlite3 -csv "$DB" "SELECT COALESCE(ZTITLE,''),COALESCE(ZAUTHOR,''),COALESCE(REPLACE(ZBOOKDESCRIPTION,CHAR(10),' '),''),COALESCE(ZGENRE,''),CASE WHEN ZISSTOREAUDIOBOOK=1 THEN 'audiobook' ELSE 'ebook' END,COALESCE(ZSTOREID,''),COALESCE(ZREADINGPROGRESS,0) FROM ZBKLIBRARYASSET WHERE ZTITLE IS NOT NULL ORDER BY ZTITLE;" > "$OUT.tmp"\necho "title,author,description,genre,mediaType,storeId,readingProgress" > "$OUT"\ncat "$OUT.tmp" >> "$OUT" && rm "$OUT.tmp"\necho "✅ Done! Check your Desktop for apple-books-export.csv"`} label="Copy Script" isScript />
                </div>

                <div style={{ background: "rgba(255,255,255,0.5)", border: "1px solid #D8C3A5", borderRadius: 8, padding: 14 }}>
                  <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontWeight: 700, fontSize: 13, color: "#3A2A1A", marginBottom: 6 }}>
                    Step 2 — Upload Your CSV
                  </div>
                  <label
                    onDragOver={e => { e.preventDefault(); setCsvDragOver(true); }}
                    onDragLeave={() => setCsvDragOver(false)}
                    onDrop={e => { e.preventDefault(); setCsvDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleCSVFile({ target: { files: [f] } }); }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "20px 16px", background: csvDragOver ? "#EDE0CC" : "rgba(255,255,255,0.5)", border: `2px dashed ${csvDragOver ? "#8B5E3C" : "#C9A96E"}`, borderRadius: 8, cursor: "pointer", transition: "all 0.2s", marginBottom: csvBooks.length > 0 ? 14 : 0 }}>
                    <span style={{ fontSize: 28 }}>📄</span>
                    <span style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, color: "#3A2A1A", fontWeight: 600 }}>
                      {csvDragOver ? "Drop it here!" : "Drag & drop your CSV here"}
                    </span>
                    <span style={{ fontFamily: "Georgia, serif", fontSize: 11, color: "#6B4E32", fontStyle: "italic" }}>or click to browse</span>
                    <input type="file" accept=".csv" onChange={handleCSVFile} style={{ display: "none" }} />
                  </label>
                  {csvBooks.length > 0 && (
                    <>
                      <p style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "#3A2A1A", marginBottom: 8 }}>
                        Found {csvBooks.length} book{csvBooks.length !== 1 ? "s" : ""}{csvSkipped > 0 ? ` · ${csvSkipped} duplicate${csvSkipped !== 1 ? "s" : ""} skipped` : ""}.
                      </p>
                      <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 12, border: "1px solid #D8C3A5", borderRadius: 6 }}>
                        {csvBooks.map(b => (
                          <div key={b._csvIdx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderBottom: "1px solid #D8C3A5" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 600, color: "#3A2A1A" }}>{b.title}</div>
                              <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: "#6B4E32" }}>{b.author} {b.mediaType === "audiobook" ? "🎧" : "📖"}</div>
                            </div>
                            {genreSelect(csvGenres[b._csvIdx] || "Fiction", (val) => { csvUserEditedRef.current.add(b._csvIdx); { csvUserEditedRef.current.add(b._csvIdx); setCsvGenres(prev => ({ ...prev, [b._csvIdx]: val })); }; })}
                          </div>
                        ))}
                      </div>
                      <button onClick={handleConfirmCSV} style={{ padding: "9px 20px", background: "#3A2A1A", color: "#F8F1E4", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 14, fontWeight: 700 }}>
                        📥 Import {csvBooks.length} Book{csvBooks.length !== 1 ? "s" : ""}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Bookmarklet platforms: Kindle, Chirp, Audible & BookFunnel */}
            {(platform.id === "kindle" || platform.id === "chirp" || platform.id === "audible" || platform.id === "bookfunnel") && (
              <>
                <div style={{ background: "#FFF3CD", border: "1px solid #E6C86E", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18, lineHeight: 1.3 }}>⚠️</span>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#5C4A00", lineHeight: 1.6 }}>
                    <strong>Desktop browser required for library export.</strong> The export step uses browser DevTools or a Chrome extension that are not available on mobile or tablet. To import your {platform.name} library, complete the export on a desktop computer first, save the CSV file, then upload it here from any device.
                  </div>
                </div>
                {/* Step 1: Open platform and run script */}
                <div style={{ background: "rgba(255,255,255,0.5)", border: "1px solid #D8C3A5", borderRadius: 8, padding: 14, marginBottom: 12 }}>
                  <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontWeight: 700, fontSize: 13, color: "#3A2A1A", marginBottom: 6 }}>
                    Step 1 — Open {platform.name}
                  </div>
                  <a href={platformConfig.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-block", padding: "7px 16px", background: "#8B5E3C", color: "#F8F1E4", borderRadius: 6, fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, textDecoration: "none" }}>
                    🔗 Open {platform.name} →
                  </a>
                </div>

                {/* Step 2: Run the console script */}
                <div style={{ background: "rgba(255,255,255,0.5)", border: "1px solid #D8C3A5", borderRadius: 8, padding: 14, marginBottom: 12 }}>
                  <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontWeight: 700, fontSize: 13, color: "#3A2A1A", marginBottom: 6 }}>
                    Step 2 — Export Your Library
                  </div>
                  {platform.id === "audible" && (
                    <div style={{ background: "#FFF8EE", border: "1px solid #C9A96E", borderRadius: 6, padding: "8px 12px", marginBottom: 10, fontFamily: "Georgia, serif", fontSize: 12, color: "#4B3A2A" }}>
                      <strong>Option A — Chrome Extension (easiest):</strong> Install the free <em>"Audible Library Exporter"</em> Chrome extension from the Chrome Web Store, then click its icon while on your Audible library page to download a CSV instantly. Skip to Step 3.
                      <br /><br />
                      <strong>Option B — Console Script (works in any browser):</strong> Follow the steps below.
                    </div>
                  )}
                  <ol style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#4B3A2A", margin: "0 0 10px 0", paddingLeft: 18, lineHeight: 2 }}>
                    <li>Press <strong>F12</strong> (Windows) or <strong>Cmd + Option + J</strong> (Mac) to open DevTools</li>
                    <li>Click the <strong>Console</strong> tab at the top</li>
                    <li>Click <strong>Copy Script</strong> below, then paste it into the Console and press <strong>Enter</strong></li>
                    <li>Wait for it to finish — a CSV file will download automatically</li>
                    {platform.id === "audible" && <li>The script scrolls through every page of your library automatically — larger libraries take a few minutes</li>}
                  </ol>
                  <pre style={{ background: "#2A1A0A", color: "#C9A96E", fontSize: 10, padding: 10, borderRadius: 6, overflowX: "auto", marginBottom: 8, whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 100, overflowY: "auto" }}>
                    {platform.id === "kindle" ? kindleScript : platform.id === "audible" ? audibleScript : platform.id === "bookfunnel" ? bookfunnelScript : chirpScript}
                  </pre>
                  <BookmarkletCopyButton code={platform.id === "kindle" ? kindleScript : platform.id === "audible" ? audibleScript : platform.id === "bookfunnel" ? bookfunnelScript : chirpScript} label="Copy Script" isScript />
                </div>

                {/* Step 3: Upload */}
                <div style={{ background: "rgba(255,255,255,0.5)", border: "1px solid #D8C3A5", borderRadius: 8, padding: 14 }}>
                  <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontWeight: 700, fontSize: 13, color: "#3A2A1A", marginBottom: 6 }}>
                    Step 3 — Upload Your CSV
                  </div>
                  <label
                    onDragOver={e => { e.preventDefault(); setCsvDragOver(true); }}
                    onDragLeave={() => setCsvDragOver(false)}
                    onDrop={e => { e.preventDefault(); setCsvDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleCSVFile({ target: { files: [f] } }); }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "20px 16px", background: csvDragOver ? "#EDE0CC" : "rgba(255,255,255,0.5)", border: `2px dashed ${csvDragOver ? "#8B5E3C" : "#C9A96E"}`, borderRadius: 8, cursor: "pointer", transition: "all 0.2s", marginBottom: csvBooks.length > 0 ? 14 : 0 }}>
                    <span style={{ fontSize: 28 }}>📄</span>
                    <span style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, color: "#3A2A1A", fontWeight: 600 }}>
                      {csvDragOver ? "Drop it here!" : "Drag & drop your CSV here"}
                    </span>
                    <span style={{ fontFamily: "Georgia, serif", fontSize: 11, color: "#6B4E32", fontStyle: "italic" }}>or click to browse</span>
                    <input type="file" accept=".csv" onChange={handleCSVFile} style={{ display: "none" }} />
                  </label>
                  {csvBooks.length > 0 && (
                    <>
                      <p style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "#3A2A1A", marginBottom: 8 }}>
                        Found {csvBooks.length} book{csvBooks.length !== 1 ? "s" : ""}{csvSkipped > 0 ? ` · ${csvSkipped} duplicate${csvSkipped !== 1 ? "s" : ""} skipped` : ""}.
                      </p>
                      {csvEnriching && csvEnrichProgress && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: "#6B4E32", marginBottom: 4 }}>
                            🔍 Detecting genres… {csvEnrichProgress.done} / {csvEnrichProgress.total}
                          </div>
                          <div style={{ background: "#D8C3A5", borderRadius: 4, height: 6, overflow: "hidden" }}>
                            <div style={{ background: "#8B5E3C", height: "100%", width: `${(csvEnrichProgress.done / csvEnrichProgress.total) * 100}%`, transition: "width 0.3s" }} />
                          </div>
                        </div>
                      )}
                      <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 12, border: "1px solid #D8C3A5", borderRadius: 6 }}>
                        {csvBooks.map(b => (
                          <div key={b._csvIdx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderBottom: "1px solid #D8C3A5" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 600, color: "#3A2A1A" }}>{b.title}</div>
                              <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: "#6B4E32" }}>{b.author}</div>
                            </div>
                            {genreSelect(csvGenres[b._csvIdx] || "Fiction", (val) => { csvUserEditedRef.current.add(b._csvIdx); setCsvGenres(prev => ({ ...prev, [b._csvIdx]: val })); })}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleConfirmCSV}
                        disabled={csvEnriching}
                        style={{ padding: "9px 20px", background: csvEnriching ? "#A08060" : "#3A2A1A", color: "#F8F1E4", border: "none", borderRadius: 6, cursor: csvEnriching ? "not-allowed" : "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 14, fontWeight: 700 }}
                      >
                        {csvEnriching ? "Detecting genres…" : `📥 Import ${csvBooks.length} Book${csvBooks.length !== 1 ? "s" : ""}`}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Non-bookmarklet CSV platforms: Kobo, Goodreads */}
            {(platform.id !== "kindle" && platform.id !== "chirp" && platform.id !== "audible" && platform.id !== "apple" && platform.id !== "bookfunnel") && (
              <>
                {/* Step 1 */}
                <div style={{ background: "rgba(255,255,255,0.5)", border: "1px solid #D8C3A5", borderRadius: 8, padding: 14, marginBottom: 12 }}>
                  <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontWeight: 700, fontSize: 13, color: "#3A2A1A", marginBottom: 6 }}>
                    Step 1 — Open {platform.name}
                  </div>
                  <p style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#4B3A2A", margin: "0 0 10px 0" }}>
                    {platformConfig.step1}
                  </p>
                  <a
                    href={platformConfig.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-block", padding: "7px 16px", background: "#8B5E3C", color: "#F8F1E4", borderRadius: 6, fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, textDecoration: "none" }}
                  >
                    🔗 Open {platform.name} →
                  </a>
                </div>
                {/* Step 2: Upload */}
                <div style={{ background: "rgba(255,255,255,0.5)", border: "1px solid #D8C3A5", borderRadius: 8, padding: 14 }}>
                  <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontWeight: 700, fontSize: 13, color: "#3A2A1A", marginBottom: 6 }}>
                    Step 2 — Upload Your CSV
                  </div>
                  <label
                    onDragOver={e => { e.preventDefault(); setCsvDragOver(true); }}
                    onDragLeave={() => setCsvDragOver(false)}
                    onDrop={e => { e.preventDefault(); setCsvDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleCSVFile({ target: { files: [f] } }); }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "20px 16px", background: csvDragOver ? "#EDE0CC" : "rgba(255,255,255,0.5)", border: `2px dashed ${csvDragOver ? "#8B5E3C" : "#C9A96E"}`, borderRadius: 8, cursor: "pointer", transition: "all 0.2s", marginBottom: csvBooks.length > 0 ? 14 : 0 }}>
                    <span style={{ fontSize: 28 }}>📄</span>
                    <span style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, color: "#3A2A1A", fontWeight: 600 }}>
                      {csvDragOver ? "Drop it here!" : "Drag & drop your CSV here"}
                    </span>
                    <span style={{ fontFamily: "Georgia, serif", fontSize: 11, color: "#6B4E32", fontStyle: "italic" }}>or click to browse</span>
                    <input type="file" accept=".csv" onChange={handleCSVFile} style={{ display: "none" }} />
                  </label>
                  {csvBooks.length > 0 && (
                    <>
                      <p style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "#3A2A1A", marginBottom: 8 }}>
                        Found {csvBooks.length} book{csvBooks.length !== 1 ? "s" : ""}{csvSkipped > 0 ? ` · ${csvSkipped} duplicate${csvSkipped !== 1 ? "s" : ""} skipped` : ""}.
                      </p>
                      {csvEnriching && csvEnrichProgress && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: "#6B4E32", marginBottom: 4 }}>
                            🔍 Detecting genres… {csvEnrichProgress.done} / {csvEnrichProgress.total}
                          </div>
                          <div style={{ background: "#D8C3A5", borderRadius: 4, height: 6, overflow: "hidden" }}>
                            <div style={{ background: "#8B5E3C", height: "100%", width: `${(csvEnrichProgress.done / csvEnrichProgress.total) * 100}%`, transition: "width 0.3s" }} />
                          </div>
                        </div>
                      )}
                      <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 12, border: "1px solid #D8C3A5", borderRadius: 6 }}>
                        {csvBooks.map(b => (
                          <div key={b._csvIdx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderBottom: "1px solid #D8C3A5" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 600, color: "#3A2A1A" }}>{b.title}</div>
                              <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: "#6B4E32" }}>{b.author}</div>
                            </div>
                            {genreSelect(csvGenres[b._csvIdx] || "Fiction", (val) => { csvUserEditedRef.current.add(b._csvIdx); setCsvGenres(prev => ({ ...prev, [b._csvIdx]: val })); })}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleConfirmCSV}
                        disabled={csvEnriching}
                        style={{ padding: "9px 20px", background: csvEnriching ? "#A08060" : "#3A2A1A", color: "#F8F1E4", border: "none", borderRadius: 6, cursor: csvEnriching ? "not-allowed" : "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 14, fontWeight: 700 }}
                      >
                        {csvEnriching ? "Detecting genres…" : `📥 Import ${csvBooks.length} Book${csvBooks.length !== 1 ? "s" : ""}`}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Divider for CSV platforms */}
        {showCSV && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#D8C3A5" }} />
            <span style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#8B5E3C", fontStyle: "italic" }}>or add books manually</span>
            <div style={{ flex: 1, height: 1, background: "#D8C3A5" }} />
          </div>
        )}

        {/* Paste Titles */}
        <div style={{ marginBottom: 20 }}>
          {!showCSV && (
            <p style={{ fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: "#6B4E32", marginBottom: 10 }}>
              Paste one book title per line — the app will look each one up automatically.
            </p>
          )}
          <textarea
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            placeholder={"The Name of the Wind\nProject Hail Mary\nDune\n..."}
            rows={showCSV ? 4 : 8}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #8B5E3C", fontFamily: "Georgia, serif", fontSize: 13, background: "#FFFDF8", color: "#3A2A1A", resize: "vertical", boxSizing: "border-box", marginBottom: 10 }}
          />
          <button
            onClick={handleBulkSearch}
            disabled={bulkSearching || !bulkText.trim()}
            style={{ padding: "8px 18px", background: bulkSearching ? "#D8C3A5" : "#3A2A1A", color: bulkSearching ? "#6B4E32" : "#F8F1E4", border: "none", borderRadius: 6, cursor: bulkSearching ? "default" : "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 700 }}
          >
            {bulkSearching ? `Searching… (${bulkProgress?.done}/${bulkProgress?.total})` : "🔍 Search All Titles"}
          </button>

          {bulkPending.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "#3A2A1A", marginBottom: 8 }}>
                Found {bulkPending.length} book{bulkPending.length !== 1 ? "s" : ""}. Confirm genres:
              </p>
              <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 12, border: "1px solid #D8C3A5", borderRadius: 6 }}>
                {bulkPending.map(b => (
                  <div key={b._pendingId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderBottom: "1px solid #D8C3A5" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 600, color: "#3A2A1A" }}>{b.title}</div>
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: "#6B4E32" }}>{b.author}</div>
                    </div>
                    <select value={bulkGenres[b._pendingId] || b.genre} onChange={e => setBulkGenres(prev => ({ ...prev, [b._pendingId]: e.target.value }))} style={{ fontFamily: "Georgia, serif", fontSize: 12, padding: "3px 6px", borderRadius: 4, border: "1px solid #8B5E3C", background: "#F8F1E4", color: "#3A2A1A" }}>
                      {ALL_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <button onClick={handleConfirmBulk} style={{ padding: "9px 20px", background: "#3A2A1A", color: "#F8F1E4", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 14, fontWeight: 700 }}>
                📥 Import {bulkPending.length} Book{bulkPending.length !== 1 ? "s" : ""}
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: "#6B4E32", marginBottom: 10 }}>
            Search for a specific book to add one at a time.
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Search by title or ISBN..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #8B5E3C",
                  fontFamily: "Georgia, serif",
                  fontSize: 13,
                  background: "#FFFDF8",
                  color: "#3A2A1A",
                }}
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                style={{
                  padding: "8px 16px",
                  background: "#3A2A1A",
                  color: "#F8F1E4",
                  border: "none",
                  borderRadius: 6,
                  cursor: searching ? "default" : "pointer",
                  fontFamily: '"Palatino Linotype", Palatino, serif',
                  fontSize: 13,
                  opacity: searching ? 0.7 : 1,
                }}
              >
                {searching ? "Searching…" : "Search"}
              </button>
            </div>

            {searchError && (
              <p style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "#a00", marginBottom: 12 }}>{searchError}</p>
            )}

            {/* Search results */}
            {results.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: "#6B4E32", marginBottom: 8 }}>
                  {results.length} result{results.length !== 1 ? "s" : ""} found:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {results.map((r, i) => {
                    const genre = detectGenre(r.subject || [], r.title || "");
                    const coverId = r.cover_i;
                    const alreadyPending = pending.some(b =>
                      b.title === r.title && b.author === (r.author_name || []).join(", ")
                    );
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px", background: "rgba(255,255,255,0.6)", borderRadius: 6, border: "1px solid #D8C3A5" }}>
                        {coverId ? (
                          <img src={`https://covers.openlibrary.org/b/id/${coverId}-S.jpg`} alt={r.title} style={{ width: 36, height: 50, objectFit: "cover", borderRadius: 3, border: "1px solid #C9A96E", flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 36, height: 50, background: "#D8C3A5", borderRadius: 3, flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 600, color: "#3A2A1A" }}>{r.title}</div>
                          <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: "#6B4E32" }}>{(r.author_name || []).join(", ")}</div>
                          <div style={{ fontFamily: "Georgia, serif", fontSize: 11, color: "#8B5E3C" }}>Genre: {genre}</div>
                        </div>
                        <button
                          onClick={() => addToPending(r, i)}
                          disabled={alreadyPending}
                          style={{
                            padding: "5px 10px",
                            background: alreadyPending ? "#D8C3A5" : "#3A2A1A",
                            color: alreadyPending ? "#6B4E32" : "#F8F1E4",
                            border: "none",
                            borderRadius: 5,
                            cursor: alreadyPending ? "default" : "pointer",
                            fontFamily: '"Palatino Linotype", Palatino, serif',
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                        >
                          {alreadyPending ? "Added" : "Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pending list */}
            {pending.length > 0 && (
              <div>
                <p style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 14, fontWeight: 700, color: "#3A2A1A", marginBottom: 8 }}>
                  Pending ({pending.length}):
                </p>
                <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 14 }}>
                  {pending.map(b => (
                    <div key={b._pendingId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderBottom: "1px solid #D8C3A5" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 600, color: "#3A2A1A" }}>{b.title}</div>
                        <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: "#6B4E32" }}>{b.author}</div>
                      </div>
                      {genreSelect(pendingGenres[b._pendingId] || b.genre, (val) => setPendingGenres(prev => ({ ...prev, [b._pendingId]: val })))}
                      <button
                        onClick={() => removePending(b._pendingId)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#a00", fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0 }}
                        aria-label="Remove"
                      >✕</button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleConfirmSearch}
                  style={{
                    padding: "9px 20px",
                    background: "#3A2A1A",
                    color: "#F8F1E4",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontFamily: '"Palatino Linotype", Palatino, serif',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  📥 Add to Library ({pending.length})
                </button>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}

function PlatformCard({ platform, connected, onConnect, onDisconnect, onImportClick, th }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{
      background: th.bgMuted,
      border: `1px solid ${th.border}`,
      borderRadius: 10,
      padding: "20px 16px",
      textAlign: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}>
      <div style={{ fontSize: 32, marginBottom: 6 }}>{platform.emoji}</div>
      <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 15, fontWeight: 700, color: th.text, marginBottom: 4 }}>{platform.name}</div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: th.textSoft, marginBottom: 10 }}>{platform.desc}</div>
      {COMING_SOON_PLATFORMS.has(platform.id) ? (
        <div style={{ display: "inline-block", padding: "5px 14px", borderRadius: 20, background: th.bgDeep, border: `1px solid ${th.border}`, fontFamily: "Georgia, serif", fontSize: 11, color: th.textSoft, fontStyle: "italic" }}>
          Coming Soon
        </div>
      ) : connected ? (
        <>
          <div style={{ color: "#2d6a2d", fontFamily: "Georgia, serif", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>✓ Connected</div>
          <button
            onClick={() => onImportClick && onImportClick(platform)}
            style={{
              display: "block",
              width: "100%",
              padding: "7px 0",
              marginBottom: 6,
              background: th.accent,
              color: th.bg,
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontFamily: '"Palatino Linotype", Palatino, serif',
              fontSize: 13,
            }}
          >
            📥 Import Library
          </button>
          <button
            onClick={() => onDisconnect(platform.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#a00",
              fontFamily: "Georgia, serif",
              fontSize: 12,
              textDecoration: "underline",
              padding: 0,
            }}
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onClick={() => { onConnect(platform.id); onImportClick && onImportClick(platform); }}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: `1px solid ${th.accent}`,
            cursor: "pointer",
            background: hover ? th.bgDeep : th.bg,
            color: th.text,
            fontFamily: '"Palatino Linotype", Palatino, serif',
            fontSize: 13,
            transition: "background 0.15s",
          }}
        >
          Connect
        </button>
      )}
    </div>
  );
}

const STRIPE_PUBLISHABLE_KEY = "pk_test_51ThDnUAr0payYLN5JLGvjsxTrB9aQwoOGCMPJbmBuzgt3yOThq4qMcqgwwPKFU9AzCGmGkvfJOYgyrGTlFWRci6d00frFemSGG";

const TIERS = [
  {
    id: "reluctant",
    icon: "📖",
    name: "The Reluctant Reader",
    price: "Free",
    priceNote: "Forever",
    color: "#8B5E3C",
    highlight: false,
    stripePrices: null,
    features: [
      "Up to 100 eBooks + 100 Audiobooks",
      "All genre shelves",
      "eBooks & Audiobooks toggle",
      "Manual book adding",
      "Basic reading status tracking",
      "TBR shelf",
      "Bio & top books on profile",
      "Social links on profile",
      "Book of the Month pick",
    ],
    locked: [
      "Platform imports",
      "Genre customization",
      "Drag-and-drop reordering",
      "Community discussions & book clubs",
      "Connect social accounts",
    ],
  },
  {
    id: "storyteller",
    icon: "☕",
    name: "The Storyteller",
    price: "$4.99",
    priceNote: "per month",
    yearlyPrice: "$49.99",
    yearlyNote: "per year — save $9.89",
    color: "#6B8C5E",
    highlight: false,
    stripeLinks: {
      monthly: "https://buy.stripe.com/9B63cudjjcnS0lc3fTeQM00",
      yearly:  "https://buy.stripe.com/3cI00ia772Ni5Fw4jXeQM01",
    },
    features: [
      "Up to 500 eBooks + 500 Audiobooks",
      "All genre shelves",
      "eBooks & Audiobooks toggle",
      "2 platform imports",
      "Genre drag-and-drop reordering",
      "Reading status tracking",
      "View community discussions (read-only)",
      "Connect TikTok & social accounts",
      "TBR shelf, bio & top books",
    ],
    locked: [
      "Genre customization",
      "Post in discussions",
      "Book clubs",
      "Reading stats & story calendar",
    ],
  },
  {
    id: "librarian",
    icon: "📚",
    name: "The Librarian",
    price: "$9.99",
    priceNote: "per month",
    yearlyPrice: "$99.99",
    yearlyNote: "per year — save $19.89",
    color: "#5E6B8C",
    highlight: false,
    stripeLinks: {
      monthly: "https://buy.stripe.com/8x26oG4MN5Zu2tkcQteQM02",
      yearly:  "https://buy.stripe.com/aFa3cu4MN5Zu6JAdUxeQM03",
    },
    features: [
      "Up to 2,000 books total",
      "All genre shelves",
      "Unlimited platform imports",
      "Full genre customization",
      "Rename & custom genre images",
      "Re-detect genres",
      "Search your library",
      "Reading stats & story calendar",
      "Full community profile visible to others",
      "Cloud sync across up to 2 devices",
    ],
    locked: [],
  },
  {
    id: "storykeeper",
    icon: "🗝️",
    name: "The StoryKeeper",
    price: "$14.99",
    priceNote: "per month",
    yearlyPrice: "$149.99",
    yearlyNote: "per year — save $29.89",
    color: "#8C5E6B",
    highlight: true,
    badge: "Most Popular",
    stripeLinks: {
      monthly: "https://buy.stripe.com/bJe9AS5QRew04BscQteQM04",
      yearly:  "https://buy.stripe.com/4gMeVca7773y6JA7w9eQM05",
    },
    features: [
      "Unlimited books",
      "Everything in The Librarian",
      "Cloud sync across unlimited devices",
      "Priority support",
      "Early access to new community features",
      "Exclusive StoryKeeper badge on profile & posts",
      "First access to author Q&As & exclusive events",
    ],
    locked: [],
  },
];

async function redirectToStripeCheckout(priceId) {
  try {
    const { loadStripe } = await import("@stripe/stripe-js");
    const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
    await stripe.redirectToCheckout({
      lineItems: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      successUrl: `${window.location.origin}?subscribed=true`,
      cancelUrl: window.location.href,
    });
  } catch (err) {
    alert("Unable to open checkout. Please try again.");
  }
}

function SubscriptionPage({ onClose, currentTier = "reluctant" }) {
  const scrollRef = useRef(null);
  const [atTop, setAtTop] = useState(true);
  const [billing, setBilling] = useState("monthly");
  const [hoveredTier, setHoveredTier] = useState(null);
  const [loadingTier, setLoadingTier] = useState(null);

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => setAtTop(e.currentTarget.scrollTop < 40)}
      style={{
        position: "fixed", inset: 0, zIndex: 550,
        background: "linear-gradient(135deg, #F5ECD7 0%, #EDE0C4 50%, #E8D5B0 100%)",
        overflowY: "auto",
        fontFamily: '"Palatino Linotype", Palatino, serif',
      }}
    >
      {/* Back button */}
      <button
        onClick={onClose}
        style={{
          position: "fixed", top: 56, left: 20, zIndex: 600,
          background: "rgba(245,236,215,0.9)", border: "1px solid #C9A96E",
          borderRadius: 20, padding: "6px 14px", cursor: "pointer",
          fontFamily: '"Palatino Linotype", Palatino, serif',
          fontSize: 13, color: "#3A2A1A",
          opacity: atTop ? 1 : 0, pointerEvents: atTop ? "auto" : "none",
          transition: "opacity 0.3s",
        }}
      >
        ← Back
      </button>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px 60px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 42, marginBottom: 10 }}>🗝️</div>
          <h1 style={{ fontSize: 32, color: "#3A2A1A", margin: "0 0 8px", fontWeight: 700 }}>
            Choose Your Chapter
          </h1>
          <p style={{ fontSize: 15, fontStyle: "italic", color: "#6B4E32", margin: "0 0 24px" }}>
            Every great story starts somewhere. Find the tier that fits your library.
          </p>

          {/* Billing toggle */}
          <div style={{
            display: "inline-flex", background: "rgba(255,255,255,0.5)",
            border: "1px solid #D8C3A5", borderRadius: 30, padding: 4, gap: 4,
          }}>
            {["monthly", "yearly"].map(b => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                style={{
                  padding: "7px 20px", borderRadius: 24, border: "none",
                  cursor: "pointer", fontSize: 13,
                  fontFamily: '"Palatino Linotype", Palatino, serif',
                  background: billing === b ? "#3A2A1A" : "transparent",
                  color: billing === b ? "#F8F1E4" : "#6B4E32",
                  fontWeight: billing === b ? 700 : 400,
                  transition: "all 0.2s",
                }}
              >
                {b === "monthly" ? "Monthly" : "Yearly 🎉 Save 17%"}
              </button>
            ))}
          </div>
        </div>

        {/* Tier cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          alignItems: "stretch",
        }}>
          {TIERS.map(tier => {
            const isActive = currentTier === tier.id;
            const isHovered = hoveredTier === tier.id;
            return (
              <div
                key={tier.id}
                onMouseEnter={() => setHoveredTier(tier.id)}
                onMouseLeave={() => setHoveredTier(null)}
                style={{
                  background: tier.highlight
                    ? "linear-gradient(160deg, #3A2A1A, #5C3D1E)"
                    : "rgba(255,255,255,0.65)",
                  border: isActive
                    ? `2px solid ${tier.color}`
                    : tier.highlight
                      ? "2px solid #C9A96E"
                      : "1px solid #D8C3A5",
                  borderRadius: 14,
                  padding: "24px 20px",
                  position: "relative",
                  transform: isActive ? "scale(1.04)" : isHovered ? "translateY(-4px)" : "none",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  boxShadow: isActive
                    ? "0 12px 40px rgba(0,0,0,0.2)"
                    : isHovered
                      ? "0 8px 32px rgba(0,0,0,0.15)"
                      : "0 2px 8px rgba(0,0,0,0.07)",
                  zIndex: isActive ? 2 : 1,
                }}
              >
                {/* Badge */}
                {tier.badge && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: tier.highlight ? "#C9A96E" : tier.color,
                    color: "#fff", fontSize: 11, fontWeight: 700,
                    padding: "3px 12px", borderRadius: 20,
                    whiteSpace: "nowrap", letterSpacing: 0.5,
                  }}>
                    {tier.badge}
                  </div>
                )}

                {/* Current plan indicator */}
                {isActive && (
                  <div style={{
                    position: "absolute", top: 12, right: 12,
                    background: tier.color, color: "#fff",
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                    letterSpacing: 0.5,
                  }}>
                    CURRENT
                  </div>
                )}

                {/* Icon & name */}
                <div style={{ fontSize: 28, marginBottom: 8 }}>{tier.icon}</div>
                <div style={{
                  fontSize: 16, fontWeight: 700,
                  color: tier.highlight ? "#F8F1E4" : "#3A2A1A",
                  marginBottom: 4,
                }}>
                  {tier.name}
                </div>

                {/* Price */}
                <div style={{ marginBottom: 16 }}>
                  <span style={{
                    fontSize: 28, fontWeight: 700,
                    color: tier.highlight ? "#C9A96E" : tier.color,
                  }}>
                    {billing === "yearly" && tier.yearlyPrice ? tier.yearlyPrice : tier.price}
                  </span>
                  <span style={{
                    fontSize: 11, fontStyle: "italic", marginLeft: 4,
                    color: tier.highlight ? "rgba(248,241,228,0.7)" : "#8B6A50",
                  }}>
                    {billing === "yearly" && tier.yearlyNote ? tier.yearlyNote : tier.priceNote}
                  </span>
                </div>

                {/* Divider */}
                <div style={{
                  height: 1,
                  background: tier.highlight ? "rgba(201,169,110,0.4)" : "#D8C3A5",
                  marginBottom: 14,
                }} />

                {/* Features */}
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 12px", fontSize: 12.5 }}>
                  {tier.features.map(f => (
                    <li key={f} style={{
                      display: "flex", gap: 8, alignItems: "flex-start",
                      marginBottom: 6,
                      color: tier.highlight ? "#F8F1E4" : "#3A2A1A",
                    }}>
                      <span style={{ color: "#6AAE6A", flexShrink: 0, marginTop: 1 }}>✓</span>
                      {f}
                    </li>
                  ))}
                  {tier.locked.map(f => (
                    <li key={f} style={{
                      display: "flex", gap: 8, alignItems: "flex-start",
                      marginBottom: 6,
                      color: tier.highlight ? "rgba(248,241,228,0.4)" : "#B0A090",
                    }}>
                      <span style={{ flexShrink: 0, marginTop: 1 }}>✗</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  disabled={isActive}
                  onClick={() => {
                    if (isActive || !tier.stripeLinks) return;
                    const link = billing === "yearly" ? tier.stripeLinks.yearly : tier.stripeLinks.monthly;
                    window.open(link, "_blank");
                  }}
                  style={{
                    width: "100%", padding: "10px 0",
                    background: isActive
                      ? "transparent"
                      : tier.highlight
                        ? "#C9A96E"
                        : "#3A2A1A",
                    color: isActive
                      ? (tier.highlight ? "#C9A96E" : "#3A2A1A")
                      : "#F8F1E4",
                    border: isActive
                      ? `1px solid ${tier.highlight ? "#C9A96E" : "#3A2A1A"}`
                      : "none",
                    borderRadius: 8, cursor: isActive ? "default" : "pointer",
                    fontFamily: '"Palatino Linotype", Palatino, serif',
                    fontSize: 13, fontWeight: 700,
                    transition: "all 0.2s",
                    opacity: 1,
                  }}
                >
                  {isActive ? "Current Plan" : tier.price === "Free" ? "Get Started" : "Upgrade"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p style={{
          textAlign: "center", marginTop: 36,
          fontSize: 12, fontStyle: "italic", color: "#8B6A50",
        }}>
          Cancel anytime. No hidden fees. Your library data is always yours. 🗝️
        </p>

        {/* Secure payment badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 }}>
          <span style={{ fontSize: 16 }}>🔒</span>
          <span style={{ fontSize: 12, color: "#8B6A50" }}>Payments are secure and encrypted via Stripe. We never store your card details.</span>
        </div>
      </div>
    </div>
  );
}

function PlatformPage({ onClose, mediaType, th, themeKey }) {
  const scrollRef = useRef(null);
  const [atTop, setAtTop] = useState(true);
  const [connections, setConnections] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sk_connections")) || {}; } catch { return {}; }
  });

  // Re-read connections from localStorage after a cloud sync
  useEffect(() => {
    const onSync = () => {
      try { setConnections(JSON.parse(localStorage.getItem("sk_connections")) || {}); } catch {}
    };
    window.addEventListener("sk-cloud-synced", onSync);
    return () => window.removeEventListener("sk-cloud-synced", onSync);
  }, []);
  const [importingPlatform, setImportingPlatform] = useState(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState(null);
  const [enrichProgress, setEnrichProgress] = useState(null);
  const enrichStopRef = useRef(false);
  const [isbnFinding, setIsbnFinding] = useState(false);
  const [isbnResult, setIsbnResult] = useState(null);
  const [isbnProgress, setIsbnProgress] = useState(null);
  const isbnStopRef = useRef(false);
  const [redetecting, setRedetecting] = useState(false);
  const [redetectResult, setRedetectResult] = useState(null);
  const [redetectProgress, setRedetectProgress] = useState(null);
  const redetectStopRef = useRef(false);
  const [bookCounts, setBookCounts] = useState(() => {
    const all = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
    return { total: all.length, noDesc: all.filter(needsDesc).length, noCover: all.filter(b => !b.coverUrl).length, noAuthor: all.filter(b => !b.author).length };
  });

  const refreshBookCounts = () => {
    const all = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
    setBookCounts({ total: all.length, noDesc: all.filter(needsDesc).length, noCover: all.filter(b => !b.coverUrl).length, noAuthor: all.filter(b => !b.author).length });
  };
  const [googleApiKey, setGoogleApiKey] = useState(() => localStorage.getItem("sk_google_api_key") || "");
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem("sk_google_api_key") || "");
  const [isbndbKey, setIsbndbKey] = useState(() => localStorage.getItem("sk_isbndb_key") || "");
  const [isbndbKeyInput, setIsbndbKeyInput] = useState(() => localStorage.getItem("sk_isbndb_key") || "");
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem("sk_supabase_url") || "https://elmoftpybhfxqzkrhkwe.supabase.co");
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem("sk_supabase_key") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsbW9mdHB5YmhmeHF6a3Joa3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNTAyMDksImV4cCI6MjA5NjYyNjIwOX0.HLHuP1CujyaJLCkpSiW56AHJZyCeFeJyGavQcbUeFOM");
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => localStorage.getItem("sk_supabase_url") || "https://elmoftpybhfxqzkrhkwe.supabase.co");
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => localStorage.getItem("sk_supabase_key") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsbW9mdHB5YmhmeHF6a3Joa3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNTAyMDksImV4cCI6MjA5NjYyNjIwOX0.HLHuP1CujyaJLCkpSiW56AHJZyCeFeJyGavQcbUeFOM");

  useEffect(() => {
    localStorage.setItem("sk_connections", JSON.stringify(connections));
  }, [connections]);

  useEffect(() => {
    if (!localStorage.getItem("sk_supabase_url")) localStorage.setItem("sk_supabase_url", "https://elmoftpybhfxqzkrhkwe.supabase.co");
    if (!localStorage.getItem("sk_supabase_key")) localStorage.setItem("sk_supabase_key", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsbW9mdHB5YmhmeHF6a3Joa3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNTAyMDksImV4cCI6MjA5NjYyNjIwOX0.HLHuP1CujyaJLCkpSiW56AHJZyCeFeJyGavQcbUeFOM");
    // One-time cleanup: strip LibraryThing placeholder descriptions already stored
    if (!localStorage.getItem("sk_lt_desc_cleaned")) {
      try {
        const all = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
        let cleaned = 0;
        const updated = all.map(b => {
          if (b.description && (b.description.includes("LibraryThing") || b.description.includes("catalogs your") || b.description.length < 30)) {
            cleaned++;
            return { ...b, description: "" };
          }
          return b;
        });
        if (cleaned > 0) {
          localStorage.setItem("sk_user_books", JSON.stringify(updated));
          console.log("Cleaned " + cleaned + " LibraryThing placeholder descriptions");
        }
        localStorage.setItem("sk_lt_desc_cleaned", "1");
      } catch(e) {}
    }
  }, []);

  const connect = (id) => setConnections((prev) => ({ ...prev, [id]: true }));
  const disconnect = (id) => {
    // Remove all books imported from this platform
    const allBooks = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
    const removed = allBooks.filter(b => b.platform === id);
    const remaining = allBooks.filter(b => b.platform !== id);
    localStorage.setItem("sk_user_books", JSON.stringify(remaining));

    // Clean up statuses, favorites, progress, dates for removed books
    if (removed.length > 0) {
      const removedIsbns = new Set(removed.map(b => b.isbn).filter(Boolean));
      ["ebooks", "audiobooks"].forEach(mt => {
        ["sk_favorites", "sk_statuses", "sk_progress", "sk_dates"].forEach(key => {
          const stored = JSON.parse(localStorage.getItem(`${key}_${mt}`) || "{}");
          removedIsbns.forEach(isbn => { delete stored[isbn]; });
          localStorage.setItem(`${key}_${mt}`, JSON.stringify(stored));
        });
      });
    }

    setConnections((prev) => { const next = { ...prev }; delete next[id]; return next; });
  };

  const sbHeaders = () => {
    const key = localStorage.getItem("sk_supabase_key") || "";
    return { "apikey": key, "Authorization": `Bearer ${key}`, "Content-Type": "application/json" };
  };
  const sbBase = () => `${localStorage.getItem("sk_supabase_url") || ""}/rest/v1/book_cache`;

  const fetchFromCache = async (isbn, title, author) => {
    const url = localStorage.getItem("sk_supabase_url") || "";
    if (!url) return null;
    try {
      let res;
      if (isbn) {
        res = await fetch(`${sbBase()}?isbn=eq.${encodeURIComponent(isbn)}&limit=1&select=*`, { headers: sbHeaders() });
      } else {
        const t = encodeURIComponent(title || "");
        const a = encodeURIComponent(author || "");
        const q = author ? `title=ilike.*${t}*&author=ilike.*${a}*` : `title=ilike.*${t}*`;
        res = await fetch(`${sbBase()}?${q}&limit=1&select=*`, { headers: sbHeaders() });
      }
      const rows = await res.json();
      return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    } catch { return null; }
  };

  const writeToCache = async (isbn, title, author, description, coverUrl, genre) => {
    const url = localStorage.getItem("sk_supabase_url") || "";
    if (!url || !description) return;
    const safeCoverUrl = isBadCover(coverUrl) ? null : (coverUrl || null);
    try {
      await fetch(sbBase(), {
        method: "POST",
        headers: { ...sbHeaders(), "Prefer": "return=minimal" },
        body: JSON.stringify({ isbn: isbn || null, title: title || null, author: author || null, description, cover_url: safeCoverUrl, genre: genre || null, source: "community" }),
      });
    } catch { /* ignore */ }
  };

  const handleFindISBNs = async () => {
    isbnStopRef.current = false;
    setIsbnFinding(true);
    setIsbnResult(null);
    setIsbnProgress(null);
    const userBooks = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
    const noIsbn = userBooks.map((b, i) => ({ b, i })).filter(({ b }) => !b.isbn);
    let found = 0;
    let quotaHit = false;
    setIsbnProgress({ done: 0, total: noIsbn.length, found: 0, current: "", quotaHit: false });
    const gKey = localStorage.getItem("sk_google_api_key") || "";
    const gKeySuffix = gKey ? `&key=${gKey}` : "";
    const isbndbApiKey = localStorage.getItem("sk_isbndb_key") || "";

    for (let j = 0; j < noIsbn.length; j++) {
      if (isbnStopRef.current) break;
      const { b, i } = noIsbn[j];
      let isbn = null;
      try {
        const cleaned = cleanTitle(b.title);
        const normAuthor = normalizeAuthor(b.author);

        // Try ISBNdb via Vercel proxy (avoids CORS)
        if (!isbn && isbndbApiKey) {
          try {
            const params = new URLSearchParams({ title: cleaned, key: isbndbApiKey });
            if (normAuthor) params.set("author", normAuthor);
            const res = await fetch(`/api/isbn-lookup?${params}`);
            const json = await res.json();
            if (json.isbn) isbn = json.isbn;
          } catch { /* ignore */ }
        }

        // Open Library fallback (no quota — Google Books quota reserved for Enrich Now)
        if (!isbn) {
          const queries = normAuthor
            ? [
                `title=${encodeURIComponent(cleaned)}&author=${encodeURIComponent(normAuthor)}`,
                `title=${encodeURIComponent(cleaned)}`,
              ]
            : [`title=${encodeURIComponent(cleaned)}`];
          for (const q of queries) {
            if (isbn) break;
            try {
              const res = await fetch(`https://openlibrary.org/search.json?${q}&limit=1&fields=isbn`);
              const data = (await res.json()).docs?.[0];
              if (data?.isbn?.length) isbn = data.isbn.find(s => s.length === 13) || data.isbn[0];
            } catch { /* ignore */ }
          }
        }

        if (isbn) { userBooks[i].isbn = isbn; found++; }
      } catch { /* ignore network errors */ }
      if (j % 50 === 49) localStorage.setItem("sk_user_books", JSON.stringify(userBooks));
      await new Promise(r => setTimeout(r, 350));
      setIsbnProgress({ done: j + 1, total: noIsbn.length, found, current: b.title, quotaHit });
    }

    localStorage.setItem("sk_user_books", JSON.stringify(userBooks));
    const stillMissing = userBooks.filter(b => !b.isbn).length;
    setIsbnFinding(false);
    setIsbnProgress(null);
    setIsbnResult({ found, stillMissing, stopped: isbnStopRef.current, quotaHit });
    refreshBookCounts();
  };

  const handleEnrich = async () => {
    enrichStopRef.current = false;
    setEnriching(true);
    setEnrichResult(null);
    setEnrichProgress(null);
    const userBooks = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
    const needsEnrich = userBooks.filter(b => needsDesc(b) || !b.author || !b.coverUrl);
    let enriched = 0;
    setEnrichProgress({ done: 0, total: needsEnrich.length, current: "", enriched: 0 });

    for (const book of needsEnrich) {
      if (enrichStopRef.current) break;
      try {
        const idx = userBooks.findIndex(b => b === book);
        const cleaned = cleanTitle(book.title);
        const normAuthor = normalizeAuthor(book.author);

        // Snapshot what's missing before we start this book
        const hadDescription = !!userBooks[idx].description;
        const hadCover = !!userBooks[idx].coverUrl;
        const hadAuthor = !!userBooks[idx].author;

        // Helper: fetch full OL work — description, covers, subjects
        const fetchOLWork = async (workKey) => {
          if (!workKey) return;
          try {
            const res = await fetch(`https://openlibrary.org${workKey}.json`);
            const work = await res.json();
            // Description
            if (!userBooks[idx].description && userBooks[idx].genre !== "Cookbooks") {
              const d = work.description?.value || work.description || work.first_sentence?.value || work.first_sentence || "";
              if (d && typeof d === "string" && d.length > 20) userBooks[idx].description = d;
            }
            // Cover from work covers array
            if (!userBooks[idx].coverUrl && work.covers?.length) {
              const coverId = work.covers.find(c => c > 0);
              const url = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
              if (url && !isBadCover(url)) userBooks[idx].coverUrl = url;
            }
            // Subjects for genre detection
            if (!userBooks[idx].genre && work.subjects?.length) {
              userBooks[idx].genre = detectGenre(work.subjects, userBooks[idx].title);
            }
            // If still missing cover, try editions
            if (!userBooks[idx].coverUrl) {
              try {
                const edRes = await fetch(`https://openlibrary.org${workKey}/editions.json?limit=10`);
                const edData = await edRes.json();
                for (const ed of (edData.entries || [])) {
                  if (ed.covers?.length && ed.covers[0] > 0) {
                    const url = `https://covers.openlibrary.org/b/id/${ed.covers[0]}-M.jpg`;
                    if (!isBadCover(url)) { userBooks[idx].coverUrl = url; break; }
                  }
                }
              } catch { /* ignore */ }
            }
          } catch { /* ignore */ }
        };

        // Helper: fetch OL edition by ISBN directly
        const fetchOLByIsbn = async (isbn) => {
          if (!isbn) return;
          try {
            const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
            if (!res.ok) return;
            const ed = await res.json();
            if (!userBooks[idx].coverUrl && ed.covers?.length && ed.covers[0] > 0) {
              const url = `https://covers.openlibrary.org/b/id/${ed.covers[0]}-M.jpg`;
              if (!isBadCover(url)) userBooks[idx].coverUrl = url;
            }
            if (!userBooks[idx].description && userBooks[idx].genre !== "Cookbooks") {
              const d = ed.description?.value || ed.description || "";
              if (d && typeof d === "string" && d.length > 20) userBooks[idx].description = d;
            }
            if (!userBooks[idx]._totalPages && ed.number_of_pages > 0) userBooks[idx]._totalPages = ed.number_of_pages;
            // Follow work key for richer data
            const workKey = ed.works?.[0]?.key;
            if (workKey && (!userBooks[idx].description || !userBooks[idx].coverUrl))
              await fetchOLWork(workKey);
          } catch { /* ignore */ }
        };

        // Helper: apply Open Library search doc
        const applyOLDoc = async (data) => {
          if (!userBooks[idx].author && data.author_name?.length) userBooks[idx].author = data.author_name.join(", ");
          if (!userBooks[idx].coverUrl && data.cover_i) {
            const url = `https://covers.openlibrary.org/b/id/${data.cover_i}-M.jpg`;
            if (!isBadCover(url)) userBooks[idx].coverUrl = url;
          }
          if (!userBooks[idx].isbn && data.isbn?.length) userBooks[idx].isbn = data.isbn[0];
          if (!userBooks[idx].genre && data.subject?.length) userBooks[idx].genre = detectGenre(data.subject, userBooks[idx].title);
          // Fetch full work for description, better covers, editions
          if (data.key && (!userBooks[idx].description || !userBooks[idx].coverUrl))
            await fetchOLWork(data.key);
        };

        // Helper: apply Google Books volume
        const applyGoogleVol = (vol) => {
          if (!userBooks[idx].author && vol.authors?.length) userBooks[idx].author = vol.authors.join(", ");
          if (!userBooks[idx].coverUrl && vol.imageLinks?.thumbnail) {
            const url = vol.imageLinks.thumbnail.replace("http://", "https://").replace("&zoom=1", "&zoom=2");
            if (!isBadCover(url)) userBooks[idx].coverUrl = url;
          }
          if (!userBooks[idx].description && vol.description && userBooks[idx].genre !== "Cookbooks") userBooks[idx].description = vol.description;
          if (!userBooks[idx].isbn && vol.industryIdentifiers?.length) {
            const id13 = vol.industryIdentifiers.find(i => i.type === "ISBN_13");
            const id10 = vol.industryIdentifiers.find(i => i.type === "ISBN_10");
            userBooks[idx].isbn = (id13 || id10)?.identifier || "";
          }
          if (!userBooks[idx].genre && vol.categories?.length) userBooks[idx].genre = detectGenre(vol.categories, userBooks[idx].title);
          if (!userBooks[idx]._totalPages && vol.pageCount > 0) userBooks[idx]._totalPages = vol.pageCount;
        };

        // --- Step 0: Community cache (Supabase) ---
        if (!userBooks[idx].description || !userBooks[idx].coverUrl) {
          const cached = await fetchFromCache(book.isbn, userBooks[idx].title, userBooks[idx].author);
          if (cached) {
            if (!userBooks[idx].description && cached.description && userBooks[idx].genre !== "Cookbooks") userBooks[idx].description = cached.description;
            const cachedCoverOk = cached.cover_url &&
              !isBadCover(cached.cover_url) &&
              !cached.cover_url.includes("covers.openlibrary.org/b/isbn/");
            if (!userBooks[idx].coverUrl && cachedCoverOk) userBooks[idx].coverUrl = cached.cover_url;
            if (!userBooks[idx].author && cached.author) userBooks[idx].author = cached.author;
            if (!userBooks[idx].genre && cached.genre) userBooks[idx].genre = cached.genre;
          }
        }

        // --- Step 1: Google Books by ISBN (best descriptions, most precise match) ---
        const gKey = localStorage.getItem("sk_google_api_key") || "";
        const gKeySuffix = gKey ? `&key=${gKey}` : "";
        let googleQuotaHit = false;
        if (book.isbn && !userBooks[idx].description) {
          try {
            const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(book.isbn)}&maxResults=1&langRestrict=en${gKeySuffix}`);
            const json = await res.json();
            if (json.error?.code === 429) {
              googleQuotaHit = true;
            } else {
              const vol = json.items?.[0]?.volumeInfo;
              if (vol) applyGoogleVol(vol);
            }
          } catch { /* ignore */ }
        }

        // --- Step 2: Open Library edition by ISBN (direct, richest data) ---
        if (book.isbn && (!userBooks[idx].description || !userBooks[idx].coverUrl)) {
          await fetchOLByIsbn(book.isbn);
        }

        // --- Step 3: Open Library search by ISBN (fallback for work key + subjects) ---
        if (book.isbn && (!userBooks[idx].description || !userBooks[idx].coverUrl)) {
          try {
            const res = await fetch(`https://openlibrary.org/search.json?isbn=${encodeURIComponent(book.isbn)}&limit=1&fields=key,title,author_name,isbn,subject,cover_i`);
            const data = (await res.json()).docs?.[0];
            if (data) await applyOLDoc(data);
          } catch { /* ignore */ }
        }

        // --- Step 4: Open Library by title + author ---
        if (!userBooks[idx].coverUrl || !userBooks[idx].description) {
          try {
            const q = normAuthor
              ? `title=${encodeURIComponent(cleaned)}&author=${encodeURIComponent(normAuthor)}`
              : `title=${encodeURIComponent(cleaned)}`;
            const res = await fetch(`https://openlibrary.org/search.json?${q}&limit=1&fields=key,title,author_name,isbn,subject,cover_i`);
            const data = (await res.json()).docs?.[0];
            if (data) await applyOLDoc(data);
          } catch { /* ignore */ }
        }

        // --- Step 5: Google Books by title+author — only if still missing description and no quota ---
        if (!userBooks[idx].description && !googleQuotaHit) {
          try {
            const gq = normAuthor
              ? `intitle:${encodeURIComponent(cleaned)}+inauthor:${encodeURIComponent(normAuthor)}`
              : `intitle:${encodeURIComponent(cleaned)}`;
            const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${gq}&maxResults=1&langRestrict=en${gKeySuffix}`);
            const json = await res.json();
            if (json.error?.code === 429) {
              googleQuotaHit = true;
            } else {
              const vol = json.items?.[0]?.volumeInfo;
              if (vol) applyGoogleVol(vol);
            }
          } catch { /* ignore */ }
        }

        // Only count as enriched if at least one missing field was actually filled in
        const nowHasDescription = !!userBooks[idx].description;
        const nowHasCover = !!userBooks[idx].coverUrl;
        const nowHasAuthor = !!userBooks[idx].author;
        if (
          (!hadDescription && nowHasDescription) ||
          (!hadCover && nowHasCover) ||
          (!hadAuthor && nowHasAuthor)
        ) enriched++;
        // Write back to community cache if we gained a description from an external source
        if (!hadDescription && nowHasDescription) {
          writeToCache(userBooks[idx].isbn, userBooks[idx].title, userBooks[idx].author, userBooks[idx].description, userBooks[idx].coverUrl, userBooks[idx].genre);
        }
        // Save after every book that gained a description (most important field)
        if (!hadDescription && nowHasDescription) localStorage.setItem("sk_user_books", JSON.stringify(userBooks));
        else if (enriched % 25 === 0 && enriched > 0) localStorage.setItem("sk_user_books", JSON.stringify(userBooks));
      } catch { /* skip on network error */ }
      await new Promise(r => setTimeout(r, 400));
      const doneCount = needsEnrich.indexOf(book) + 1;
      setEnrichProgress({ done: doneCount, total: needsEnrich.length, current: book.title, enriched });
      skDispatch('sk-bg-progress', { task: 'enrich', done: doneCount, total: needsEnrich.length, current: book.title, enriched });
    }

    localStorage.setItem("sk_user_books", JSON.stringify(userBooks));
    const stillNoDesc = userBooks.filter(b => !b.description).length;
    const stillNoCover = userBooks.filter(b => !b.coverUrl).length;
    const stillNoAuthor = userBooks.filter(b => !b.author).length;
    const stillMissing = stillNoDesc + stillNoCover + stillNoAuthor;
    const wasStopped = enrichStopRef.current;
    setEnriching(false);
    setEnrichProgress(null);
    setEnrichResult({ enriched, skipped: needsEnrich.length - enriched, stillMissing, stillNoDesc, stillNoCover, stillNoAuthor, stopped: wasStopped });
    refreshBookCounts();
    skDispatch('sk-bg-complete', { task: 'enrich', enriched, stopped: wasStopped, stillNoDesc, stillNoCover, stillNoAuthor });
  };

  const handleRedetectGenres = async (filterMediaType = null) => {
    redetectStopRef.current = false;
    setRedetecting(true);
    setRedetectResult(null);
    setRedetectProgress({ done: 0, total: 0, changed: 0, current: "" });
    const allUserBooks = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
    // Only process books matching the filter (or all if no filter)
    const targetIndices = allUserBooks
      .map((b, i) => ({ b, i }))
      .filter(({ b }) => !filterMediaType || (b.mediaType || "ebook") === filterMediaType)
      .map(({ i }) => i);
    const userBooks = targetIndices.map(i => allUserBooks[i]);
    let changed = 0;
    setRedetectProgress({ done: 0, total: userBooks.length, changed: 0, current: "" });

    for (let i = 0; i < userBooks.length; i++) {
      if (redetectStopRef.current) break;
      const book = userBooks[i];
      try {
        const cleaned = cleanTitle(book.title);
        const normAuthor = normalizeAuthor(book.author);

        // Try OL by ISBN first, then by title+author
        let subjects = [];
        const queries = book.isbn
          ? [`https://openlibrary.org/search.json?isbn=${encodeURIComponent(book.isbn)}&limit=1&fields=key,subject,cover_i`]
          : [];
        const q = normAuthor
          ? `title=${encodeURIComponent(cleaned)}&author=${encodeURIComponent(normAuthor)}`
          : `title=${encodeURIComponent(cleaned)}`;
        queries.push(`https://openlibrary.org/search.json?${q}&limit=1&fields=key,subject,cover_i`);

        for (const url of queries) {
          if (subjects.length) break;
          try {
            const res = await fetch(url);
            const doc = (await res.json()).docs?.[0];
            if (doc?.subject?.length) subjects = doc.subject;
          } catch { /* ignore */ }
        }

        if (subjects.length) {
          const genre = detectGenre(subjects, userBooks[i].title);
          if (genre && genre !== userBooks[i].genre) {
            userBooks[i].genre = genre;
            changed++;
          }
        }

        // If still Fiction/Fantasy (or no subjects found), try Google Books categories
        if (!subjects.length || userBooks[i].genre === "Fiction" || userBooks[i].genre === "Fantasy") {
          try {
            const gKey = localStorage.getItem("sk_google_api_key") || "";
            const gKeySuffix = gKey ? `&key=${gKey}` : "";
            const gq = normAuthor
              ? `intitle:${encodeURIComponent(cleaned)}+inauthor:${encodeURIComponent(normAuthor)}`
              : `intitle:${encodeURIComponent(cleaned)}`;
            const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${gq}&maxResults=1&langRestrict=en${gKeySuffix}`);
            const json = await res.json();
            if (!json.error) {
              const vol = json.items?.[0]?.volumeInfo;
              if (vol?.categories?.length) {
                const genre = detectGenre(vol.categories, userBooks[i].title);
                if (genre && genre !== "Fiction" && genre !== userBooks[i].genre) {
                  userBooks[i].genre = genre;
                  changed++;
                }
              }
            }
          } catch { /* Google unavailable */ }
        }

        // Final fallback: always check title keywords — catches books APIs couldn't identify
        const titleGenre = detectGenreFromTitle(userBooks[i].title);
        if (titleGenre && titleGenre !== userBooks[i].genre) {
          userBooks[i].genre = titleGenre;
          changed++;
        }
      } catch { /* skip */ }

      // Small delay to avoid hammering APIs
      await new Promise(r => setTimeout(r, 200));
      setRedetectProgress({ done: i + 1, total: userBooks.length, changed, current: book.title });
      skDispatch('sk-bg-progress', { task: 'redetect', done: i + 1, total: userBooks.length, changed, current: book.title });
    }

    // Write updated books back — only touching the filtered indices
    const finalBooks = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
    targetIndices.forEach((origIdx, i) => { finalBooks[origIdx] = userBooks[i]; });
    localStorage.setItem("sk_user_books", JSON.stringify(finalBooks));
    setRedetecting(false);
    setRedetectProgress(null);
    setRedetectResult({ changed, total: userBooks.length, stopped: redetectStopRef.current, filterMediaType });
    skDispatch('sk-bg-complete', { task: 'redetect', changed, total: userBooks.length, stopped: redetectStopRef.current });
  };

  const sectionTitle = (text) => (
    <h2 style={{
      fontFamily: '"Palatino Linotype", Palatino, serif',
      fontSize: 22,
      color: th.text,
      marginBottom: 16,
      marginTop: 0,
    }}>{text}</h2>
  );

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 550,
      backgroundColor: th.bgDeep,
      backgroundImage: (themeKey === "firelight" || themeKey === "midnight" || themeKey === "forest") ? 'url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg")' : "none",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundBlendMode: "multiply",
      overflowY: "auto",
      padding: "30px 40px",
    }}
    ref={scrollRef}
    onScroll={(e) => setAtTop(e.currentTarget.scrollTop < 40)}
    >
      {/* Back button — hidden when scrolled down */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 56,
          left: 20,
          padding: "8px 18px",
          borderRadius: "50px",
          border: `1px solid ${th.accent}`,
          cursor: "pointer",
          background: th.bgMuted,
          color: th.text,
          fontFamily: '"Baskerville", "Book Antiqua", "Goudy Old Style", Georgia, serif',
          fontWeight: 700,
          fontStyle: "italic",
          fontSize: 15,
          letterSpacing: "0.5px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
          zIndex: 201,
          opacity: atTop ? 1 : 0,
          pointerEvents: atTop ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      >
        ← Back
      </button>

      <div style={{ maxWidth: 900, margin: "0 auto", paddingTop: 10 }}>
        <h1 style={{
          fontFamily: '"Palatino Linotype", Palatino, serif',
          fontSize: 32,
          color: th.text,
          textAlign: "center",
          marginBottom: 6,
        }}>🔗 My Platforms</h1>
        <p style={{
          textAlign: "center",
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          fontSize: 14,
          color: th.textSoft,
          marginBottom: 24,
        }}>Connect your reading platforms to import your library</p>

        {/* Enrich Library */}
        <div style={{
          background: th.bgMuted,
          border: `1px solid ${th.border}`,
          borderRadius: 10,
          padding: "18px 24px",
          marginBottom: 36,
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 16, fontWeight: 700, color: th.text, marginBottom: 4 }}>
              ✨ Enrich My Imported Books
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: th.textSoft, marginBottom: 8 }}>
              Fill in missing covers, authors, descriptions, and genres for books imported via CSV.
            </div>

            {/* Google API Key */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 12, fontWeight: 700, color: th.text, marginBottom: 3 }}>
                📚 Google Books API Key
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: th.textSoft, marginBottom: 6 }}>
                Used for covers, descriptions, page counts, and genres during Enrich Now. Without a key: ~100 requests/day. With a key: 1,000+/day. Request a higher quota at console.cloud.google.com → Books API → Quotas.
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <input
                  type="password"
                  placeholder="Paste Google Books API key…"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  style={{ flex: 1, minWidth: 200, padding: "5px 10px", fontFamily: "Georgia, serif", fontSize: 12, border: `1px solid ${th.border}`, borderRadius: 5, background: th.bgDeep, color: th.text }}
                />
                <button
                  onClick={() => { localStorage.setItem("sk_google_api_key", apiKeyInput); setGoogleApiKey(apiKeyInput); }}
                  style={{ padding: "5px 14px", background: th.accent, color: th.bg, border: "none", borderRadius: 5, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}
                >
                  Save Key
                </button>
                {googleApiKey && <span style={{ fontSize: 11, color: "#2d6a2d", fontFamily: "Georgia, serif" }}>✓ Key saved</span>}
              </div>
            </div>

            {/* ISBNdb API Key */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 12, fontWeight: 700, color: th.text, marginBottom: 3 }}>
                🔢 ISBNdb API Key
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: th.textSoft, marginBottom: 6 }}>
                Used by Find ISBNs (first priority). Finds ISBNs by title + author, especially for audiobooks and titles Google Books misses. Get a key at isbndb.com.
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <input
                  type="password"
                  placeholder="Paste ISBNdb API key…"
                  value={isbndbKeyInput}
                  onChange={e => setIsbndbKeyInput(e.target.value)}
                  style={{ flex: 1, minWidth: 200, padding: "5px 10px", fontFamily: "Georgia, serif", fontSize: 12, border: `1px solid ${th.border}`, borderRadius: 5, background: th.bgDeep, color: th.text }}
                />
                <button
                  onClick={() => { localStorage.setItem("sk_isbndb_key", isbndbKeyInput); setIsbndbKey(isbndbKeyInput); }}
                  style={{ padding: "5px 14px", background: th.accent, color: th.bg, border: "none", borderRadius: 5, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}
                >
                  Save Key
                </button>
                {isbndbKey && <span style={{ fontSize: 11, color: "#2d6a2d", fontFamily: "Georgia, serif" }}>✓ Key saved</span>}
              </div>
            </div>

            {/* Community Cache (Supabase) */}
            <div style={{ background: th.bgDeep, border: `1px solid ${th.border}`, borderRadius: 6, padding: "8px 10px", marginBottom: 10 }}>
              <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 12, fontWeight: 700, color: th.text, marginBottom: 6 }}>
                🌐 Community Book Cache
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: th.textSoft, marginBottom: 8 }}>
                Shared database — enriched books are contributed back so all users benefit.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <input
                  type="text"
                  placeholder="Supabase Project URL"
                  value={supabaseUrlInput}
                  onChange={e => setSupabaseUrlInput(e.target.value)}
                  style={{ padding: "4px 8px", fontFamily: "Georgia, serif", fontSize: 11, border: `1px solid ${th.border}`, borderRadius: 4, background: th.bgMuted, color: th.text }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="password"
                    placeholder="Supabase anon key"
                    value={supabaseKeyInput}
                    onChange={e => setSupabaseKeyInput(e.target.value)}
                    style={{ flex: 1, padding: "4px 8px", fontFamily: "Georgia, serif", fontSize: 11, border: `1px solid ${th.border}`, borderRadius: 4, background: th.bgMuted, color: th.text }}
                  />
                  <button
                    onClick={() => {
                      localStorage.setItem("sk_supabase_url", supabaseUrlInput);
                      localStorage.setItem("sk_supabase_key", supabaseKeyInput);
                      setSupabaseUrl(supabaseUrlInput);
                      setSupabaseKey(supabaseKeyInput);
                    }}
                    style={{ padding: "4px 12px", background: th.accent, color: th.bg, border: "none", borderRadius: 4, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}
                  >
                    Save
                  </button>
                </div>
                {supabaseUrl && supabaseKey && (
                  <span style={{ fontSize: 11, color: "#2d6a2d", fontFamily: "Georgia, serif" }}>✓ Community cache connected</span>
                )}
              </div>
            </div>

            {/* Baseline count — how many still need enriching */}
            {!enriching && bookCounts.total > 0 && (() => {
              const { total, noDesc, noCover, noAuthor } = bookCounts;
              const allComplete = noDesc === 0 && noCover === 0 && noAuthor === 0;
              return (
                <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: allComplete ? "#2d6a2d" : th.textSoft, marginBottom: 6 }}>
                  {allComplete
                    ? `✅ All ${total} imported books are complete`
                    : <>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span>📚 {total} imported books:</span>
                          <button onClick={refreshBookCounts} style={{ fontSize: 10, padding: "1px 6px", background: "none", border: `1px solid ${th.border}`, borderRadius: 3, cursor: "pointer", color: th.textSoft }}>↻ Refresh</button>
                        </div>
                        {noDesc > 0 && <div style={{ marginLeft: 8 }}>• {noDesc} missing description</div>}
                        {noCover > 0 && <div style={{ marginLeft: 8 }}>• {noCover} missing cover</div>}
                        {noAuthor > 0 && <div style={{ marginLeft: 8 }}>• {noAuthor} missing author</div>}
                      </>
                  }
                </div>
              );
            })()}

            {/* Live progress bar while enriching */}
            {enriching && enrichProgress && (
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: th.textSoft, marginBottom: 4 }}>
                  🔍 Enriching {enrichProgress.done} / {enrichProgress.total} — <strong>{enrichProgress.enriched} updated</strong> so far
                </div>
                <div style={{ background: th.bgDeep, borderRadius: 4, height: 8, overflow: "hidden", marginBottom: 4 }}>
                  <div style={{ background: th.accent, height: "100%", width: `${(enrichProgress.done / enrichProgress.total) * 100}%`, transition: "width 0.3s" }} />
                </div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: th.textSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 340 }}>
                  {enrichProgress.current}
                </div>
              </div>
            )}

            {/* Result summary after enriching */}
            {enrichResult && !enriching && (
              <div style={{ fontFamily: "Georgia, serif", fontSize: 12, marginTop: 4 }}>
                <div style={{ color: enrichResult.enriched > 0 ? "#2d6a2d" : th.textSoft }}>
                  {enrichResult.stopped ? `⏹ Stopped — ` : ""}
                  {enrichResult.enriched > 0
                    ? `✅ ${enrichResult.enriched} book${enrichResult.enriched !== 1 ? "s" : ""} successfully enriched`
                    : "No new books were enriched."}
                </div>
                {enrichResult.skipped > 0 && (
                  <div style={{ color: th.textSoft, marginTop: 2 }}>
                    ⚠️ {enrichResult.skipped} book{enrichResult.skipped !== 1 ? "s" : ""} could not be found online
                  </div>
                )}
                {(enrichResult.stillNoDesc > 0 || enrichResult.stillNoCover > 0 || enrichResult.stillNoAuthor > 0) && (
                  <div style={{ color: th.textSoft, marginTop: 2 }}>
                    <div>Still missing after enrichment:</div>
                    {enrichResult.stillNoDesc > 0 && <div style={{ marginLeft: 8 }}>• {enrichResult.stillNoDesc} missing description</div>}
                    {enrichResult.stillNoCover > 0 && <div style={{ marginLeft: 8 }}>• {enrichResult.stillNoCover} missing cover</div>}
                    {enrichResult.stillNoAuthor > 0 && <div style={{ marginLeft: 8 }}>• {enrichResult.stillNoAuthor} missing author</div>}
                    <div style={{ fontStyle: "italic", marginTop: 2 }}>Try enriching again — APIs may have more data on a second pass.</div>
                  </div>
                )}
                {enrichResult.stillMissing === 0 && enrichResult.enriched > 0 && (
                  <div style={{ color: "#2d6a2d", marginTop: 2 }}>🎉 Library is fully enriched!</div>
                )}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignSelf: "flex-start" }}>
            <button
              onClick={handleEnrich}
              disabled={enriching}
              style={{
                padding: "10px 22px",
                background: enriching ? th.bgDeep : th.accent,
                color: enriching ? th.textSoft : th.bg,
                border: "none",
                borderRadius: 8,
                cursor: enriching ? "default" : "pointer",
                fontFamily: '"Palatino Linotype", Palatino, serif',
                fontSize: 14,
                fontWeight: 700,
                whiteSpace: "nowrap",
                transition: "background 0.15s",
              }}
            >
              {enriching ? "Enriching…" : "✨ Enrich Now"}
            </button>
            {enriching && (
              <button
                onClick={() => { enrichStopRef.current = true; }}
                style={{
                  padding: "8px 22px",
                  background: "#7A2A2A",
                  color: "#F8F1E4",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: '"Palatino Linotype", Palatino, serif',
                  fontSize: 13,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                ⏹ Stop
              </button>
            )}
          </div>
        </div>

        {/* Find Missing ISBNs */}
        {(() => {
          const allBooks = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
          const missingIsbn = allBooks.filter(b => !b.isbn).length;
          return missingIsbn > 0 ? (
            <div style={{
              background: th.bgMuted,
              border: `1px solid ${th.border}`,
              borderRadius: 10,
              padding: "18px 24px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 15, fontWeight: 700, color: th.text, marginBottom: 4 }}>
                  🔢 Find Missing ISBNs
                </div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: th.textSoft, marginBottom: 6 }}>
                  {missingIsbn} books are missing ISBNs — likely imported from Amazon or Kindle. ISBNs improve cover and description matching.
                </div>
                {isbnProgress && (
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: th.textMid }}>
                    [{isbnProgress.done}/{isbnProgress.total}] Found {isbnProgress.found} ISBNs so far…{isbnProgress.quotaHit ? " (using Open Library fallback)" : ""} {isbnProgress.current}
                  </div>
                )}
                {isbnResult && !isbnFinding && (
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 13, color: th.textMid, marginTop: 4 }}>
                    {isbnResult.quotaHit
                      ? <span style={{ color: "#b85c00" }}>⚠️ Google Books quota hit — switched to Open Library. </span>
                      : <>{isbnResult.stopped ? "⏹ Stopped early. " : ""}</>
                    }
                    Found {isbnResult.found} ISBNs. {isbnResult.stillMissing} books still missing ISBNs.
                    {isbnResult.found > 0 && <div style={{ fontStyle: "italic", marginTop: 2 }}>Run Enrich Now to use the new ISBNs for descriptions and covers.</div>}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignSelf: "flex-start" }}>
                <button
                  onClick={handleFindISBNs}
                  disabled={isbnFinding}
                  style={{
                    padding: "10px 22px",
                    background: isbnFinding ? th.bgDeep : th.accent,
                    color: isbnFinding ? th.textSoft : th.bg,
                    border: "none",
                    borderRadius: 8,
                    cursor: isbnFinding ? "default" : "pointer",
                    fontFamily: '"Palatino Linotype", Palatino, serif',
                    fontSize: 14,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {isbnFinding ? "Searching…" : "🔢 Find ISBNs"}
                </button>
                {isbnFinding && (
                  <button
                    onClick={() => { isbnStopRef.current = true; }}
                    style={{
                      padding: "8px 22px",
                      background: "#7A2A2A",
                      color: "#F8F1E4",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontFamily: '"Palatino Linotype", Palatino, serif',
                      fontSize: 13,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    ⏹ Stop
                  </button>
                )}
              </div>
            </div>
          ) : null;
        })()}

        {/* Re-detect Genres */}
        <div style={{
          background: th.bgMuted,
          border: `1px solid ${th.border}`,
          borderRadius: 10,
          padding: "18px 24px",
          marginBottom: 36,
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 16, fontWeight: 700, color: th.text, marginBottom: 4 }}>
              🏷️ Re-detect Genres
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: th.textSoft, marginBottom: 8 }}>
              Fix incorrect genre assignments — run on eBooks only, Audiobooks only, or your entire library.
            </div>
            {redetectResult && !redetecting && (
              <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: redetectResult.changed > 0 ? "#2d6a2d" : th.textSoft }}>
                {redetectResult.stopped ? "⏹ Stopped — " : ""}
                {redetectResult.changed > 0
                  ? `✅ ${redetectResult.changed} of ${redetectResult.total} ${redetectResult.filterMediaType === "audiobook" ? "audiobooks" : redetectResult.filterMediaType === "ebook" ? "eBooks" : "books"} re-categorized`
                  : `✅ All ${redetectResult.total} ${redetectResult.filterMediaType === "audiobook" ? "audiobooks" : redetectResult.filterMediaType === "ebook" ? "eBooks" : "books"} already have correct genres`}
              </div>
            )}
            {redetecting && redetectProgress && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: th.textSoft, marginBottom: 4 }}>
                  🏷️ {redetectProgress.done} / {redetectProgress.total} scanned — <strong>{redetectProgress.changed} re-categorized</strong>
                </div>
                <div style={{ background: th.bgDeep, borderRadius: 4, height: 8, overflow: "hidden", marginBottom: 4 }}>
                  <div style={{ background: th.accent, height: "100%", width: `${redetectProgress.total ? (redetectProgress.done / redetectProgress.total) * 100 : 0}%`, transition: "width 0.3s" }} />
                </div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: th.textSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 340 }}>
                  {redetectProgress.current}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignSelf: "flex-start" }}>
            {[
              { label: "📖 eBooks", filter: "ebook" },
              { label: "🎧 Audiobooks", filter: "audiobook" },
              { label: "📚 All Books", filter: null },
            ].map(({ label, filter }) => (
              <button
                key={label}
                onClick={() => handleRedetectGenres(filter)}
                disabled={redetecting || enriching}
                style={{
                  padding: "8px 16px",
                  background: redetecting ? th.bgDeep : th.accent,
                  color: redetecting ? th.textSoft : th.bg,
                  border: "none",
                  borderRadius: 8,
                  cursor: redetecting ? "default" : "pointer",
                  fontFamily: '"Palatino Linotype", Palatino, serif',
                  fontSize: 13,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {redetecting ? "Re-detecting…" : label}
              </button>
            ))}
            {redetecting && (
              <button
                onClick={() => { redetectStopRef.current = true; }}
                style={{
                  padding: "8px 22px",
                  background: "#7A2A2A",
                  color: "#F8F1E4",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: '"Palatino Linotype", Palatino, serif',
                  fontSize: 13,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                ⏹ Stop
              </button>
            )}
          </div>
        </div>

        {/* Kindle Documents Importer */}
        {(() => {
          const handleUploadKindleDocs = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
              try {
                const docs = JSON.parse(ev.target.result);
                const existing = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
                const existingByTitle = new Map(existing.map((b, i) => [(b.title || "").toLowerCase().trim(), i]));
                let added = 0, patched = 0, statusSet = 0;
                const newBooks = [];
                const statusUpdates = {};

                const kindleStatusMap = { READ: "finished", READING: "reading" };

                for (const doc of docs) {
                  if (!doc.title) continue;
                  const key = doc.title.toLowerCase().trim();
                  const skStatus = kindleStatusMap[doc.readStatus] || null;

                  if (existingByTitle.has(key)) {
                    const idx = existingByTitle.get(key);
                    if (doc.asin && !existing[idx].asin) { existing[idx].asin = doc.asin; patched++; }
                    // Apply read status to existing book using its isbn or title as key
                    if (skStatus) {
                      const statusKey = existing[idx].isbn || existing[idx].title;
                      if (statusKey) { statusUpdates[statusKey] = skStatus; statusSet++; }
                    }
                    continue;
                  }
                  existingByTitle.set(key, existing.length + newBooks.length);
                  newBooks.push({
                    title: doc.title,
                    author: doc.author || "",
                    isbn: "",
                    genre: "",
                    description: "",
                    coverUrl: doc.cover || "",
                    asin: doc.asin || "",
                    mediaType: "ebook",
                    platform: "kindle",
                    source: "kindle-docs",
                    dateAdded: new Date().toISOString(),
                  });
                  added++;
                  if (skStatus) {
                    const statusKey = doc.asin || doc.title;
                    if (statusKey) { statusUpdates[statusKey] = skStatus; statusSet++; }
                  }
                }

                const merged = [...existing, ...newBooks];
                localStorage.setItem("sk_user_books", JSON.stringify(merged));

                // Save status updates
                if (Object.keys(statusUpdates).length > 0) {
                  const statusKey = "sk_statuses_ebooks";
                  const statuses = JSON.parse(localStorage.getItem(statusKey) || "{}");
                  Object.assign(statuses, statusUpdates);
                  localStorage.setItem(statusKey, JSON.stringify(statuses));
                }

                alert(`✅ Imported ${added} new books and linked ${patched} existing books to Kindle.${statusSet > 0 ? `\n📊 ${statusSet} books marked as finished/reading from your Kindle read status.` : ""}\nRun Enrich Now to fetch covers and descriptions.`);
                e.target.value = "";
                refreshBookCounts();
              } catch {
                alert("❌ Could not read the file. Make sure it's the sk_kindle_docs.json from the Kindle scraper.");
              }
            };
            reader.readAsText(file);
          };

          const kindleDocsScript = `(async function() {
  const books = [];
  console.log('StoryKeeper Kindle Scraper starting...');
  const csrfToken = window.csrfToken || '';
  async function fetchBatch(startIndex, totalCount) {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/hz/mycd/digital-console/ajax', true);
      xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.setRequestHeader('anti-csrftoken-a2z', csrfToken);
      xhr.onload = function() { try { resolve(JSON.parse(this.responseText)); } catch(e) { resolve({}); } };
      xhr.onerror = () => resolve({});
      const activityInput = JSON.stringify({
        contentType: 'KindlePDoc',
        contentCategoryReference: 'pdocs',
        itemStatusList: ['Active'],
        isExtendedMYK: false,
        fetchCriteria: {
          sortOrder: 'DESCENDING', sortIndex: 'DATE',
          startIndex, batchSize: 25, totalContentCount: totalCount || 1200,
        }
      });
      xhr.send('activity=GetContentOwnershipData&activityInput=' + encodeURIComponent(activityInput) + '&csrfToken=' + encodeURIComponent(csrfToken));
    });
  }
  console.log('Fetching KindlePDoc...');
  let startIndex = 0, total = null;
  do {
    const json = await fetchBatch(startIndex, total);
    const data = json.GetContentOwnershipData;
    if (!data || !data.items) { console.warn('No data returned'); break; }
    if (total === null) total = data.numberOfItems || 0;
    const items = data.items || [];
    for (const item of items) {
      const title = item.title || '';
      const author = item.author || (item.sortableAuthors || '').split(',').map(s => s.trim()).reverse().join(' ');
      const asin = item.asin || '';
      const readStatus = item.readStatus || '';
      if (title) books.push({ title, author, asin, readStatus });
    }
    console.log('[' + startIndex + '-' + (startIndex+items.length) + '/' + total + '] collected: ' + books.length);
    startIndex += items.length;
    if (!items.length || items.length < 25) break;
    await new Promise(r => setTimeout(r, 300));
  } while (startIndex < (total || 0));
  const seen = new Set();
  const unique = books.filter(b => { const k = b.title.toLowerCase().trim(); if (seen.has(k)) return false; seen.add(k); return true; });
  console.log('Done! Found ' + unique.length + ' unique books.');
  const blob = new Blob([JSON.stringify(unique, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sk_kindle_docs.json';
  document.body.appendChild(a); a.click(); a.remove();
  console.log('Upload sk_kindle_docs.json back in StoryKeeper.');
})();`;

          return (
            <div style={{ background: th.bgMuted, border: `1px solid ${th.border}`, borderRadius: 10, padding: "18px 24px", marginBottom: 20 }}>
              <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 16, fontWeight: 700, color: th.text, marginBottom: 4 }}>
                📱 Kindle Documents Importer
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: th.textSoft, marginBottom: 12 }}>
                Import sideloaded books from your Kindle Documents library. Run this script on <strong>amazon.com/hz/mycd/digital-console/contentlist/pdocs/dateDsc/</strong> while logged in.
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => navigator.clipboard.writeText(kindleDocsScript).then(() => alert("Script copied!\n\n1. Go to amazon.com/hz/mycd/digital-console/contentlist/pdocs/dateDsc/\n2. Open console (F12)\n3. Paste and press Enter"))}
                  style={{ padding: "8px 16px", background: th.accent, color: th.bg, border: "none", borderRadius: 7, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 700 }}
                >
                  📋 Step 1 — Copy Script
                </button>
                <label style={{ padding: "8px 16px", background: th.accentLight || th.accent, color: th.bg, border: "none", borderRadius: 7, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 700 }}>
                  📥 Step 2 — Upload sk_kindle_docs.json
                  <input type="file" accept=".json" onChange={handleUploadKindleDocs} style={{ display: "none" }} />
                </label>
              </div>
            </div>
          );
        })()}

                {/* LibraryThing Description Scraper */}
        {(() => {
          const allBooks = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
          const eligible = allBooks
            .map((b, i) => ({ isbn: b.isbn, title: b.title, author: b.author, _idx: i }))
            .filter(b => !allBooks[b._idx].description && (b.isbn || b.title));
          const total = eligible.length;

          const buildLTScript = () => {
            const embedded = JSON.stringify(eligible.map(b => ({ isbn: b.isbn, title: b.title, author: b.author, _idx: b._idx })));
            return `// StoryKeeper — LibraryThing Description Scraper
// Paste this in your browser console while on librarything.com
// It will download a sk_descriptions.json file when done — upload that back in StoryKeeper.

(async function() {
  const BOOKS = ${embedded};
  const results = {};
  let found = 0, failed = 0;

  function extractDesc(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // LibraryThing description selectors
    const selectors = [
      '#book_description',
      '.book-description',
      '[itemprop="description"]',
      '#summaryBook',
      '.summary',
    ];
    for (const sel of selectors) {
      const el = doc.querySelector(sel);
      if (el) {
        const txt = (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim();
        if (txt.length > 30) return txt;
      }
    }

    // og:description only — meta[name=description] returns LibraryThing site tagline, not book description
    const meta = doc.querySelector('meta[property="og:description"]');
    if (meta) {
      const txt = (meta.getAttribute('content') || '').replace(/\\s+/g, ' ').trim();
      const isPlaceholder = txt.includes('LibraryThing') || txt.includes('catalogs') || txt.length < 60;
      if (!isPlaceholder) return txt;
    }
    return '';
  }

  async function fetchBookPage(book) {
    const queries = [];
    if (book.isbn) queries.push('https://www.librarything.com/isbn/' + encodeURIComponent(book.isbn));
    if (book.title) {
      const q = book.author ? book.title + ' ' + book.author : book.title;
      queries.push('https://www.librarything.com/search.php?searchtype=works&searchtype=works&q=' + encodeURIComponent(q));
    }

    for (const url of queries) {
      try {
        const res = await fetch(url, { credentials: 'include' });
        const html = await res.text();

        // If search results page, follow first work link
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const workLink = doc.querySelector('a[href*="/work/"]');
        if (workLink && !url.includes('/work/')) {
          const href = workLink.getAttribute('href');
          const workUrl = href.startsWith('http') ? href : 'https://www.librarything.com' + href;
          const workRes = await fetch(workUrl, { credentials: 'include' });
          const workHtml = await workRes.text();
          const desc = extractDesc(workHtml);
          if (desc.length > 30) return desc;
        }

        const desc = extractDesc(html);
        if (desc.length > 30) return desc;
      } catch(e) {}
    }
    return '';
  }

  console.log('🔍 StoryKeeper LibraryThing Scraper — ' + BOOKS.length + ' books to check');

  for (let i = 0; i < BOOKS.length; i++) {
    const book = BOOKS[i];
    try {
      const desc = await fetchBookPage(book);
      if (desc.length > 30) {
        if (book.isbn) results[book.isbn] = desc;
        else results['_idx_' + book._idx] = desc;
        found++;
      } else {
        failed++;
      }
    } catch(e) { failed++; }

    if (i % 20 === 0) console.log('[' + (i+1) + '/' + BOOKS.length + '] found: ' + found + ' | failed: ' + failed);
    await new Promise(r => setTimeout(r, 700));
  }

  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sk_descriptions.json';
  document.body.appendChild(a);
  a.click();
  a.remove();

  console.log('\\n🎉 Done! Found: ' + found + ' | Failed: ' + failed);
  console.log('Upload sk_descriptions.json back in StoryKeeper to apply the descriptions.');
})();`;
          };

          const handleUploadLT = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
              try {
                const results = JSON.parse(ev.target.result);
                const books = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
                let applied = 0;
                const toCache = [];
                books.forEach((b, idx) => {
                  if (b.description) return;
                  const desc = (b.isbn && results[b.isbn]) ? results[b.isbn] : results['_idx_' + idx];
                  const badDesc = desc && (desc.includes("LibraryThing catalogs") || desc.length < 30);
                  if (desc && !badDesc) { b.description = desc; applied++; toCache.push({ b, desc }); }
                });
                localStorage.setItem("sk_user_books", JSON.stringify(books));
                alert(`✅ Applied ${applied} descriptions to your library! Syncing to community cache…`);
                e.target.value = "";
                for (const { b, desc } of toCache) {
                  await writeToCache(b.isbn, b.title, b.author, desc, b.coverUrl, b.genre);
                }
              } catch {
                alert("❌ Could not read the file. Make sure it's the sk_descriptions.json from the LibraryThing scraper.");
              }
            };
            reader.readAsText(file);
          };

          return (
            <div style={{
              background: th.bgMuted,
              border: `1px solid ${th.border}`,
              borderRadius: 10,
              padding: "18px 24px",
              marginBottom: 20,
            }}>
              <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 16, fontWeight: 700, color: th.text, marginBottom: 4 }}>
                📚 LibraryThing Description Scraper
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: th.textSoft, marginBottom: 8 }}>
                LibraryThing has community-sourced descriptions for millions of books. Run this script on librarything.com to fetch descriptions and download a results file, then upload it here.
              </div>

              {total > 0 ? (
                <>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: th.textMid, marginBottom: 10 }}>
                    📚 {total} books are eligible for LibraryThing scraping
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(buildLTScript()).then(() => alert("✅ LibraryThing script copied! Go to librarything.com, open the console (F12 → Console), paste it, and press Enter."));
                      }}
                      style={{ padding: "8px 16px", background: th.accent, color: th.bg, border: "none", borderRadius: 7, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 700 }}
                    >
                      📋 Step 1 — Copy Script
                    </button>
                    <label style={{ padding: "8px 16px", background: th.accentLight || th.accent, color: th.bg, border: "none", borderRadius: 7, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 700 }}>
                      📥 Step 2 — Upload sk_descriptions.json
                      <input type="file" accept=".json" onChange={handleUploadLT} style={{ display: "none" }} />
                    </label>
                  </div>
                  <ol style={{ fontFamily: "Georgia, serif", fontSize: 13, color: th.textMid, margin: "0 0 8px 0", paddingLeft: 20, lineHeight: 1.9 }}>
                    <li>Go to <strong>librarything.com</strong> (no login required, but logged-in helps)</li>
                    <li>Open the browser console: <strong>F12</strong> → Console tab (or <strong>Cmd+Option+J</strong> on Mac)</li>
                    <li>Click <strong>Step 1 — Copy Script</strong> above, paste into the console, press <strong>Enter</strong></li>
                    <li>It searches each book and logs progress — takes ~{Math.ceil(total * 0.7 / 60)} min for {total} books</li>
                    <li>When done it downloads <strong>sk_descriptions.json</strong> — click Step 2 to upload it</li>
                  </ol>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: th.textSoft }}>
                    ⚠️ Runs entirely in your browser. No data is sent to any server.
                  </div>
                </>
              ) : (
                <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: th.textMid }}>
                  ✅ No books missing descriptions — or no books have been imported yet.
                </div>
              )}
            </div>
          );
        })()}

        {/* StoryGraph Description Scraper */}
        {(() => {
          const allBooks = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
          const eligible = allBooks
            .map((b, i) => ({ isbn: b.isbn, title: b.title, author: b.author, _idx: i }))
            .filter(b => !allBooks[b._idx].description && (b.isbn || b.title));
          const total = eligible.length;

          const buildSGScript = () => {
            const embedded = JSON.stringify(eligible.map(b => ({ isbn: b.isbn, title: b.title, author: b.author, _idx: b._idx })));
            return `// StoryKeeper — StoryGraph Description Scraper
// Paste this in your browser console while on thestorygraph.com (must be logged in)
// It will download a sk_descriptions.json file when done — upload that back in StoryKeeper.

(async function() {
  const BOOKS = ${embedded};
  const results = {};
  let found = 0, failed = 0;

  function extractDesc(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // StoryGraph description selectors
    const selectors = [
      '[data-book-show-target="description"]',
      '.book-title-author-and-series ~ div p',
      '.book-description',
      '#book-description',
      '[class*="description"]',
    ];
    for (const sel of selectors) {
      const el = doc.querySelector(sel);
      if (el) {
        const txt = (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim();
        if (txt.length > 30) return txt;
      }
    }

    // meta fallback
    const meta = doc.querySelector('meta[property="og:description"]') || doc.querySelector('meta[name="description"]');
    if (meta) {
      const txt = (meta.getAttribute('content') || '').replace(/\\s+/g, ' ').trim();
      if (txt.length > 30) return txt;
    }
    return '';
  }

  async function fetchBookPage(book) {
    const queries = [];
    if (book.title) {
      const q = book.author ? book.title + ' ' + book.author : book.title;
      queries.push('https://app.thestorygraph.com/browse?search_term=' + encodeURIComponent(q));
    }

    for (const url of queries) {
      try {
        const res = await fetch(url, { credentials: 'include' });
        const html = await res.text();

        // Follow first book result link
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const bookLink = doc.querySelector('a[href*="/books/"]');
        if (bookLink) {
          const href = bookLink.getAttribute('href');
          const bookUrl = href.startsWith('http') ? href : 'https://app.thestorygraph.com' + href;
          const bookRes = await fetch(bookUrl, { credentials: 'include' });
          const bookHtml = await bookRes.text();
          const desc = extractDesc(bookHtml);
          if (desc.length > 30) return desc;
        }

        const desc = extractDesc(html);
        if (desc.length > 30) return desc;
      } catch(e) {}
    }
    return '';
  }

  console.log('🔍 StoryKeeper StoryGraph Scraper — ' + BOOKS.length + ' books to check');

  for (let i = 0; i < BOOKS.length; i++) {
    const book = BOOKS[i];
    try {
      const desc = await fetchBookPage(book);
      if (desc.length > 30) {
        if (book.isbn) results[book.isbn] = desc;
        else results['_idx_' + book._idx] = desc;
        found++;
      } else {
        failed++;
      }
    } catch(e) { failed++; }

    if (i % 20 === 0) console.log('[' + (i+1) + '/' + BOOKS.length + '] found: ' + found + ' | failed: ' + failed);
    await new Promise(r => setTimeout(r, 900));
  }

  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sk_descriptions.json';
  document.body.appendChild(a);
  a.click();
  a.remove();

  console.log('\\n🎉 Done! Found: ' + found + ' | Failed: ' + failed);
  console.log('Upload sk_descriptions.json back in StoryKeeper to apply the descriptions.');
})();`;
          };

          const handleUploadSG = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
              try {
                const results = JSON.parse(ev.target.result);
                const books = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
                let applied = 0;
                const toCache = [];
                books.forEach((b, idx) => {
                  if (b.description) return;
                  const desc = (b.isbn && results[b.isbn]) ? results[b.isbn] : results['_idx_' + idx];
                  if (desc) { b.description = desc; applied++; toCache.push({ b, desc }); }
                });
                localStorage.setItem("sk_user_books", JSON.stringify(books));
                alert(`✅ Applied ${applied} descriptions to your library! Syncing to community cache…`);
                e.target.value = "";
                for (const { b, desc } of toCache) {
                  await writeToCache(b.isbn, b.title, b.author, desc, b.coverUrl, b.genre);
                }
              } catch {
                alert("❌ Could not read the file. Make sure it's the sk_descriptions.json from the StoryGraph scraper.");
              }
            };
            reader.readAsText(file);
          };

          return (
            <div style={{
              background: th.bgMuted,
              border: `1px solid ${th.border}`,
              borderRadius: 10,
              padding: "18px 24px",
              marginBottom: 20,
            }}>
              <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 16, fontWeight: 700, color: th.text, marginBottom: 4 }}>
                🌿 StoryGraph Description Scraper
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: th.textSoft, marginBottom: 8 }}>
                StoryGraph is a book-focused platform with descriptions for a wide range of titles. Run this script on thestorygraph.com while logged in to fetch descriptions, then upload the results here.
              </div>

              {total > 0 ? (
                <>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: th.textMid, marginBottom: 10 }}>
                    📚 {total} books are eligible for StoryGraph scraping
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(buildSGScript()).then(() => alert("✅ StoryGraph script copied! Go to thestorygraph.com, open the console (F12 → Console), paste it, and press Enter."));
                      }}
                      style={{ padding: "8px 16px", background: th.accent, color: th.bg, border: "none", borderRadius: 7, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 700 }}
                    >
                      📋 Step 1 — Copy Script
                    </button>
                    <label style={{ padding: "8px 16px", background: th.accentLight || th.accent, color: th.bg, border: "none", borderRadius: 7, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 700 }}>
                      📥 Step 2 — Upload sk_descriptions.json
                      <input type="file" accept=".json" onChange={handleUploadSG} style={{ display: "none" }} />
                    </label>
                  </div>
                  <ol style={{ fontFamily: "Georgia, serif", fontSize: 13, color: th.textMid, margin: "0 0 8px 0", paddingLeft: 20, lineHeight: 1.9 }}>
                    <li>Go to <strong>thestorygraph.com</strong> and make sure you're logged in</li>
                    <li>Open the browser console: <strong>F12</strong> → Console tab (or <strong>Cmd+Option+J</strong> on Mac)</li>
                    <li>Click <strong>Step 1 — Copy Script</strong> above, paste into the console, press <strong>Enter</strong></li>
                    <li>It searches each book and logs progress — takes ~{Math.ceil(total * 0.9 / 60)} min for {total} books</li>
                    <li>When done it downloads <strong>sk_descriptions.json</strong> — click Step 2 to upload it</li>
                  </ol>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: th.textSoft }}>
                    ⚠️ Runs entirely in your browser. No data is sent to any server.
                  </div>
                </>
              ) : (
                <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: th.textMid }}>
                  ✅ No books missing descriptions — or no books have been imported yet.
                </div>
              )}
            </div>
          );
        })()}

        {/* Book Cover Scraper */}
        {(() => {
          const allBooks = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
          const eligible = allBooks
            .map((b, i) => ({ isbn: b.isbn, title: b.title, author: b.author, _idx: i }))
            .filter(b => !allBooks[b._idx].coverUrl && (b.isbn || b.title));
          const total = eligible.length;

          const buildCoverScript = () => {
            const embedded = JSON.stringify(eligible.map(b => ({ isbn: b.isbn, title: b.title, author: b.author, _idx: b._idx })));
            return `// StoryKeeper — Book Cover Scraper
// Paste this in your browser console while on librarything.com
// It will download a sk_covers.json file when done — upload that back in StoryKeeper.

(async function() {
  const BOOKS = ${embedded};
  const results = {};
  let found = 0, failed = 0;

  // Test if an Open Library cover exists by loading it as an image
  function testOpenLibraryCover(isbn) {
    return new Promise((resolve) => {
      if (!isbn) return resolve(null);
      const url = 'https://covers.openlibrary.org/b/isbn/' + isbn + '-L.jpg';
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth > 10 ? url : null);
      img.onerror = () => resolve(null);
      img.src = url;
      setTimeout(() => resolve(null), 5000);
    });
  }

  // Extract cover image from LibraryThing page HTML
  function extractCover(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const selectors = [
      '#maincover img',
      '.bookcover img',
      '[id*="book_cover"] img',
      'img[src*="covers.openlibrary"]',
      'img[src*="images.gr-assets"]',
      'img[src*="librarything"]',
      'img[alt*="cover" i]',
      'img[alt*="book" i]',
    ];
    for (const sel of selectors) {
      const img = doc.querySelector(sel);
      if (img) {
        const src = img.getAttribute('src') || '';
        if (src && !src.includes('1x1') && !src.includes('placeholder') && !src.includes('20years') && !src.includes('nophoto') && !src.includes('nocover') && src.length > 10) {
          return src.startsWith('http') ? src : 'https://www.librarything.com' + src;
        }
      }
    }
    return '';
  }

  async function fetchCoverUrl(book) {
    // 1. Try Open Library first (free, direct, no scraping needed)
    if (book.isbn) {
      const olUrl = await testOpenLibraryCover(book.isbn);
      if (olUrl) return olUrl;
    }

    // 2. Fall back to LibraryThing scraping
    const queries = [];
    if (book.isbn) queries.push('https://www.librarything.com/isbn/' + encodeURIComponent(book.isbn));
    if (book.title) {
      const q = book.author ? book.title + ' ' + book.author : book.title;
      queries.push('https://www.librarything.com/search.php?searchtype=works&q=' + encodeURIComponent(q));
    }

    for (const url of queries) {
      try {
        const res = await fetch(url, { credentials: 'include' });
        const html = await res.text();

        const doc = new DOMParser().parseFromString(html, 'text/html');
        const workLink = doc.querySelector('a[href*="/work/"]');
        if (workLink && !url.includes('/work/')) {
          const href = workLink.getAttribute('href');
          const workUrl = href.startsWith('http') ? href : 'https://www.librarything.com' + href;
          const workRes = await fetch(workUrl, { credentials: 'include' });
          const workHtml = await workRes.text();
          const cover = extractCover(workHtml);
          if (cover) return cover;
        }

        const cover = extractCover(html);
        if (cover) return cover;
      } catch(e) {}
    }
    return '';
  }

  console.log('🖼️ StoryKeeper Cover Scraper — ' + BOOKS.length + ' books to check');

  for (let i = 0; i < BOOKS.length; i++) {
    const book = BOOKS[i];
    try {
      const coverUrl = await fetchCoverUrl(book);
      if (coverUrl) {
        if (book.isbn) results[book.isbn] = coverUrl;
        else results['_idx_' + book._idx] = coverUrl;
        found++;
      } else {
        failed++;
      }
    } catch(e) { failed++; }

    if (i % 20 === 0) console.log('[' + (i+1) + '/' + BOOKS.length + '] found: ' + found + ' | failed: ' + failed);
    await new Promise(r => setTimeout(r, 600));
  }

  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sk_covers.json';
  document.body.appendChild(a);
  a.click();
  a.remove();

  console.log('\\n🎉 Done! Found: ' + found + ' | Failed: ' + failed);
  console.log('Upload sk_covers.json back in StoryKeeper to apply the covers.');
})();`;
          };

          const buildSGCoverScript = () => {
            const embedded = JSON.stringify(eligible.map(b => ({ isbn: b.isbn, title: b.title, author: b.author, _idx: b._idx })));
            return `// StoryKeeper — StoryGraph Cover Scraper
// Paste this in your browser console while on thestorygraph.com (must be logged in)
// It will download a sk_covers.json file when done — upload that back in StoryKeeper.

(async function() {
  const BOOKS = ${embedded};
  const results = {};
  let found = 0, failed = 0;

  const BAD = ['20years', 'nophoto', 'nocover', '1x1', 'placeholder', 'blank'];
  function isGoodUrl(src) {
    if (!src || src.length < 10) return false;
    return !BAD.some(b => src.includes(b));
  }

  function extractCover(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const selectors = [
      'img[src*="covers"]',
      'img[src*="storage"]',
      'img[src*="book"]',
      '.book-cover img',
      '[data-book-cover] img',
      'img[alt*="cover" i]',
      'img[alt*="book" i]',
    ];
    for (const sel of selectors) {
      const img = doc.querySelector(sel);
      if (img) {
        const src = img.getAttribute('src') || '';
        if (isGoodUrl(src)) return src.startsWith('http') ? src : 'https://app.thestorygraph.com' + src;
      }
    }
    // og:image fallback
    const og = doc.querySelector('meta[property="og:image"]');
    if (og) {
      const src = og.getAttribute('content') || '';
      if (isGoodUrl(src)) return src;
    }
    return '';
  }

  async function fetchCover(book) {
    const queries = [];
    if (book.title) {
      const q = book.author ? book.title + ' ' + book.author : book.title;
      queries.push('https://app.thestorygraph.com/browse?search_term=' + encodeURIComponent(q));
    }
    for (const url of queries) {
      try {
        const res = await fetch(url, { credentials: 'include' });
        const html = await res.text();
        if (html.length === 0) { console.log('⚠️ Empty response — StoryGraph may be blocking fetch'); return ''; }
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const bookLink = doc.querySelector('a[href*="/books/"]');
        if (bookLink) {
          const href = bookLink.getAttribute('href');
          const bookUrl = href.startsWith('http') ? href : 'https://app.thestorygraph.com' + href;
          const bookRes = await fetch(bookUrl, { credentials: 'include' });
          const bookHtml = await bookRes.text();
          const cover = extractCover(bookHtml);
          if (cover) return cover;
        }
        const cover = extractCover(html);
        if (cover) return cover;
      } catch(e) { console.log('Error:', e.message); }
    }
    return '';
  }

  console.log('🖼️ StoryKeeper StoryGraph Cover Scraper — ' + BOOKS.length + ' books');
  console.log('--- DEBUG: testing first book ---');
  const test = BOOKS[0];
  console.log('Book:', test.title);
  const testCover = await fetchCover(test);
  console.log('Result:', testCover || '(none)');
  console.log('--- END DEBUG ---');

  for (let i = 0; i < BOOKS.length; i++) {
    const book = BOOKS[i];
    try {
      const cover = await fetchCover(book);
      if (cover) {
        if (book.isbn) results[book.isbn] = cover;
        else results['_idx_' + book._idx] = cover;
        found++;
      } else { failed++; }
    } catch(e) { failed++; }
    if (i % 10 === 0) console.log('[' + (i+1) + '/' + BOOKS.length + '] found: ' + found + ' | failed: ' + failed);
    await new Promise(r => setTimeout(r, 700));
  }

  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sk_covers.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  console.log('\\n🎉 Done! Found: ' + found + ' | Failed: ' + failed);
  console.log('Upload sk_covers.json back in StoryKeeper to apply.');
})();`;
          };

          const handleUploadCovers = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
              try {
                const results = JSON.parse(ev.target.result);
                const books = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
                let applied = 0;
                const toCache = [];
                books.forEach((b, idx) => {
                  if (b.coverUrl) return;
                  const url = (b.isbn && results[b.isbn]) ? results[b.isbn] : results['_idx_' + idx];
                  const badUrl = !url || url.includes('20years') || url.includes('nophoto') || url.includes('nocover') || url.includes('1x1');
                  if (url && !badUrl) { b.coverUrl = url; applied++; toCache.push({ b, url }); }
                });
                localStorage.setItem("sk_user_books", JSON.stringify(books));
                alert(`✅ Applied ${applied} covers to your library! Syncing to community cache…`);
                e.target.value = "";
                for (const { b, url } of toCache) {
                  await writeToCache(b.isbn, b.title, b.author, b.description, url, b.genre);
                }
              } catch {
                alert("❌ Could not read the file. Make sure it's the sk_covers.json from the cover scraper.");
              }
            };
            reader.readAsText(file);
          };

          return (
            <div style={{
              background: th.bgMuted,
              border: `1px solid ${th.border}`,
              borderRadius: 10,
              padding: "18px 24px",
              marginBottom: 20,
            }}>
              <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 16, fontWeight: 700, color: th.text, marginBottom: 4 }}>
                🖼️ Book Cover Scraper
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: th.textSoft, marginBottom: 8 }}>
                Finds missing book covers using Open Library (by ISBN), LibraryThing, or StoryGraph. Run on the respective site, then upload the results here.
              </div>

              {total > 0 ? (
                <>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: th.textMid, marginBottom: 10 }}>
                    🖼️ {total} books are missing covers
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(buildCoverScript()).then(() => alert("✅ LibraryThing cover script copied! Go to librarything.com, open the console (F12 → Console), paste it, and press Enter."));
                      }}
                      style={{ padding: "8px 16px", background: th.accent, color: th.bg, border: "none", borderRadius: 7, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 700 }}
                    >
                      📋 LibraryThing Script
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(buildSGCoverScript()).then(() => alert("✅ StoryGraph cover script copied! Go to thestorygraph.com, open the console (F12 → Console), paste it, and press Enter."));
                      }}
                      style={{ padding: "8px 16px", background: th.accent, color: th.bg, border: "none", borderRadius: 7, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 700 }}
                    >
                      📋 StoryGraph Script
                    </button>
                    <label style={{ padding: "8px 16px", background: th.accentLight || th.accent, color: th.bg, border: "none", borderRadius: 7, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 700 }}>
                      📥 Upload sk_covers.json
                      <input type="file" accept=".json" onChange={handleUploadCovers} style={{ display: "none" }} />
                    </label>
                  </div>
                  <ol style={{ fontFamily: "Georgia, serif", fontSize: 13, color: th.textMid, margin: "0 0 8px 0", paddingLeft: 20, lineHeight: 1.9 }}>
                    <li>Go to <strong>librarything.com</strong> or <strong>thestorygraph.com</strong> and make sure you're logged in</li>
                    <li>Open the browser console: <strong>F12</strong> → Console tab (or <strong>Cmd+Option+J</strong> on Mac)</li>
                    <li>Click <strong>Step 1 — Copy Script</strong> above, paste into the console, press <strong>Enter</strong></li>
                    <li>It checks Open Library first (fast), then LibraryThing as backup — takes ~{Math.ceil(total * 0.6 / 60)} min for {total} books</li>
                    <li>When done it downloads <strong>sk_covers.json</strong> — click Step 2 to upload it</li>
                  </ol>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: th.textSoft }}>
                    ⚠️ Runs entirely in your browser. No data is sent to any server.
                  </div>
                </>
              ) : (
                <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: th.textMid }}>
                  ✅ All books have covers — nothing to do here!
                </div>
              )}
            </div>
          );
        })()}

        {/* Clear imported books */}
        <div style={{
          background: th.bgMuted,
          border: `1px solid ${th.border}`,
          borderRadius: 10,
          padding: "18px 24px",
          marginBottom: 36,
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 16, fontWeight: 700, color: th.text, marginBottom: 4 }}>
              🗑️ Clear Imported Books
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: th.textSoft }}>
              Remove all books you imported from platforms. Built-in library books and your reading history are kept.
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm("Remove all imported books and clear the shelves? This cannot be undone.")) {
                [
                  "sk_user_books",
                  "sk_connections",
                  "sk_favorites_ebooks",
                  "sk_favorites_audiobooks",
                  "sk_statuses_ebooks",
                  "sk_statuses_audiobooks",
                  "sk_progress_ebooks",
                  "sk_progress_audiobooks",
                  "sk_dates_ebooks",
                  "sk_dates_audiobooks",
                  "sk_genre_overrides",
                ].forEach(k => localStorage.removeItem(k));
                setConnections({});
                window.location.reload();
              }
            }}
            style={{
              padding: "10px 22px",
              background: "transparent",
              color: "#a00",
              border: "1px solid #a00",
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: '"Palatino Linotype", Palatino, serif',
              fontSize: 14,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            🗑️ Clear Now
          </button>
        </div>

        {/* eBook Platforms */}
        <div style={{ marginBottom: 40 }}>
          {sectionTitle("📚 eBook Platforms")}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {EBOOK_PLATFORMS.map((p) => (
              <PlatformCard key={p.id} platform={p} connected={!!connections[p.id]} onConnect={connect} onDisconnect={disconnect} onImportClick={setImportingPlatform} th={th} />
            ))}
          </div>
        </div>

        {/* Audiobook Platforms */}
        <div style={{ marginBottom: 40 }}>
          {sectionTitle("🎧 Audiobook Platforms")}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {AUDIO_PLATFORMS.map((p) => (
              <PlatformCard key={p.id} platform={p} connected={!!connections[p.id]} onConnect={connect} onDisconnect={disconnect} onImportClick={setImportingPlatform} th={th} />
            ))}
          </div>
        </div>
      </div>

      {importingPlatform && (
        <ImportModal
          platform={importingPlatform}
          mediaType={AUDIO_PLATFORMS.some(p => p.id === importingPlatform.id) ? "audiobooks" : "ebooks"}
          onClose={() => setImportingPlatform(null)}
          onImport={(newBooks) => {
            const existing = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
            const withIds = newBooks.map(b => ({ ...b, id: `${b.platform}-${Date.now()}-${Math.random()}` }));
            localStorage.setItem("sk_user_books", JSON.stringify([...existing, ...withIds]));

            // Save Goodreads reading status and dates
            const statusKey = `sk_statuses_${mediaType}`;
            const datesKey  = `sk_dates_${mediaType}`;
            const statuses  = JSON.parse(localStorage.getItem(statusKey) || "{}");
            const dates     = JSON.parse(localStorage.getItem(datesKey)  || "{}");

            newBooks.forEach(b => {
              if (!b.isbn) return;
              if (b._status) statuses[b.isbn] = b._status;
              if (b._dateRead) {
                const d = new Date(b._dateRead);
                if (!isNaN(d)) {
                  dates[b.isbn] = { ...dates[b.isbn], endDate: d.toISOString() };
                  if (b._status === "finished") dates[b.isbn].startDate = dates[b.isbn].startDate || d.toISOString();
                }
              }
            });

            localStorage.setItem(statusKey, JSON.stringify(statuses));
            localStorage.setItem(datesKey,  JSON.stringify(dates));

            setImportingPlatform(null);
            refreshBookCounts();
            const statusCount = newBooks.filter(b => b._status).length;
            alert(`✅ ${newBooks.length} book${newBooks.length !== 1 ? 's' : ''} imported successfully!${statusCount > 0 ? `\n📊 ${statusCount} books imported with reading status (finished/reading).` : ''}`);
          }}
        />
      )}
    </div>
  );
}

function SearchBar({ mediaType, onSelectBook }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [focused, setFocused] = useState(false);

  const allBooks = (() => {
    const base = Object.entries(library).flatMap(([genre, books]) =>
      books.map(b => ({ ...b, genre }))
    );
    try {
      const user = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
      return [...base, ...user];
    } catch { return base; }
  })();

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    const lower = q.toLowerCase();
    setResults(
      allBooks.filter(b =>
        b.title.toLowerCase().includes(lower) ||
        b.author.toLowerCase().includes(lower)
      ).slice(0, 8)
    );
  };

  const handleSelect = (book) => {
    onSelectBook(book);
    setQuery("");
    setResults([]);
    setFocused(false);
  };

  const showDropdown = focused && results.length > 0;

  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 6, position: "relative", zIndex: 50 }}>
      <div style={{ position: "relative", width: "100%", maxWidth: "90vw" }}>
        {/* Input row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(to bottom, #fdf6e3, #f5e6c0)",
          border: "1px solid #b8893a",
          borderRadius: showDropdown ? "14px 14px 0 0" : 14,
          boxShadow: "0 2px 8px rgba(0,0,0,0.18), inset 0 1px 2px rgba(255,255,255,0.6)",
          padding: "4px 10px",
          transition: "border-radius 0.15s",
        }}>
          <span style={{ fontSize: 12, marginRight: 6, opacity: 0.6, color: "#5a3a1a", userSelect: "none" }}>🔍</span>
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Search titles or authors…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: '"Palatino Linotype", Palatino, serif',
              fontSize: 12,
              color: "#3A2A1A",
              fontStyle: query ? "normal" : "italic",
            }}
          />
          {query && (
            <button
              onMouseDown={() => { setQuery(""); setResults([]); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#8B5E3C", fontSize: 14, padding: 0, lineHeight: 1, opacity: 0.7 }}
            >✕</button>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "linear-gradient(to bottom, #fdf6e3, #f5e6c0)",
            border: "1px solid #b8893a",
            borderTop: "1px solid #d4a84a",
            borderRadius: "0 0 16px 16px",
            boxShadow: "0 6px 16px rgba(0,0,0,0.22)",
            overflow: "hidden",
          }}>
            {results.map((book, i) => (
              <div
                key={`${book.isbn}-${i}`}
                onMouseDown={() => handleSelect(book)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 14px",
                  cursor: "pointer",
                  borderBottom: i < results.length - 1 ? "1px solid rgba(184,137,58,0.25)" : "none",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(184,137,58,0.15)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {book.isbn ? (
                  <img
                    src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-S.jpg`}
                    alt=""
                    style={{ width: 28, height: 38, objectFit: "cover", borderRadius: 2, border: "1px solid #c9a96e", flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: 28, height: 38, background: "#d8c3a5", borderRadius: 2, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: '"Palatino Linotype", Palatino, serif',
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#3A2A1A",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>{book.title}</div>
                  <div style={{
                    fontFamily: "Georgia, serif",
                    fontSize: 11,
                    fontStyle: "italic",
                    color: "#6B4E32",
                  }}>{book.author}</div>
                </div>
                <div style={{
                  fontFamily: "Georgia, serif",
                  fontSize: 10,
                  color: "#8B5E3C",
                  flexShrink: 0,
                  opacity: 0.8,
                }}>
                  {book.type === "audiobooks" ? "🎧" : "📚"} {book.genre}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

const MOBILE_BOTANICAL_POOL = [
  { label: "Iridescent Hibiscus",  src: "/botanicals/fantasy-iridescent-hibiscus.jpg" },
  { label: "Red Poppy",            src: "/botanicals/mystery-red-poppy.jpg" },
  { label: "Tropical Bloom",       src: "/botanicals/scifi-tropical-bloom.jpg" },
  { label: "Peach Rose",           src: "/botanicals/romance-peach-rose.jpg" },
  { label: "Daisies",              src: "/botanicals/selfhelp-daisies.png" },
  { label: "Black Hibiscus",       src: "/botanicals/dark-romance-black-hibiscus.jpg" },
  { label: "Watercolor Bouquet",   src: "/botanicals/fiction-watercolor-bouquet.jpg" },
  { label: "Vintage Bouquet",      src: "/botanicals/historical-fiction-watercolor-bouquet.jpg" },
  { label: "Rosemary",             src: "/botanicals/cookbooks-rosemary.png" },
  { label: "Blue Hydrangea",       src: "/botanicals/drama-blue-hydrangea.png" },
  { label: "Purple Dahlia",        src: "/botanicals/truecrime-purple-dahlia.jpg" },
  { label: "Caladium Leaf",        src: "/botanicals/gardening-caladium-leaf.jpg" },
  { label: "Yellow Rose",          src: "/botanicals/rpx-10209439.jpg" },
  { label: "Flowering Cactus",     src: "/botanicals/rpx-2098047.jpg" },
  { label: "White Lily",           src: "/botanicals/rpx-2613484.jpg" },
  { label: "Mixed Bouquet",        src: "/botanicals/rpx-263623.jpg" },
  { label: "Strawberries",         src: "/botanicals/rpx-263717.jpg" },
  { label: "Amaryllis",            src: "/botanicals/rpx-2771351.jpg" },
  { label: "Pansies",              src: "/botanicals/rpx-2771543.jpg" },
  { label: "Sunflower",            src: "/botanicals/rpx-2771544.jpg" },
  { label: "Blue Columbine",       src: "/botanicals/rpx-2772162.jpg" },
  { label: "Pineapple",            src: "/botanicals/rpx-2805512.jpg" },
  { label: "Yellow Roses",         src: "/botanicals/rpx-2869859.jpg" },
  { label: "Lilac",                src: "/botanicals/rpx-2870676.jpg" },
  { label: "Clematis",             src: "/botanicals/rpx-2872051.jpg" },
  { label: "Skull & Flowers",      src: "/botanicals/rpx-2880154.jpg" },
  { label: "Citrus Branch",        src: "/botanicals/rpx-2880305.jpg" },
  { label: "Ranunculus Bouquet",   src: "/botanicals/rpx-2880345.jpg" },
  { label: "Tiger & White Lily",   src: "/botanicals/rpx-2880374.jpg" },
  { label: "Pink Azalea",          src: "/botanicals/rpx-2880380.jpg" },
  { label: "Cherry Blossoms",      src: "/botanicals/rpx-2880457.jpg" },
  { label: "White Poppies",        src: "/botanicals/rpx-2880603.jpg" },
  { label: "Dahlias",              src: "/botanicals/rpx-2880608.jpg" },
  { label: "Victorian Bouquet",    src: "/botanicals/rpx-50881.jpg" },
  { label: "Dichorisandra",        src: "/botanicals/rpx-569504.jpg" },
  { label: "Pelargonium",          src: "/botanicals/rpx-574479.jpg" },
  { label: "Panicum Leaves",       src: "/botanicals/rpx-574635.jpg" },
  { label: "Dark Red Foliage",     src: "/botanicals/rpx-6264355.jpg" },
  { label: "Blue Flower",          src: "/botanicals/rpx-6437436.jpg" },
  { label: "Rosa Damascena",       src: "/botanicals/rpx-6437442.jpg" },
  { label: "Roses & Butterflies",  src: "/botanicals/rpx-6441864.jpg" },
  { label: "Carnations",           src: "/botanicals/rpx-843203.jpg" },
  { label: "Alternanthera",        src: "/botanicals/rpx-8543996.jpg" },
  { label: "Pink Peony",           src: "/botanicals/rpx-15249963.png" },
  { label: "Peonies Bouquet",      src: "/botanicals/rpx-16415935.png" },
  { label: "Colorful Bouquet",     src: "/botanicals/rpx-16666974.png" },
];

function MobileBookShelf({ genre, mediaType, onToggleMediaType, onClose, onOpenSettings, onOpenStats, onOpenProfile, onOpenBookClub, onOpenGroup, autoOpenBook, onAutoOpenDone }) {
  const [filterQuery, setFilterQuery] = useState("");
  const [sortBy, setSortBy] = useState(() => localStorage.getItem("sk_shelf_sort") || "default");
  const [selectedBook, setSelectedBook] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (autoOpenBook) {
      setSelectedBook(autoOpenBook);
      if (onAutoOpenDone) onAutoOpenDone();
    }
  }, [autoOpenBook]);
  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef(null);
  const rainCtxRef = useRef(null);
  const rainSourceRef = useRef(null);

  const startRain = async () => {
    if (rainCtxRef.current) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    rainCtxRef.current = ctx;
    const buf = await fetch("/sounds/rain-thunder.ogg").then(r => r.arrayBuffer());
    const decoded = await ctx.decodeAudioData(buf);
    const src = ctx.createBufferSource();
    src.buffer = decoded; src.loop = true;
    const gain = ctx.createGain(); gain.gain.value = 0.85;
    src.connect(gain); gain.connect(ctx.destination);
    src.start(0);
    rainSourceRef.current = src;
  };

  const stopRain = () => {
    try { rainSourceRef.current?.stop(); } catch (_) {}
    rainCtxRef.current?.close();
    rainCtxRef.current = null; rainSourceRef.current = null;
  };

  const toggleSound = () => {
    if (soundOn) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.volume = 0.08; }
      stopRain();
      setSoundOn(false);
    } else {
      if (audioRef.current) { audioRef.current.volume = 0.08; audioRef.current.play().catch(() => {}); }
      startRain();
      setSoundOn(true);
    }
  };

  const loadMobileBooks = () => {
    const genreOverrides = (() => { try { return JSON.parse(localStorage.getItem("sk_genre_overrides") || "{}"); } catch { return {}; } })();
    const hiddenBooks = (() => { try { return new Set(JSON.parse(localStorage.getItem("sk_hidden_books") || "[]")); } catch { return new Set(); } })();
    const lib = (() => { try { return JSON.parse(localStorage.getItem("sk_library") || "{}"); } catch { return {}; } })();
    const allBooks = (lib[genre] || [])
      .filter(b => b.type === mediaType)
      .filter(b => (genreOverrides[b.isbn] || genre) === genre)
      .filter(b => !hiddenBooks.has(b.isbn || b.title));
    const overriddenToHere = Object.values(lib).flat()
      .filter(b => b.type === mediaType && genreOverrides[b.isbn] === genre && !(lib[genre] || []).some(lb => lb.isbn === b.isbn))
      .filter(b => !hiddenBooks.has(b.isbn || b.title));
    const userBooks = (() => {
      try {
        const all = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
        return all.filter(b => {
          const bookMedia = b.type || (b.mediaType === "audiobook" ? "audiobooks" : b.mediaType === "ebook" ? "ebooks" : b.mediaType);
          const effectiveGenre = genreOverrides[b.isbn || b.title] || b.genre;
          return effectiveGenre === genre && bookMedia === mediaType;
        });
      } catch { return []; }
    })();
    return [...allBooks, ...overriddenToHere, ...userBooks];
  };

  const [allShelfBooks, setAllShelfBooks] = useState(() => loadMobileBooks());

  useEffect(() => {
    setAllShelfBooks(loadMobileBooks());
  }, [refreshKey, genre, mediaType]);

  const sortBooks = (arr) => {
    if (sortBy === "title") return [...arr].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    if (sortBy === "author") return [...arr].sort((a, b) => (a.author || "").split(" ").pop().localeCompare((b.author || "").split(" ").pop()));
    return arr;
  };
  const filtered = filterQuery.trim()
    ? allShelfBooks.filter(b => b.title.toLowerCase().includes(filterQuery.toLowerCase()) || (b.author || "").toLowerCase().includes(filterQuery.toLowerCase()))
    : allShelfBooks;
  const books = sortBooks(filtered);

  const favKey = `sk_favorites_${mediaType}`;
  const statusKey = `sk_statuses_${mediaType}`;
  const progressKey = `sk_progress_${mediaType}`;
  const [favorites, setFavorites] = useState(() => { try { return JSON.parse(localStorage.getItem(favKey)) || {}; } catch { return {}; } });
  const [statuses, setStatuses] = useState(() => { try { return JSON.parse(localStorage.getItem(statusKey)) || {}; } catch { return {}; } });
  const [progress, setProgress] = useState(() => { try { return JSON.parse(localStorage.getItem(progressKey)) || {}; } catch { return {}; } });

  useEffect(() => { localStorage.setItem(favKey, JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem(statusKey, JSON.stringify(statuses)); }, [statuses]);
  useEffect(() => { localStorage.setItem(progressKey, JSON.stringify(progress)); }, [progress]);

  const handleDelete = (book) => {
    const bookKey = book.isbn || book.title;
    const userBooksAll = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
    const isUser = userBooksAll.some(b => (b.isbn && b.isbn === book.isbn) || b.title === book.title);
    if (isUser) {
      localStorage.setItem("sk_user_books", JSON.stringify(userBooksAll.filter(b => !((b.isbn && b.isbn === book.isbn) || b.title === book.title))));
    } else {
      const hidden = JSON.parse(localStorage.getItem("sk_hidden_books") || "[]");
      if (!hidden.includes(bookKey)) hidden.push(bookKey);
      localStorage.setItem("sk_hidden_books", JSON.stringify(hidden));
    }
    setRefreshKey(k => k + 1);
    setSelectedBook(null);
  };

  const STATUS_COLORS = { "reading": "#C9A96E", "completed": "#6BAF7A", "want": "#7EB3D4", "dnf": "#C47A7A" };
  const STATUS_LABELS = { "reading": "Reading", "completed": "Done", "want": "Want", "dnf": "DNF" };

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", zIndex: 550, overflowX: "hidden" }}>
      {/* Parchment background — separate fixed layer so it never scrolls */}
      <div style={{ position: "fixed", inset: 0, background: '#F8F1E4 url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg") center/cover', zIndex: 0, pointerEvents: "none" }} />
      <audio ref={audioRef} loop src="/sounds/fire.mp3" />

      {/* Header */}
      <div style={{
        flexShrink: 0, padding: "48px 16px 10px", position: "relative", zIndex: 1,
        background: "linear-gradient(to bottom, rgba(248,241,228,0.98) 0%, rgba(248,241,228,0.92) 100%)",
        borderBottom: "1px solid rgba(139,94,60,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <button onClick={onClose} style={{
            background: "rgba(139,94,60,0.12)", border: "1px solid rgba(139,94,60,0.4)",
            borderRadius: 20, padding: "6px 14px", color: "#5C3A1E", cursor: "pointer",
            fontFamily: "Georgia, serif", fontSize: 13, flexShrink: 0,
          }}>← Back</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 18, color: "#3A2010", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {mediaType === "ebooks" ? "📚" : "🎧"} {genre}
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 11, color: "#8B5E3C", fontStyle: "italic" }}>
              {filterQuery ? `${books.length} of ${allShelfBooks.length}` : books.length} {mediaType === "ebooks" ? "eBooks" : "Audiobooks"}
            </div>
          </div>
          <button onClick={onToggleMediaType} style={{
            background: "rgba(139,94,60,0.12)", border: "1px solid rgba(139,94,60,0.4)",
            borderRadius: 20, padding: "6px 10px", color: "#5C3A1E", cursor: "pointer",
            fontFamily: "Georgia, serif", fontSize: 12, flexShrink: 0,
          }}>{mediaType === "ebooks" ? "🎧" : "📚"}</button>
          <button onClick={onOpenGroup} style={{
            background: "rgba(94,107,140,0.15)", border: "1px solid rgba(94,107,140,0.5)",
            borderRadius: 20, padding: "6px 10px", color: "#2E3A5C", cursor: "pointer",
            fontFamily: "Georgia, serif", fontSize: 12, flexShrink: 0,
          }}>👥 Group</button>
          <button onClick={onOpenBookClub} style={{
            background: "rgba(107,140,94,0.15)", border: "1px solid rgba(107,140,94,0.5)",
            borderRadius: 20, padding: "6px 10px", color: "#3A5C2E", cursor: "pointer",
            fontFamily: "Georgia, serif", fontSize: 12, flexShrink: 0,
          }}>📚 Club</button>
        </div>

        {/* Search + Sort */}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Search title or author…"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            style={{
              flex: 1, padding: "8px 12px", borderRadius: 20,
              border: "1px solid rgba(139,94,60,0.35)", background: "rgba(255,255,255,0.5)",
              color: "#3A2010", fontFamily: "Georgia, serif", fontSize: 13, outline: "none",
            }}
          />
          <select value={sortBy} onChange={e => { setSortBy(e.target.value); localStorage.setItem("sk_shelf_sort", e.target.value); }}
            style={{
              padding: "8px 10px", borderRadius: 20, border: "1px solid rgba(139,94,60,0.35)",
              background: "rgba(255,255,255,0.5)", color: "#5C3A1E", fontFamily: "Georgia, serif", fontSize: 12, cursor: "pointer",
            }}>
            <option value="default">Default</option>
            <option value="title">Title</option>
            <option value="author">Author</option>
          </select>
        </div>
      </div>

      {/* Book shelf */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 100, position: "relative", zIndex: 1 }}>
        {books.length === 0 ? (
          <div style={{ textAlign: "center", color: "rgba(200,180,140,0.5)", fontFamily: "Georgia, serif", fontSize: 14, fontStyle: "italic", marginTop: 60 }}>
            {filterQuery ? "No books match your search." : "No books in this collection yet."}
          </div>
        ) : (() => {
          const perRowBooks = mediaType === "audiobooks" ? 3 : 5;
          const rows = [];
          for (let i = 0; i < books.length; i += perRowBooks) rows.push(books.slice(i, i + perRowBooks));
          const bookGap = mediaType === "audiobooks" ? 6 : 3;
          const rowMinH = mediaType === "audiobooks" ? 110 : 230;
          const spineW = mediaType === "audiobooks" ? undefined : 44;
          const plantW = mediaType === "audiobooks" ? 155 : 220;
          const plantH = mediaType === "audiobooks" ? 380 : 760;

          return rows.map((row, rowIndex) => {
            const layout = rowIndex % 3;
            const plantSrc = "/" + PLANT_IMAGES[rowIndex % PLANT_IMAGES.length];
            const plantEl = (
              <div style={{ flexShrink: 0, alignSelf: "flex-end", pointerEvents: "none", transform: "translateY(112px)", position: "relative", zIndex: 10 }}>
                <img src={plantSrc} alt="plant" style={{ width: plantW, height: "auto", display: "block" }} />
              </div>
            );
            const bookEls = row.map((book, i) => {
              const isEdge = i === 0 || i === row.length - 1;
              const w = spineW ? (isEdge ? Math.round(spineW * 0.72) : spineW) : undefined;
              return mediaType === "audiobooks"
                ? <CDCase key={book.isbn || book.title} book={book} index={rowIndex * perRowBooks + i} rowIndex={rowIndex} onClick={setSelectedBook} />
                : <BookSpine key={book.isbn || book.title} book={book} index={rowIndex * perRowBooks + i} rowIndex={rowIndex} onClick={setSelectedBook} spineWidth={w} />;
            });

            // Layout 0: plant LEFT, all books RIGHT
            // Layout 1: 2 books FAR LEFT, plant MIDDLE, 2 books FAR RIGHT
            // Layout 2: all books LEFT, plant FAR RIGHT
            let rowContent;
            const plantGap = 6;
            const rowBase = { display: "flex", alignItems: "flex-end", justifyContent: "center", width: "100%", padding: "20px 8px 0", minHeight: rowMinH, boxSizing: "border-box", gap: plantGap };
            if (layout === 0) {
              rowContent = (
                <div style={rowBase}>
                  {plantEl}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: bookGap, flexShrink: 0 }}>{bookEls}</div>
                </div>
              );
            } else if (layout === 1) {
              const half = Math.floor(bookEls.length / 2);
              rowContent = (
                <div style={rowBase}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: bookGap, flexShrink: 0 }}>{bookEls.slice(0, half)}</div>
                  {plantEl}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: bookGap, flexShrink: 0 }}>{bookEls.slice(half)}</div>
                </div>
              );
            } else {
              rowContent = (
                <div style={rowBase}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: bookGap, flexShrink: 0 }}>{bookEls}</div>
                  {plantEl}
                </div>
              );
            }

            return (
              <div key={rowIndex} style={{ position: "relative" }}>
                {rowContent}
                <img src="/shelf2.jpg" alt="shelf" style={{ width: "100%", height: 22, objectFit: "cover", objectPosition: "center center", display: "block", boxShadow: "0 4px 10px rgba(0,0,0,0.5)", position: "relative", zIndex: 5 }} />
                <div style={{ height: 6, background: "linear-gradient(to bottom, rgba(0,0,0,0.2), transparent)", marginBottom: 8 }} />
              </div>
            );
          });
        })()}
      </div>

      {/* Bottom tab bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(248,241,228,0.97)", borderTop: "1px solid rgba(139,94,60,0.3)",
        display: "flex", justifyContent: "space-around", alignItems: "center",
        padding: "10px 0 calc(10px + env(safe-area-inset-bottom))",
        pointerEvents: "all",
      }}>
        {[
          { icon: "🏠", label: "Home", action: onClose },
          { icon: soundOn ? "🔊" : "🔇", label: "Sound", action: toggleSound, active: soundOn },
          { icon: "📖", label: "My Story", action: onOpenStats },
          { icon: "⚙️", label: "Settings", action: onOpenSettings },
          { icon: "👤", label: "Profile", action: onOpenProfile },
        ].map(({ icon, label, action, active }) => (
          <button key={label} onClick={action}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              color: active ? "#8B2020" : "#5C3A1E",
              fontFamily: "Georgia, serif", fontSize: 10, padding: "4px 8px",
              WebkitTapHighlightColor: "transparent", touchAction: "manipulation",
            }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Book Modal */}
      {selectedBook && (
        <BookModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          favorites={favorites} setFavorites={setFavorites}
          statuses={statuses} setStatuses={setStatuses}
          progress={progress} setProgress={setProgress}
          mediaType={mediaType}
          onBookEdited={(updated) => {
            setSelectedBook(prev => ({ ...prev, ...updated }));
            setRefreshKey(k => k + 1);
          }}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function MobileHomeView({ onGenreClick, mediaType, onToggleMediaType, onOpenSettings, onOpenStats, onOpenProfile }) {
  const [soundOn, setSoundOn] = useState(false);
  const [pickerGenre, setPickerGenre] = useState(null);
  const [botanicalOverrides, setBotanicalOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sk_mobile_botanicals") || "{}"); } catch { return {}; }
  });
  const longPressRef = useRef(null);
  const audioRef = useRef(null);
  const rainCtxRef = useRef(null);
  const rainSourceRef = useRef(null);
  const th = SK_THEMES[localStorage.getItem("sk_theme") || "firelight"] || SK_THEMES.firelight;

  const startRain = async () => {
    if (rainCtxRef.current) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    rainCtxRef.current = ctx;
    const buf = await fetch("/sounds/rain-thunder.ogg").then(r => r.arrayBuffer());
    const decoded = await ctx.decodeAudioData(buf);
    const src = ctx.createBufferSource();
    src.buffer = decoded; src.loop = true;
    const gain = ctx.createGain(); gain.gain.value = 0.85;
    src.connect(gain); gain.connect(ctx.destination);
    src.start(0);
    rainSourceRef.current = src;
  };

  const stopRain = () => {
    try { rainSourceRef.current?.stop(); } catch (_) {}
    rainCtxRef.current?.close();
    rainCtxRef.current = null; rainSourceRef.current = null;
  };

  const saveBotanical = (genre, src) => {
    const next = { ...botanicalOverrides, [genre]: src };
    setBotanicalOverrides(next);
    localStorage.setItem("sk_mobile_botanicals", JSON.stringify(next));
  };

  const startLongPress = (genre) => {
    longPressRef.current = setTimeout(() => setPickerGenre(genre), 500);
  };
  const cancelLongPress = () => {
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
  };

  const DEFAULT_LEFT = [
    { genre: "Fantasy",            image: "/botanicals/fantasy-iridescent-hibiscus.jpg" },
    { genre: "Mystery & Thriller", image: "/botanicals/mystery-red-poppy.jpg" },
    { genre: "Sci-Fi",             image: "/botanicals/scifi-tropical-bloom.jpg" },
    { genre: "Romance",            image: "/botanicals/romance-peach-rose.jpg" },
    { genre: "Self Help",          image: "/botanicals/selfhelp-daisies.png" },
    { genre: "Dark Romance",       image: "/botanicals/dark-romance-black-hibiscus.jpg" },
  ];
  const DEFAULT_RIGHT = [
    { genre: "Fiction",                 image: "/botanicals/fiction-watercolor-bouquet.jpg" },
    { genre: "Historical Fiction",      image: "/botanicals/historical-fiction-watercolor-bouquet.jpg" },
    { genre: "Cookbooks",              image: "/botanicals/cookbooks-rosemary.png" },
    { genre: "Drama",                   image: "/botanicals/drama-blue-hydrangea.png" },
    { genre: "True Crime",             image: "/botanicals/truecrime-purple-dahlia.jpg" },
    { genre: "Gardening & Landscaping", image: "/botanicals/gardening-caladium-leaf.jpg" },
    { genre: "Classics",               image: "/botanicals/historical-fiction-watercolor-bouquet.jpg" },
  ];

  const allGenres = [...DEFAULT_LEFT, ...DEFAULT_RIGHT];
  const bookCount = (() => { try { return JSON.parse(localStorage.getItem("sk_user_books") || "[]").length; } catch { return 0; } })();

  const toggleSound = () => {
    if (soundOn) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.volume = 0.08; }
      stopRain();
      setSoundOn(false);
    } else {
      if (audioRef.current) { audioRef.current.volume = 0.08; audioRef.current.play().catch(() => {}); }
      startRain();
      setSoundOn(true);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#1A110A", overflow: "hidden" }}>
      {/* Full-screen background video */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <video autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "contain", filter: "brightness(1)" }}
          src="/reading-nook.mp4" onError={e => e.target.style.display = "none"} />
        {/* Light vignette only at very top and bottom so video stays visible */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,6,2,0.55) 0%, transparent 30%, transparent 55%, rgba(10,6,2,0.75) 100%)" }} />
        {/* Lamp damper — softens the bright lamp on the left near the bottom */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 20% 15% at 12% 78%, rgba(0,0,0,0.45) 0%, transparent 100%)", pointerEvents: "none" }} />
      </div>

      <audio ref={audioRef} loop src="/sounds/fire.mp3" />

      {/* Floating header */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 2, padding: "48px 20px 12px", textAlign: "center" }}>
        <div style={{ fontFamily: '"Italianno", cursive', fontSize: 52, color: "#F5ECD7", letterSpacing: 2, fontWeight: 400, textShadow: "0 2px 24px rgba(0,0,0,0.95), 0 0 50px rgba(210,150,50,0.35)", lineHeight: 1 }}>
          StoryKeeper
        </div>
        <div style={{ fontFamily: '"Lora", Georgia, serif', fontSize: 13, color: "#E2CFA8", fontStyle: "italic", marginTop: 4, textShadow: "0 1px 8px rgba(0,0,0,0.95)", letterSpacing: "1px" }}>
          Read here. Listen here. Live here.
        </div>
        <div style={{ marginTop: 6, fontFamily: '"Lora", Georgia, serif', fontSize: 11, color: "rgba(200,180,140,0.8)", textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>
          {bookCount.toLocaleString()} books in your library
        </div>

        {/* eBooks / Audiobooks toggle */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
          {["ebooks", "audiobooks"].map(t => (
            <button key={t} onClick={() => { if (mediaType !== t) onToggleMediaType(); }}
              style={{
                padding: "7px 20px", borderRadius: 20, border: "1px solid rgba(201,169,110,0.4)", cursor: "pointer",
                fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 700,
                background: mediaType === t ? "rgba(139,94,60,0.85)" : "rgba(10,6,2,0.5)",
                color: mediaType === t ? "#F8F1E4" : "rgba(248,241,228,0.6)",
                backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
              }}>
              {t === "ebooks" ? "📚 eBooks" : "🎧 Audiobooks"}
            </button>
          ))}
        </div>
      </div>

      {/* Genre strip — pinned above tab bar, horizontally scrollable */}
      <div style={{
        position: "absolute", bottom: "calc(64px + env(safe-area-inset-bottom))", left: 0, right: 0, zIndex: 2,
      }}>
        {/* Label */}
        <div style={{ paddingLeft: 16, marginBottom: 8, fontFamily: "Georgia, serif", fontSize: 11, color: "rgba(201,169,110,0.8)", letterSpacing: 1, textTransform: "uppercase", textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>
          Browse by Genre
        </div>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", paddingLeft: 16, paddingRight: 16, paddingBottom: 8 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {allGenres.map(({ genre, image }) => {
              const img = botanicalOverrides[genre] || image;
              return (
                <div key={genre} style={{ position: "relative", flexShrink: 0 }}>
                  <button
                    onClick={() => onGenreClick(genre)}
                    onTouchStart={() => startLongPress(genre)}
                    onTouchEnd={cancelLongPress}
                    onTouchMove={cancelLongPress}
                    style={{
                      width: 100, height: 100, border: "1px solid rgba(201,169,110,0.35)", cursor: "pointer", borderRadius: 14,
                      overflow: "hidden", padding: 0, display: "block",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.6), 0 0 12px rgba(201,169,110,0.15)",
                      background: img ? `#3D2510 url(${img}) center/${img.endsWith(".png") ? "contain" : "cover"} no-repeat` : "#3D2510",
                      position: "relative",
                    }}>
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to top, rgba(10,5,2,0.88) 0%, rgba(10,5,2,0.15) 60%)",
                    }} />
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 4px 6px",
                      fontFamily: '"Palatino Linotype", Palatino, Georgia, serif', fontSize: 10, fontWeight: 700,
                      color: "#F8F1E4", textAlign: "center", textShadow: "0 1px 6px rgba(0,0,0,0.9)",
                    }}>
                      {genre}
                    </div>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setPickerGenre(genre); }}
                    title="Change image"
                    style={{
                      position: "absolute", top: 4, right: 4, zIndex: 2,
                      background: "rgba(0,0,0,0.55)", border: "1px solid rgba(201,169,110,0.4)",
                      borderRadius: "50%", width: 22, height: 22, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, lineHeight: 1, padding: 0,
                    }}>
                    🎨
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom tab bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(15,8,3,0.96)", borderTop: "1px solid rgba(139,94,60,0.3)",
        display: "flex", justifyContent: "space-around", alignItems: "center",
        padding: "10px 0 calc(10px + env(safe-area-inset-bottom))",
        pointerEvents: "all",
      }}>
        {[
          { icon: "🏠", label: "Home", action: null, active: true },
          { icon: soundOn ? "🔊" : "🔇", label: "Sound", action: toggleSound, active: soundOn },
          { icon: "📖", label: "My Story", action: onOpenStats, active: false },
          { icon: "⚙️", label: "Settings", action: onOpenSettings, active: false },
          { icon: "👤", label: "Profile", action: onOpenProfile, active: false },
        ].map(({ icon, label, action, active }) => (
          <button key={label} onClick={action ?? undefined}
            style={{
              background: "none", border: "none", cursor: action ? "pointer" : "default",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              color: active ? "#C9A96E" : "rgba(200,180,140,0.7)",
              fontFamily: "Georgia, serif", fontSize: 10,
              padding: "4px 8px", WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Botanical Picker Modal */}
      {pickerGenre && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(5,2,0,0.96)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "52px 16px 12px", textAlign: "center" }}>
            <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 20, color: "#F8F1E4", marginBottom: 4 }}>
              Choose Art for {pickerGenre}
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#C9A96E", fontStyle: "italic" }}>
              Tap an image to select it
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {MOBILE_BOTANICAL_POOL.map(({ src, label }) => {
                const current = botanicalOverrides[pickerGenre] || allGenres.find(g => g.genre === pickerGenre)?.image;
                const selected = src === current;
                const thumb = src.includes("/rpx-") ? `/botanicals/thumbs/${src.split("/").pop().replace(/\.png$/, ".jpg")}` : src;
                return (
                  <button key={src}
                    onClick={() => { saveBotanical(pickerGenre, src); setPickerGenre(null); }}
                    style={{
                      padding: 0, border: selected ? "2px solid #C9A96E" : "1px solid rgba(201,169,110,0.2)",
                      borderRadius: 10, overflow: "hidden", aspectRatio: "1/1", cursor: "pointer",
                      background: `#3D2510 url(${thumb}) center/cover no-repeat`,
                      position: "relative",
                    }}>
                    {selected && (
                      <div style={{
                        position: "absolute", top: 4, right: 4, background: "#C9A96E", borderRadius: "50%",
                        width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, color: "#1A110A", fontWeight: 700,
                      }}>✓</div>
                    )}
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
                      padding: "12px 4px 4px", fontSize: 9,
                      fontFamily: "Georgia, serif", color: "#F8F1E4", textAlign: "center",
                    }}>{label}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <button onClick={() => setPickerGenre(null)} style={{
            margin: "12px 16px calc(12px + env(safe-area-inset-bottom))",
            padding: "14px", borderRadius: 12,
            background: "#8B5E3C", color: "#F8F1E4", border: "none", cursor: "pointer",
            fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 16, fontWeight: 700,
          }}>Cancel</button>
        </div>
      )}
    </div>
  );
}

function HomeView({ onGenreClick, mediaType, onToggleMediaType }) {
  const [hovered, setHovered] = useState(null);
  const [soundOn, setSoundOn] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState("");
  const [savedCustom, setSavedCustom] = useState(() => localStorage.getItem("sk_custom_genre") || "");
  const [ctxMenu, setCtxMenu] = useState(null);
  const [renameModal, setRenameModal] = useState(null);
  const [imagePicker, setImagePicker] = useState(null);
  const [addModal, setAddModal] = useState(null);
  const [addGenreName, setAddGenreName] = useState("");
  const [addGenreImg, setAddGenreImg] = useState("");

  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const centerDivRef = useRef(null);
  const animRef = useRef(null);
  const dropsRef = useRef([]);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const handleCustomConfirm = () => {
    const name = customName.trim();
    if (!name) return;
    localStorage.setItem("sk_custom_genre", name);
    setSavedCustom(name);
    setShowCustomInput(false);
    setCustomName("");
    onGenreClick(name);
  };

  const DEFAULT_LEFT = [
    { genre: "Fantasy",            image: "/botanicals/fantasy-iridescent-hibiscus.jpg" },
    { genre: "Mystery & Thriller", image: "/botanicals/mystery-red-poppy.jpg" },
    { genre: "Sci-Fi",             image: "/botanicals/scifi-tropical-bloom.jpg" },
    { genre: "Romance",            image: "/botanicals/romance-peach-rose.jpg" },
    { genre: "Self Help",          image: "/botanicals/selfhelp-daisies.png" },
    { genre: "Dark Romance",       image: "/botanicals/dark-romance-black-hibiscus.jpg" },
  ];
  const DEFAULT_RIGHT = [
    { genre: "Fiction",                 image: "/botanicals/fiction-watercolor-bouquet.jpg" },
    { genre: "Historical Fiction",      image: "/botanicals/historical-fiction-watercolor-bouquet.jpg" },
    { genre: "Cookbooks",              image: "/botanicals/cookbooks-rosemary.png" },
    { genre: "Drama",                   image: "/botanicals/drama-blue-hydrangea.png" },
    { genre: "True Crime",              image: "/botanicals/truecrime-purple-dahlia.jpg" },
    { genre: "Gardening & Landscaping", image: "/botanicals/gardening-caladium-leaf.jpg" },
    { genre: "Classics",                image: "/botanicals/historical-fiction-watercolor-bouquet.jpg" },
    { genre: "_custom",                 image: null },
  ];

  const loadOrder = (key, defaults) => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return defaults;
      const order = JSON.parse(saved);
      return order.map(g => defaults.find(d => d.genre === g)).filter(Boolean);
    } catch { return defaults; }
  };

  const [leftGenres, setLeftGenres] = useState(() => loadOrder("sk_left_order", DEFAULT_LEFT));
  const [rightGenres, setRightGenres] = useState(() => loadOrder("sk_right_order", DEFAULT_RIGHT));

  const handleDragStart = (e, side, index) => {
    dragItem.current = { side, index };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${side}:${index}`);
  };

  const handleDrop = (e, toSide, toIndex) => {
    e.preventDefault();
    const from = dragItem.current;
    if (!from) return;
    if (from.side === toSide && from.index === toIndex) return;

    const reorder = (list, fromIdx, toIdx) => {
      const next = [...list];
      const [item] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, item);
      return next;
    };

    if (from.side === toSide) {
      if (from.side === "left") {
        const next = reorder(leftGenres, from.index, toIndex);
        setLeftGenres(next);
        localStorage.setItem("sk_left_order", JSON.stringify(next.map(g => g.genre)));
      } else {
        const next = reorder(rightGenres, from.index, toIndex);
        setRightGenres(next);
        localStorage.setItem("sk_right_order", JSON.stringify(next.map(g => g.genre)));
      }
    } else {
      const allLeft = [...leftGenres];
      const allRight = [...rightGenres];
      const movingItem = from.side === "left" ? allLeft[from.index] : allRight[from.index];
      if (from.side === "left") allLeft.splice(from.index, 1);
      else allRight.splice(from.index, 1);
      if (toSide === "left") allLeft.splice(toIndex, 0, movingItem);
      else allRight.splice(toIndex, 0, movingItem);
      setLeftGenres(allLeft);
      setRightGenres(allRight);
      localStorage.setItem("sk_left_order", JSON.stringify(allLeft.map(g => g.genre)));
      localStorage.setItem("sk_right_order", JSON.stringify(allRight.map(g => g.genre)));
    }
    dragItem.current = null;
  };

  const ALL_BOTANICALS = [
    { label: "Iridescent Hibiscus",  src: "/botanicals/fantasy-iridescent-hibiscus.jpg" },
    { label: "Red Poppy",            src: "/botanicals/mystery-red-poppy.jpg" },
    { label: "Tropical Bloom",       src: "/botanicals/scifi-tropical-bloom.jpg" },
    { label: "Peach Rose",           src: "/botanicals/romance-peach-rose.jpg" },
    { label: "Daisies",              src: "/botanicals/selfhelp-daisies.png" },
    { label: "Black Hibiscus",       src: "/botanicals/dark-romance-black-hibiscus.jpg" },
    { label: "Watercolor Bouquet",   src: "/botanicals/fiction-watercolor-bouquet.jpg" },
    { label: "Vintage Bouquet",      src: "/botanicals/historical-fiction-watercolor-bouquet.jpg" },
    { label: "Rosemary",             src: "/botanicals/cookbooks-rosemary.png" },
    { label: "Blue Hydrangea",       src: "/botanicals/drama-blue-hydrangea.png" },
    { label: "Purple Dahlia",        src: "/botanicals/truecrime-purple-dahlia.jpg" },
    { label: "Caladium Leaf",        src: "/botanicals/gardening-caladium-leaf.jpg" },
    { label: "Yellow Rose",          src: "/botanicals/rpx-10209439.jpg" },
    { label: "Flowering Cactus",     src: "/botanicals/rpx-2098047.jpg" },
    { label: "White Lily",           src: "/botanicals/rpx-2613484.jpg" },
    { label: "Mixed Bouquet",        src: "/botanicals/rpx-263623.jpg" },
    { label: "Strawberries",         src: "/botanicals/rpx-263717.jpg" },
    { label: "Amaryllis",            src: "/botanicals/rpx-2771351.jpg" },
    { label: "Pansies",              src: "/botanicals/rpx-2771543.jpg" },
    { label: "Sunflower",            src: "/botanicals/rpx-2771544.jpg" },
    { label: "Blue Columbine",       src: "/botanicals/rpx-2772162.jpg" },
    { label: "Pineapple",            src: "/botanicals/rpx-2805512.jpg" },
    { label: "Yellow Roses",         src: "/botanicals/rpx-2869859.jpg" },
    { label: "Lilac",                src: "/botanicals/rpx-2870676.jpg" },
    { label: "Clematis",             src: "/botanicals/rpx-2872051.jpg" },
    { label: "Skull & Flowers",      src: "/botanicals/rpx-2880154.jpg" },
    { label: "Citrus Branch",        src: "/botanicals/rpx-2880305.jpg" },
    { label: "Ranunculus Bouquet",   src: "/botanicals/rpx-2880345.jpg" },
    { label: "Tiger & White Lily",   src: "/botanicals/rpx-2880374.jpg" },
    { label: "Pink Azalea",          src: "/botanicals/rpx-2880380.jpg" },
    { label: "Cherry Blossoms",      src: "/botanicals/rpx-2880457.jpg" },
    { label: "White Poppies",        src: "/botanicals/rpx-2880603.jpg" },
    { label: "Dahlias",              src: "/botanicals/rpx-2880608.jpg" },
    { label: "Victorian Bouquet",    src: "/botanicals/rpx-50881.jpg" },
    { label: "Dichorisandra",        src: "/botanicals/rpx-569504.jpg" },
    { label: "Pelargonium",          src: "/botanicals/rpx-574479.jpg" },
    { label: "Panicum Leaves",       src: "/botanicals/rpx-574635.jpg" },
    { label: "Dark Red Foliage",     src: "/botanicals/rpx-6264355.jpg" },
    { label: "Blue Flower",          src: "/botanicals/rpx-6437436.jpg" },
    { label: "Rosa Damascena",       src: "/botanicals/rpx-6437442.jpg" },
    { label: "Roses & Butterflies",  src: "/botanicals/rpx-6441864.jpg" },
    { label: "Carnations",           src: "/botanicals/rpx-843203.jpg" },
    { label: "Alternanthera",        src: "/botanicals/rpx-8543996.jpg" },
    { label: "Pink Peony",           src: "/botanicals/rpx-15249963.png" },
    { label: "Peonies Bouquet",      src: "/botanicals/rpx-16415935.png" },
    { label: "Colorful Bouquet",     src: "/botanicals/rpx-16666974.png" },
  ];

  const getGenreList = (side) => side === "left" ? leftGenres : rightGenres;
  const setGenreList = (side, list) => {
    if (side === "left") { setLeftGenres(list); localStorage.setItem("sk_left_order", JSON.stringify(list.map(g => g.genre))); }
    else { setRightGenres(list); localStorage.setItem("sk_right_order", JSON.stringify(list.map(g => g.genre))); }
  };

  const handleRename = (side, index, newName) => {
    const list = [...getGenreList(side)];
    list[index] = { ...list[index], genre: newName };
    setGenreList(side, list);
    setRenameModal(null);
  };

  const handleChangeImage = (side, index, newSrc) => {
    const list = [...getGenreList(side)];
    list[index] = { ...list[index], image: newSrc };
    setGenreList(side, list);
    setImagePicker(null);
  };

  const handleMoveToOtherSide = (side, index) => {
    const fromList = [...getGenreList(side)];
    const toSide = side === "left" ? "right" : "left";
    const toList = [...getGenreList(toSide)];
    const [item] = fromList.splice(index, 1);
    toList.push(item);
    setGenreList(side, fromList);
    setGenreList(toSide, toList);
    setCtxMenu(null);
  };

  const handleRemove = (side, index) => {
    const list = [...getGenreList(side)];
    list.splice(index, 1);
    setGenreList(side, list);
    setCtxMenu(null);
  };

  const handleAddGenre = (side, index, position) => {
    setAddModal({ side, index, position });
    setAddGenreName("");
    setAddGenreImg(ALL_BOTANICALS[0].src);
    setCtxMenu(null);
  };

  const confirmAddGenre = () => {
    if (!addGenreName.trim()) return;
    const { side, index, position } = addModal;
    const list = [...getGenreList(side)];
    const insertAt = position === "above" ? index : index + 1;
    list.splice(insertAt, 0, { genre: addGenreName.trim(), image: addGenreImg || ALL_BOTANICALS[0].src });
    setGenreList(side, list);
    setAddModal(null);
    setAddGenreName("");
  };

  // No canvas animation needed — effects are baked into the video
  useEffect(() => {
    return () => {};
  }, []);

  // Inject keyframes into document head (more reliable than <style> in JSX)
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "sk-home-keyframes";
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Italianno&family=Lora:ital@1&display=swap');
    `;
    if (!document.getElementById("sk-home-keyframes")) {
      document.head.appendChild(el);
    }
    return () => { document.getElementById("sk-home-keyframes")?.remove(); };
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try { audioRef.current.rainNode?.stop(); } catch (_) {}
        try { audioRef.current.fireNode?.stop(); } catch (_) {}
        audioRef.current.ctx?.close();
        audioRef.current = null;
      }
    };
  }, []);

  const soundCancelRef = useRef(false);

  const toggleSound = async () => {
    if (soundOn) {
      soundCancelRef.current = true;
      if (audioRef.current) {
        try { audioRef.current.rainNode?.stop(); } catch (_) {}
        try { audioRef.current.fireNode?.stop(); } catch (_) {}
        audioRef.current.ctx?.close();
        audioRef.current = null;
      }
      setSoundOn(false);
      return;
    }

    soundCancelRef.current = false;
    setSoundOn(true);

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const loadBuffer = async (url) => {
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      return ctx.decodeAudioData(arr);
    };

    const [rainBuf, fireBuf] = await Promise.all([
      loadBuffer("/sounds/rain-thunder.ogg"),
      loadBuffer("/sounds/fire.mp3"),
    ]);

    if (soundCancelRef.current) { ctx.close(); return; }

    const rainGain = ctx.createGain(); rainGain.gain.value = 0.85; rainGain.connect(ctx.destination);
    const fireGain = ctx.createGain(); fireGain.gain.value = 0.08; fireGain.connect(ctx.destination);

    const rainNode = ctx.createBufferSource(); rainNode.buffer = rainBuf; rainNode.loop = true; rainNode.connect(rainGain); rainNode.start();
    const fireNode = ctx.createBufferSource(); fireNode.buffer = fireBuf; fireNode.loop = true; fireNode.connect(fireGain); fireNode.start();

    audioRef.current = { ctx, rainNode, fireNode };
  };

  const renderFlowerPanel = (genres, side) => (
    <div style={{
      width: 100,
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-evenly",
      padding: "10px 0",
      paddingLeft: side === "left" ? 20 : 0,
      paddingRight: side === "right" ? 20 : 0,
      background: "rgba(8,4,2,0.72)",
      borderRight: side === "left" ? "1px solid rgba(90,50,20,0.4)" : "none",
      borderLeft: side === "right" ? "1px solid rgba(90,50,20,0.4)" : "none",
      gap: 6,
    }}>
      {genres.map(({ genre, image }, index) => {
        const isCustom = genre === "_custom";
        const label = isCustom ? (savedCustom || "+ Genre") : genre;
        const isHov = hovered === genre;
        return (
          <div
            key={genre}
            draggable
            onDragStart={e => handleDragStart(e, side, index)}
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(e, side, index)}
            onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, side, index, genre, label }); }}
            onClick={() => {
              if (isCustom) {
                if (savedCustom) onGenreClick(savedCustom);
                else setShowCustomInput(true);
              } else {
                onGenreClick(genre);
              }
            }}
            onMouseEnter={() => setHovered(genre)}
            onMouseLeave={() => setHovered(null)}
            title={isCustom && savedCustom ? `Open "${savedCustom}" shelf` : isCustom ? "Create custom genre" : `Open ${genre} shelf`}
            style={{
              cursor: "grab",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              opacity: isHov ? 1 : 0.82,
              transform: isHov ? "scale(1.06)" : "scale(1)",
              transition: "opacity 0.2s, transform 0.2s",
            }}
          >
            {/* Frame */}
            <div style={{
              width: 52,
              height: 58,
              background: "#F5EDD5",
              border: `1px solid ${isHov ? "#C4A870" : "rgba(180,148,90,0.55)"}`,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              position: "relative",
              boxShadow: isHov ? "0 2px 8px rgba(0,0,0,0.5)" : "0 1px 4px rgba(0,0,0,0.35)",
            }}>
              {/* Inner border inset */}
              <div style={{
                position: "absolute", inset: 3,
                border: "1px solid rgba(196,168,112,0.3)",
                borderRadius: 1,
                pointerEvents: "none",
                zIndex: 2,
              }} />
              {image ? (
                <img
                  src={image}
                  alt={label}
                  style={{
                    width: "90%",
                    height: "90%",
                    objectFit: "contain",
                    objectPosition: "center",
                    filter: "sepia(18%) saturate(0.9) brightness(0.95)",
                  }}
                />
              ) : (
                <span style={{ fontSize: 18, opacity: 0.5 }}>✏</span>
              )}
            </div>
            {/* Genre label */}
            <span style={{
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              fontSize: "clamp(7px, 0.7vw, 9px)",
              color: isHov ? "#F5E6C8" : "rgba(220,200,160,0.75)",
              textAlign: "center",
              lineHeight: 1.2,
              maxWidth: 64,
              userSelect: "none",
              textShadow: "0 1px 4px rgba(0,0,0,0.9)",
            }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", background: "#0A0604" }}
        onClick={() => ctxMenu && setCtxMenu(null)}
      >
        {/* LEFT spine panel */}
        {renderFlowerPanel(leftGenres, "left")}

        {/* Center: image + all overlays */}
        <div ref={centerDivRef} style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Inner wrapper constrained to video's 4:3 aspect ratio so overlays track the actual frame */}
          <div style={{ position: "relative", aspectRatio: "4/3", maxWidth: "100%", maxHeight: "100%", width: "100%" }}>
          <video
            autoPlay loop muted playsInline
            style={{ width: "100%", height: "100%", objectFit: "fill", display: "block", filter: "brightness(1)" }}
          >
            <source src="/reading-nook.mp4" type="video/mp4" />
          </video>

          {/* Lamp damper — softens the bright lamp on the left near the bottom */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 20% 15% at 12% 78%, rgba(0,0,0,0.45) 0%, transparent 100%)", pointerEvents: "none", zIndex: 2 }} />

          {/* Dark corner vignette — hides blurry AI spines in lower right */}
          <div style={{
            position: "absolute", right: 0, bottom: 0, width: "30%", height: "35%",
            pointerEvents: "none", zIndex: 2,
            background: "radial-gradient(ellipse at 100% 100%, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 40%, transparent 75%)",
          }} />

          {/* Vignette */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse at 48% 42%, transparent 30%, rgba(0,0,0,0.22) 100%)",
          }} />

          {/* Warm glow — brightens dark wall corner behind chair under title */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2,
            background: "radial-gradient(ellipse at 48% 28%, rgba(200,160,90,0.18) 0%, transparent 50%)",
          }} />






          {/* Title */}
          <div style={{
            position: "absolute", top: "4%", left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center", pointerEvents: "none", zIndex: 3,
            whiteSpace: "nowrap",
          }}>
            <h1 style={{
              fontFamily: '"Italianno", cursive',
              fontSize: "clamp(24px, 3.2vw, 48px)",
              color: "#F5ECD7",
              textShadow: "0 2px 24px rgba(0,0,0,0.95), 0 0 50px rgba(210,150,50,0.35)",
              margin: 0, letterSpacing: "2px", fontWeight: 400,
            }}>
              StoryKeeper
            </h1>
            <p style={{
              fontFamily: '"Lora", Georgia, serif',
              fontSize: "clamp(9px, 0.9vw, 13px)",
              color: "#E2CFA8", margin: "5px 0 0", fontStyle: "italic",
              textShadow: "0 1px 8px rgba(0,0,0,0.95)",
              letterSpacing: "1px",
            }}>
              Read here. Listen here. Live here.
            </p>
          </div>

          {/* Library totals */}
          {(() => {
            const userBooks = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
            const ebooks = userBooks.filter(b => b.mediaType === "ebook" || b.type === "ebooks").length;
            const audiobooks = userBooks.filter(b => b.mediaType === "audiobook" || b.type === "audiobooks").length;
            const total = userBooks.length;
            if (total === 0) return null;
            return (
              <div style={{
                position: "absolute", bottom: "7%", left: "50%",
                transform: "translateX(-50%)",
                fontFamily: '"Palatino Linotype", Palatino, serif',
                fontSize: "clamp(8px, 0.7vw, 11px)",
                color: "rgba(220,200,150,0.7)",
                whiteSpace: "nowrap",
                textAlign: "center",
                pointerEvents: "none",
              }}>
                📚 {ebooks.toLocaleString()} eBooks &nbsp;·&nbsp; 🎧 {audiobooks.toLocaleString()} Audiobooks &nbsp;·&nbsp; {total.toLocaleString()} Total
              </div>
            );
          })()}

          {/* Bottom controls */}
          <div style={{
            position: "absolute", bottom: "3%", left: "50%",
            transform: "translateX(-50%)",
            display: "flex", gap: 10, alignItems: "center",
          }}>
            <button
              onClick={onToggleMediaType}
              style={{
                background: "rgba(20,10,4,0.72)", border: "1px solid #6B4E3270",
                borderRadius: 6, padding: "5px 14px",
                fontFamily: '"Palatino Linotype", Palatino, serif',
                fontSize: "clamp(8px, 0.75vw, 11px)",
                color: "#D8C090BB", cursor: "pointer", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 6,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(40,20,8,0.9)"; e.currentTarget.style.color = "#F0D8A0"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(20,10,4,0.72)"; e.currentTarget.style.color = "#D8C090BB"; }}
            >
              {mediaType === "ebooks" ? "📖 eBooks" : "🎧 Audiobooks"}
            </button>
            <button
              onClick={toggleSound}
              style={{
                background: soundOn ? "rgba(70,35,8,0.88)" : "rgba(20,10,4,0.72)",
                border: "1px solid #6B4E3270",
                borderRadius: 6, padding: "5px 14px",
                fontFamily: '"Palatino Linotype", Palatino, serif',
                fontSize: "clamp(8px, 0.75vw, 11px)",
                color: soundOn ? "#F0D090" : "#D8C090BB",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {soundOn ? "🔊 Sounds On" : "🔇 Sounds Off"}
            </button>
          </div>

          </div>{/* end aspect-ratio inner wrapper */}
        </div>

        {/* RIGHT spine panel */}
        {renderFlowerPanel(rightGenres, "right")}
      </div>

      {/* Custom genre modal */}
      {showCustomInput && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 600,
          background: "rgba(0,0,0,0.65)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#F8F1E4", border: "2px solid #8B5E3C",
            borderRadius: 12, padding: 28, maxWidth: 380, width: "90%",
            textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
          }}>
            <h3 style={{ fontFamily: '"Palatino Linotype", Palatino, serif', color: "#3A2A1A", margin: "0 0 6px" }}>
              Name Your Genre
            </h3>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#6B4E32", margin: "0 0 16px", fontStyle: "italic" }}>
              Create a custom shelf for your collection
            </p>
            <input
              autoFocus
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleCustomConfirm(); if (e.key === "Escape") { setShowCustomInput(false); setCustomName(""); } }}
              placeholder="e.g. Paranormal Romance, WWII Fiction…"
              style={{
                width: "100%", padding: "10px 14px",
                border: "1px solid #8B5E3C", borderRadius: 6,
                fontFamily: "Georgia, serif", fontSize: 14,
                background: "#FFF9F0", color: "#3A2A1A",
                marginBottom: 16, boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => { setShowCustomInput(false); setCustomName(""); }}
                style={{ padding: "8px 20px", background: "#D8C3A5", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, color: "#3A2A1A" }}>
                Cancel
              </button>
              <button
                disabled={!customName.trim()}
                onClick={handleCustomConfirm}
                style={{ padding: "8px 20px", background: customName.trim() ? "#3A2A1A" : "#A08060", border: "none", borderRadius: 6, cursor: customName.trim() ? "pointer" : "default", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, color: "#F8F1E4", fontWeight: 700 }}>
                Open Shelf →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context menu */}
      {ctxMenu && (
        <div
          onMouseLeave={() => setCtxMenu(null)}
          style={{
            position: "fixed", zIndex: 800,
            left: ctxMenu.x + 180 > window.innerWidth ? ctxMenu.x - 180 : ctxMenu.x,
            top: ctxMenu.y + 260 > window.innerHeight ? Math.max(0, ctxMenu.y - 260) : ctxMenu.y,
            background: "#F5EDD5",
            border: "1px solid #C4A870",
            borderRadius: 4,
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            fontFamily: "Georgia, serif",
            fontSize: 12,
            minWidth: 170,
            overflow: "hidden",
          }}
        >
          {[
            { label: `✏ Rename`, action: () => { setRenameModal({ side: ctxMenu.side, index: ctxMenu.index, value: ctxMenu.label }); setCtxMenu(null); } },
            { label: `🌸 Change image`, action: () => { setImagePicker({ side: ctxMenu.side, index: ctxMenu.index }); setCtxMenu(null); } },
            { label: `↔ Move to ${ctxMenu.side === "left" ? "right" : "left"} side`, action: () => handleMoveToOtherSide(ctxMenu.side, ctxMenu.index) },
            { label: `+ Add above`, action: () => handleAddGenre(ctxMenu.side, ctxMenu.index, "above") },
            { label: `+ Add below`, action: () => handleAddGenre(ctxMenu.side, ctxMenu.index, "below") },
            { label: `✕ Remove`, action: () => handleRemove(ctxMenu.side, ctxMenu.index), danger: true },
          ].map(({ label, action, danger }) => (
            <div
              key={label}
              onClick={action}
              style={{
                padding: "8px 14px",
                cursor: "pointer",
                color: danger ? "#8B1A1A" : "#3A2510",
                borderBottom: "1px solid rgba(196,168,112,0.25)",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#EDE0BC"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {label}
            </div>
          ))}
        </div>
      )}

      {/* Rename modal */}
      {renameModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 810, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#F8F1E4", border: "2px solid #8B5E3C", borderRadius: 12, padding: 28, maxWidth: 360, width: "90%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.7)" }}>
            <h3 style={{ fontFamily: '"Palatino Linotype", Palatino, serif', color: "#3A2A1A", margin: "0 0 16px" }}>Rename Genre</h3>
            <input
              autoFocus
              value={renameModal.value}
              onChange={e => setRenameModal({ ...renameModal, value: e.target.value })}
              onKeyDown={e => { if (e.key === "Enter") handleRename(renameModal.side, renameModal.index, renameModal.value); if (e.key === "Escape") setRenameModal(null); }}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #8B5E3C", borderRadius: 6, fontFamily: "Georgia, serif", fontSize: 14, background: "#FFF9F0", color: "#3A2A1A", marginBottom: 16, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setRenameModal(null)} style={{ padding: "8px 20px", background: "#D8C3A5", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 13, color: "#3A2A1A" }}>Cancel</button>
              <button onClick={() => handleRename(renameModal.side, renameModal.index, renameModal.value)} disabled={!renameModal.value.trim()} style={{ padding: "8px 20px", background: renameModal.value.trim() ? "#3A2A1A" : "#A08060", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 13, color: "#F8F1E4" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Image picker modal */}
      {imagePicker && (
        <div style={{ position: "fixed", inset: 0, zIndex: 810, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#F8F1E4", border: "2px solid #8B5E3C", borderRadius: 12, padding: 24, maxWidth: 540, width: "92%", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.7)" }}>
            <h3 style={{ fontFamily: '"Palatino Linotype", Palatino, serif', color: "#3A2A1A", margin: "0 0 16px", textAlign: "center", flexShrink: 0 }}>Choose a Botanical</h3>
            <div style={{ overflowY: "auto", flex: 1, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {ALL_BOTANICALS.map(({ label, src }) => {
                  const thumb = src.includes("/rpx-") ? `/botanicals/thumbs/${src.split("/").pop().replace(/\.png$/, ".jpg")}` : src;
                  return (
                    <div
                      key={src}
                      onClick={() => handleChangeImage(imagePicker.side, imagePicker.index, src)}
                      title={label}
                      style={{ cursor: "pointer", background: "#F5EDD5", border: "1px solid #C4A870", borderRadius: 4, padding: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
                      onMouseEnter={e => e.currentTarget.style.background = "#EDE0BC"}
                      onMouseLeave={e => e.currentTarget.style.background = "#F5EDD5"}
                    >
                      <img src={thumb} alt={label} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 3 }} />
                      <span style={{ fontSize: 9, fontFamily: "Georgia, serif", fontStyle: "italic", color: "#5A3820", textAlign: "center", lineHeight: 1.2 }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <button onClick={() => setImagePicker(null)} style={{ padding: "8px 24px", background: "#D8C3A5", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 13, color: "#3A2A1A" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add genre modal */}
      {addModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 810, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#F8F1E4", border: "2px solid #8B5E3C", borderRadius: 12, padding: 24, maxWidth: 540, width: "92%", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.7)" }}>
            <h3 style={{ fontFamily: '"Palatino Linotype", Palatino, serif', color: "#3A2A1A", margin: "0 0 16px", textAlign: "center", flexShrink: 0 }}>Add New Genre</h3>
            <input autoFocus placeholder="Genre name…" value={addGenreName} onChange={e => setAddGenreName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") confirmAddGenre(); if (e.key === "Escape") setAddModal(null); }} style={{ width: "100%", padding: "10px 14px", border: "1px solid #8B5E3C", borderRadius: 6, fontFamily: "Georgia, serif", fontSize: 14, background: "#FFF9F0", color: "#3A2A1A", marginBottom: 12, boxSizing: "border-box", flexShrink: 0 }} />
            <p style={{ fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: "#6B4E32", margin: "0 0 8px", flexShrink: 0 }}>Choose a botanical:</p>
            <div style={{ overflowY: "auto", flex: 1, marginBottom: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {ALL_BOTANICALS.map(({ label, src }) => {
                  const thumb = src.includes("/rpx-") ? `/botanicals/thumbs/${src.split("/").pop().replace(/\.png$/, ".jpg")}` : src;
                  return (
                    <div key={src} onClick={() => setAddGenreImg(src)} title={label} style={{ cursor: "pointer", background: addGenreImg === src ? "#EDE0BC" : "#F5EDD5", border: `1px solid ${addGenreImg === src ? "#8B5E3C" : "#C4A870"}`, borderRadius: 4, padding: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <img src={thumb} alt={label} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 3 }} />
                      <span style={{ fontSize: 8.5, fontFamily: "Georgia, serif", fontStyle: "italic", color: "#5A3820", textAlign: "center", lineHeight: 1.2 }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexShrink: 0 }}>
              <button onClick={() => setAddModal(null)} style={{ padding: "8px 20px", background: "#D8C3A5", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 13, color: "#3A2A1A" }}>Cancel</button>
              <button onClick={confirmAddGenre} disabled={!addGenreName.trim()} style={{ padding: "8px 20px", background: addGenreName.trim() ? "#3A2A1A" : "#A08060", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 13, color: "#F8F1E4" }}>Add Genre</button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram", emoji: "📸", color: "#E1306C", prefix: "https://instagram.com/", placeholder: "@yourhandle" },
  { id: "tiktok",    label: "TikTok",    emoji: "🎵", color: "#010101", prefix: "https://tiktok.com/@", placeholder: "@yourhandle" },
  { id: "facebook",  label: "Facebook",  emoji: "📘", color: "#1877F2", prefix: "https://facebook.com/", placeholder: "your.name or page" },
  { id: "x_twitter", label: "X",         emoji: "🐦", color: "#14171A", prefix: "https://x.com/", placeholder: "@yourhandle" },
];

function BookOfTheMonthPage({ onClose }) {
  const th = SK_THEMES[localStorage.getItem("sk_theme") || "firelight"] || SK_THEMES.firelight;
  const [botm, setBotm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch("/book-of-the-month.json?t=" + Date.now())
      .then(r => r.json())
      .then(data => { setBotm(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const monthLabel = botm?.month
    ? new Date(botm.month + "-02").toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  const addToTBR = () => {
    if (!botm) return;
    const tbr = (() => { try { return JSON.parse(localStorage.getItem("sk_tbr_books") || "[]"); } catch { return []; } })();
    const already = tbr.some(b => b.title === botm.title);
    if (!already) {
      tbr.push({ title: botm.title, author: botm.author, isbn: botm.isbn || "", cover: botm.cover || null, addedAt: Date.now() });
      localStorage.setItem("sk_tbr_books", JSON.stringify(tbr));
    }
    setAdded(true);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2100,
      backgroundColor: "#F8F1E4",
      backgroundImage: 'url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg")',
      backgroundSize: "cover", backgroundPosition: "center",
      overflowY: "auto", fontFamily: '"Palatino Linotype", Palatino, serif',
    }}>
      <div style={{ maxWidth: 500, margin: "0 auto", padding: "60px 24px 80px" }}>

        <button onClick={onClose} style={{
          background: "none", border: "none", cursor: "pointer", color: "#8B5E3C",
          fontSize: 22, padding: "0 0 0 0", marginBottom: 20, display: "flex", alignItems: "center", gap: 6,
          fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 15, fontWeight: 700,
        }}>‹ Back to Community</button>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#8B5E3C", textTransform: "uppercase", marginBottom: 8 }}>
            📖 Book of the Month
          </div>
          <h1 style={{ fontSize: 26, color: "#3A2A1A", margin: "0 0 4px", fontStyle: "italic" }}>{monthLabel}</h1>
          <div style={{ width: 60, height: 2, background: "#8B5E3C", margin: "12px auto 0" }} />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#8B5E3C", fontSize: 14, padding: 40 }}>Loading...</div>
        ) : !botm ? (
          <div style={{ textAlign: "center", color: "#6B4C2A", fontSize: 14, padding: 40, fontStyle: "italic" }}>No book selected for this month yet. Check back soon!</div>
        ) : (
          <>
            {/* Book cover */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
              <div style={{ position: "relative" }}>
                {botm.cover
                  ? <img src={botm.cover} alt={botm.title} style={{ width: 160, height: 240, objectFit: "cover", borderRadius: 6, boxShadow: "4px 6px 20px rgba(0,0,0,0.35)" }} />
                  : <div style={{ width: 160, height: 240, background: "linear-gradient(135deg, #8B5E3C, #C4A882)", borderRadius: 6, boxShadow: "4px 6px 20px rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, boxSizing: "border-box" }}>
                      <span style={{ color: "#fff", fontSize: 14, textAlign: "center", fontStyle: "italic" }}>{botm.title}</span>
                    </div>
                }
                {botm.genre && (
                  <div style={{ position: "absolute", top: -10, right: -10, background: "#8B5E3C", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>{botm.genre}</div>
                )}
              </div>
            </div>

            {/* Title & author */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, color: "#3A2A1A", margin: "0 0 6px", fontStyle: "italic" }}>{botm.title}</h2>
              <div style={{ fontSize: 15, color: "#6B4C2A" }}>by {botm.author}</div>
            </div>

            {/* Note */}
            {botm.note && (
              <div style={{
                background: "rgba(255,255,255,0.6)", borderRadius: 12, padding: "18px 20px",
                marginBottom: 28, borderLeft: "3px solid #8B5E3C",
                fontSize: 14, color: "#3A2A1A", lineHeight: 1.7, fontStyle: "italic",
              }}>
                "{botm.note}"
              </div>
            )}

            {/* Add to TBR */}
            <button onClick={addToTBR} disabled={added} style={{
              width: "100%", padding: "14px", borderRadius: 10,
              background: added ? "#6B8C5E" : "#8B5E3C", border: "none",
              color: "#fff", fontSize: 15, fontWeight: 700, cursor: added ? "default" : "pointer",
              fontFamily: '"Palatino Linotype", Palatino, serif',
              boxShadow: "0 3px 10px rgba(0,0,0,0.2)", transition: "background 0.2s",
            }}>
              {added ? "✓ Added to Your TBR Shelf!" : "📚 Add to My TBR Shelf"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CommunityPage({ authUser, supabaseRef, onClose, onOpenGroup, onOpenBookClub, onOpenSubscription }) {
  const th = SK_THEMES[localStorage.getItem("sk_theme") || "firelight"] || SK_THEMES.firelight;
  const userTier = localStorage.getItem("sk_user_tier") || "reluctant";
  const canRead = ["storyteller", "librarian", "storykeeper"].includes(userTier);
  const canPost = ["librarian", "storykeeper"].includes(userTier);
  const hasBookClub = ["librarian", "storykeeper"].includes(userTier);
  const canViewCommunity = canRead;
  const [showBotm, setShowBotm] = React.useState(false);

  const [memberCounts, setMemberCounts]   = React.useState({});
  const [socialLinks, setSocialLinks]     = React.useState({ instagram: "", tiktok: "", facebook: "", x_twitter: "" });
  const [socialEditing, setSocialEditing] = React.useState(false);
  const [socialInputs, setSocialInputs]   = React.useState({ instagram: "", tiktok: "", facebook: "", x_twitter: "" });
  const [socialMsg, setSocialMsg]         = React.useState("");

  React.useEffect(() => {
    if (!supabaseRef.current || !authUser) return;
    // Load member counts
    ALL_GENRES.forEach(async (genre) => {
      const { count } = await supabaseRef.current
        .from("group_members").select("*", { count: "exact", head: true }).eq("genre", genre);
      setMemberCounts(prev => ({ ...prev, [genre]: count || 0 }));
    });
    // Load social links
    supabaseRef.current.from("user_social_links").select("*").eq("user_id", authUser.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          const links = { instagram: data.instagram || "", tiktok: data.tiktok || "", facebook: data.facebook || "", x_twitter: data.x_twitter || "" };
          setSocialLinks(links);
          setSocialInputs(links);
        }
      });
    // Check for OAuth success/error in hash
    const hash = window.location.hash;
    if (hash.includes("x_connected=")) {
      const match = hash.match(/x_connected=([^&]+)/);
      if (match) {
        const handle = decodeURIComponent(match[1]);
        setSocialLinks(prev => ({ ...prev, x_twitter: handle }));
        setSocialInputs(prev => ({ ...prev, x_twitter: handle }));
        setSocialMsg("X account connected! ✓");
        setTimeout(() => setSocialMsg(""), 3000);
        window.location.hash = "#community";
      }
    }
    if (hash.includes("x_error=")) {
      setSocialMsg("Could not connect X account. Please try again.");
      window.location.hash = "#community";
    }
  }, [authUser]);

  const handleSaveSocial = async () => {
    if (!authUser || !supabaseRef.current) return;
    const sb = supabaseRef.current;
    const { data: username } = await sb.from("usernames").select("username").eq("user_id", authUser.id).single();
    const payload = {
      user_id: authUser.id,
      username: username?.username || "",
      instagram: socialInputs.instagram.replace(/^@/, "").trim(),
      tiktok: socialInputs.tiktok.replace(/^@/, "").trim(),
      facebook: socialInputs.facebook.trim(),
      x_twitter: socialInputs.x_twitter.replace(/^@/, "").trim(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await sb.from("user_social_links").upsert(payload, { onConflict: "user_id" });
    if (error) { setSocialMsg("Error saving."); return; }
    setSocialLinks({ instagram: payload.instagram, tiktok: payload.tiktok, facebook: payload.facebook, x_twitter: payload.x_twitter });
    setSocialEditing(false);
    setSocialMsg("Saved! ✓");
    setTimeout(() => setSocialMsg(""), 2000);
  };

  const cardStyle = { background: th.bgMuted, border: `1px solid ${th.border}`, borderRadius: 12, padding: 14, marginBottom: 10 };
  const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${th.border}`, background: th.bg, color: th.text, fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 14, boxSizing: "border-box", outline: "none" };
  const btnStyle = (color, text = "#fff") => ({ background: color, border: "none", borderRadius: 8, padding: "8px 18px", color: text, fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif', cursor: "pointer", fontWeight: 600 });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: th.bg, overflowY: "auto", fontFamily: '"Palatino Linotype", Palatino, serif' }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 100px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: th.accent, fontSize: 22, padding: "0 10px 0 0" }}>‹</button>
          <h2 style={{ margin: 0, fontSize: 22, color: th.text, flex: 1 }}>👥 Community</h2>
        </div>
        <p style={{ color: th.textSoft, fontSize: 14, marginBottom: 20, marginLeft: 32 }}>
          Connect with other readers — join genre groups, discuss books, and join monthly book clubs.
        </p>

        {/* Tier notice */}
        {!authUser ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: th.textSoft }}>Sign in to access community features.</div>
          </div>
        ) : !canViewCommunity ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: 24, marginBottom: 20, background: th.accent + "12", borderColor: th.accent + "40" }}>
            <div style={{ fontSize: 14, color: th.text, marginBottom: 8, fontWeight: 600 }}>Upgrade to access Community</div>
            <div style={{ fontSize: 13, color: th.textSoft, marginBottom: 12 }}>The Storyteller plan and above unlocks community discussions. Librarian and StoryKeeper unlock full posting and book clubs.</div>
            <button onClick={onOpenSubscription} style={btnStyle(th.accent)}>View Plans</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ background: canPost ? "#6B8C5E22" : th.bgMuted, border: `1px solid ${canPost ? "#6B8C5E" : th.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 12, color: canPost ? "#3A5C2E" : th.textSoft }}>
              {canPost ? "✓ Full posting access" : "👁 Read-only discussions"}
            </div>
            <div style={{ background: hasBookClub ? "#8C5E6B22" : th.bgMuted, border: `1px solid ${hasBookClub ? "#8C5E6B" : th.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 12, color: hasBookClub ? "#5C2E3A" : th.textSoft }}>
              {hasBookClub ? "✓ Book Clubs included" : "🔒 Book Clubs — Librarian+"}
            </div>
          </div>
        )}

        {/* Social Media Links */}
        {authUser && (
          <div style={{ ...cardStyle, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: th.text, fontSize: 16 }}>🔗 My Social Media</h3>
              {!socialEditing && (
                <button onClick={() => { setSocialEditing(true); setSocialInputs(socialLinks); }} style={btnStyle(th.bgMuted, th.text)}>
                  Edit
                </button>
              )}
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: th.textSoft }}>
              Add your handles so other readers can find and follow you.
            </p>

            {socialEditing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {SOCIAL_PLATFORMS.map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{p.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: th.textSoft, marginBottom: 3 }}>{p.label}</div>
                      {p.id === "x_twitter" ? (
                        socialLinks.x_twitter ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "#14171A", fontSize: 14, fontWeight: 600 }}>@{socialLinks.x_twitter}</span>
                            <button onClick={async () => {
                              await supabaseRef.current.from("user_social_links").upsert({ user_id: authUser.id, x_twitter: "", updated_at: new Date().toISOString() }, { onConflict: "user_id" });
                              setSocialLinks(prev => ({ ...prev, x_twitter: "" }));
                              setSocialInputs(prev => ({ ...prev, x_twitter: "" }));
                            }} style={{ background: "none", border: `1px solid ${th.border}`, borderRadius: 6, padding: "3px 8px", fontSize: 11, color: th.textSoft, cursor: "pointer" }}>Disconnect</button>
                          </div>
                        ) : (
                          <button onClick={() => window.location.href = `/api/oauth/x/start?user_id=${authUser.id}`}
                            style={{ background: "#14171A", border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontWeight: 600 }}>
                            🐦 Connect with X
                          </button>
                        )
                      ) : p.id === "tiktok" ? (
                        socialLinks.tiktok ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "#010101", fontSize: 14, fontWeight: 600 }}>@{socialLinks.tiktok}</span>
                            <button onClick={async () => {
                              await supabaseRef.current.from("user_social_links").upsert({ user_id: authUser.id, tiktok: "", updated_at: new Date().toISOString() }, { onConflict: "user_id" });
                              setSocialLinks(prev => ({ ...prev, tiktok: "" }));
                              setSocialInputs(prev => ({ ...prev, tiktok: "" }));
                            }} style={{ background: "none", border: `1px solid ${th.border}`, borderRadius: 6, padding: "3px 8px", fontSize: 11, color: th.textSoft, cursor: "pointer" }}>Disconnect</button>
                          </div>
                        ) : (
                          <button onClick={() => window.location.href = `/api/oauth/tiktok/start?user_id=${authUser.id}`}
                            style={{ background: "#010101", border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontWeight: 600 }}>
                            🎵 Connect with TikTok
                          </button>
                        )
                      ) : (
                        <input
                          style={inputStyle}
                          placeholder={p.placeholder}
                          value={socialInputs[p.id]}
                          onChange={e => setSocialInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                        />
                      )}
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                  <button onClick={() => setSocialEditing(false)} style={btnStyle(th.bgMuted, th.text)}>Cancel</button>
                  <button onClick={handleSaveSocial} style={btnStyle(th.accent)}>Save</button>
                </div>
                {socialMsg && <div style={{ fontSize: 13, color: socialMsg.includes("Error") || socialMsg.includes("Could not") ? "#c0392b" : "#6B8C5E" }}>{socialMsg}</div>}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SOCIAL_PLATFORMS.map(p => {
                  const handle = socialLinks[p.id];
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{p.emoji}</span>
                      <span style={{ fontSize: 13, color: th.textSoft, width: 72 }}>{p.label}</span>
                      {handle ? (
                        <a href={p.prefix + handle} target="_blank" rel="noopener noreferrer"
                          style={{ color: p.color, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                          @{handle}
                        </a>
                      ) : (
                        <span style={{ color: th.textSoft, fontSize: 13, fontStyle: "italic" }}>Not connected</span>
                      )}
                    </div>
                  );
                })}
                {socialMsg && <div style={{ fontSize: 13, color: "#6B8C5E" }}>{socialMsg}</div>}
              </div>
            )}
          </div>
        )}

        {/* Book of the Month */}
        <div onClick={() => setShowBotm(true)} style={{
          ...cardStyle, marginBottom: 20, cursor: "pointer",
          background: `linear-gradient(135deg, ${th.accent}22, ${th.bgMuted})`,
          border: `1px solid ${th.accent}55`,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ fontSize: 36 }}>📖</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: th.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Book of the Month</div>
            <div style={{ fontSize: 15, color: th.text, fontWeight: 700, fontStyle: "italic" }}>See this month's pick →</div>
            <div style={{ fontSize: 12, color: th.textSoft, marginTop: 2 }}>Add it to your TBR shelf with one tap</div>
          </div>
        </div>

        {showBotm && <BookOfTheMonthPage onClose={() => setShowBotm(false)} />}

        {/* Genre list */}
        <h3 style={{ margin: "0 0 12px", color: th.text, fontSize: 16 }}>Genre Groups & Book Clubs</h3>
        {ALL_GENRES.map(genre => (
          <div key={genre} style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: th.text, fontSize: 15 }}>{genre}</div>
                <div style={{ fontSize: 12, color: th.textSoft, marginTop: 2 }}>
                  {memberCounts[genre] !== undefined ? `${memberCounts[genre]} ${memberCounts[genre] === 1 ? "member" : "members"}` : "…"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => onOpenGroup(genre)} style={{
                  background: "rgba(94,107,140,0.15)", border: "1px solid rgba(94,107,140,0.5)",
                  borderRadius: 20, padding: "6px 12px", color: "#2E3A5C", cursor: "pointer",
                  fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 12, fontWeight: 600,
                }}>👥 Group</button>
                <button onClick={() => onOpenBookClub(genre)} style={{
                  background: "rgba(107,140,94,0.15)", border: "1px solid rgba(107,140,94,0.5)",
                  borderRadius: 20, padding: "6px 12px", color: "#3A5C2E", cursor: "pointer",
                  fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 12, fontWeight: 600,
                }}>📚 Club</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const POST_TYPES = [
  { id: "discussion",  label: "💬 Discussion",          short: "Discussion" },
  { id: "reading",     label: "📖 Currently Reading",    short: "Reading" },
  { id: "finished",    label: "✅ Just Finished",        short: "Finished" },
  { id: "want",        label: "📚 Want to Read",         short: "Want to Read" },
  { id: "seeking",     label: "🙋 Seeking Suggestions",  short: "Seeking" },
  { id: "suggestion",  label: "💡 Book Suggestion",      short: "Suggestion" },
];

function GenreGroupPage({ genre, authUser, supabaseRef, onClose, onOpenSubscription }) {
  const th = SK_THEMES[localStorage.getItem("sk_theme") || "firelight"] || SK_THEMES.firelight;
  const userTier = localStorage.getItem("sk_user_tier") || "reluctant";
  const canRead  = ["storyteller", "librarian", "storykeeper"].includes(userTier);
  const canPost  = ["librarian", "storykeeper"].includes(userTier);

  const [username, setUsername]         = React.useState("");
  const [isMember, setIsMember]         = React.useState(false);
  const [memberCount, setMemberCount]   = React.useState(0);
  const [posts, setPosts]               = React.useState([]);
  const [loading, setLoading]           = React.useState(true);
  const [joining, setJoining]           = React.useState(false);
  const [filterType, setFilterType]     = React.useState("all");
  const [showNewPost, setShowNewPost]   = React.useState(false);
  const [postType, setPostType]         = React.useState("discussion");
  const [postContent, setPostContent]   = React.useState("");
  const [postBook, setPostBook]         = React.useState("");
  const [postAuthor, setPostAuthor]     = React.useState("");
  const [postMsg, setPostMsg]           = React.useState("");
  const [expandedPost, setExpandedPost] = React.useState(null);
  const [comments, setComments]         = React.useState({});
  const [commentText, setCommentText]   = React.useState("");
  const [likedPosts, setLikedPosts]     = React.useState(new Set());
  const [showMembers, setShowMembers]   = React.useState(false);
  const [members, setMembers]           = React.useState([]);
  const [reported, setReported]         = React.useState(new Set());
  const [rulesOpen, setRulesOpen]       = React.useState(false);
  const [showRulesModal, setShowRulesModal] = React.useState(false);
  const [rulesAgreed, setRulesAgreed]   = React.useState(() => !!localStorage.getItem("sk_rules_agreed"));

  const handleReport = async (contentId, contentType, contentText, contentUsername) => {
    if (!authUser) return;
    if (reported.has(contentId)) return;
    await supabaseRef.current.from("reported_content").insert({
      content_id: contentId,
      content_type: contentType,
      content_text: contentText,
      content_username: contentUsername,
      reported_by: authUser.id,
      reporter_username: username,
      context: genre,
      status: "pending",
    });
    setReported(prev => new Set([...prev, contentId]));
  };

  React.useEffect(() => {
    if (!authUser || !supabaseRef.current) return;
    supabaseRef.current.from("usernames").select("username").eq("user_id", authUser.id).single()
      .then(({ data }) => { if (data) setUsername(data.username); });
  }, [authUser]);

  const loadData = React.useCallback(async () => {
    if (!supabaseRef.current) { setLoading(false); return; }
    setLoading(true);
    const sb = supabaseRef.current;

    const [{ count }, { data: postsData }, { data: likesData }] = await Promise.all([
      sb.from("group_members").select("*", { count: "exact", head: true }).eq("genre", genre),
      sb.from("group_posts").select("*").eq("genre", genre).order("created_at", { ascending: false }).limit(60),
      authUser ? sb.from("group_likes").select("post_id").eq("user_id", authUser.id) : { data: [] },
    ]);

    setMemberCount(count || 0);
    setPosts(postsData || []);
    setLikedPosts(new Set((likesData || []).map(l => l.post_id)));

    if (authUser) {
      const { data: mem } = await sb.from("group_members").select("user_id").eq("genre", genre).eq("user_id", authUser.id).maybeSingle();
      setIsMember(!!mem);
    }
    setLoading(false);
  }, [genre, authUser]);

  React.useEffect(() => { loadData(); }, [loadData]);

  const handleJoinLeave = async () => {
    if (!authUser || !username || !canPost) return;
    setJoining(true);
    const sb = supabaseRef.current;
    if (isMember) {
      await sb.from("group_members").delete().eq("genre", genre).eq("user_id", authUser.id);
      setIsMember(false);
      setMemberCount(c => c - 1);
    } else {
      await sb.from("group_members").insert({ genre, user_id: authUser.id, username });
      setIsMember(true);
      setMemberCount(c => c + 1);
    }
    setJoining(false);
  };

  const handlePost = async () => {
    if (!postContent.trim()) { setPostMsg("Please write something."); return; }
    if (!isMember) { setPostMsg("Join the group to post."); return; }
    const text = postContent.trim();
    if (containsBannedWords(text)) { setPostMsg("Your post contains language that isn't allowed. Please revise and try again."); return; }
    const toxic = await checkToxicity(text);
    if (toxic) { setPostMsg("Your post was flagged as potentially harmful. Please revise and try again."); return; }
    const sb = supabaseRef.current;
    const { error } = await sb.from("group_posts").insert({
      genre, user_id: authUser.id, username, post_type: postType,
      content: text,
      book_title: postBook.trim() || null,
      book_author: postAuthor.trim() || null,
    });
    if (error) { setPostMsg("Error posting."); return; }
    setPostContent(""); setPostBook(""); setPostAuthor(""); setPostMsg("");
    setShowNewPost(false);
    loadData();
  };

  const handleLike = async (postId) => {
    if (!authUser || !isMember) return;
    const sb = supabaseRef.current;
    const liked = likedPosts.has(postId);
    if (liked) {
      await sb.from("group_likes").delete().eq("post_id", postId).eq("user_id", authUser.id);
      await sb.from("group_posts").update({ like_count: (posts.find(p => p.id === postId)?.like_count || 1) - 1 }).eq("id", postId);
      setLikedPosts(prev => { const s = new Set(prev); s.delete(postId); return s; });
    } else {
      await sb.from("group_likes").insert({ post_id: postId, user_id: authUser.id });
      await sb.from("group_posts").update({ like_count: (posts.find(p => p.id === postId)?.like_count || 0) + 1 }).eq("id", postId);
      setLikedPosts(prev => new Set([...prev, postId]));
    }
    loadData();
  };

  const loadComments = async (postId) => {
    const { data } = await supabaseRef.current.from("group_comments")
      .select("*").eq("post_id", postId).order("created_at");
    setComments(prev => ({ ...prev, [postId]: data || [] }));
  };

  const toggleComments = (postId) => {
    if (expandedPost === postId) { setExpandedPost(null); return; }
    setExpandedPost(postId);
    loadComments(postId);
  };

  const handleComment = async (postId) => {
    if (!commentText.trim() || !authUser || !isMember) return;
    const text = commentText.trim();
    if (containsBannedWords(text)) { setPostMsg("Your comment contains language that isn't allowed."); return; }
    const toxic = await checkToxicity(text);
    if (toxic) { setPostMsg("Your comment was flagged as potentially harmful. Please revise."); return; }
    await supabaseRef.current.from("group_comments").insert({
      post_id: postId, user_id: authUser.id, username, content: text,
    });
    await supabaseRef.current.from("group_posts")
      .update({ comment_count: (posts.find(p => p.id === postId)?.comment_count || 0) + 1 }).eq("id", postId);
    setCommentText("");
    loadComments(postId);
    loadData();
  };

  const loadMembers = async () => {
    const { data: mems } = await supabaseRef.current.from("group_members").select("username, joined_at").eq("genre", genre).order("joined_at");
    if (mems && mems.length > 0) {
      const usernames = mems.map(m => m.username);
      const { data: socials } = await supabaseRef.current.from("user_social_links").select("username, instagram, tiktok, facebook, x_twitter").in("username", usernames);
      const socialMap = Object.fromEntries((socials || []).map(s => [s.username, s]));
      setMembers(mems.map(m => ({ ...m, socials: socialMap[m.username] || {} })));
    } else {
      setMembers([]);
    }
    setShowMembers(true);
  };

  const filteredPosts = filterType === "all" ? posts : posts.filter(p => p.post_type === filterType);

  const cardStyle = { background: th.bgMuted, border: `1px solid ${th.border}`, borderRadius: 12, padding: 16, marginBottom: 12 };
  const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${th.border}`, background: th.bg, color: th.text, fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 14, boxSizing: "border-box", outline: "none" };
  const btnStyle = (color, text = "#fff") => ({ background: color, border: "none", borderRadius: 8, padding: "9px 20px", color: text, fontSize: 14, fontFamily: '"Palatino Linotype", Palatino, serif', cursor: "pointer", fontWeight: 600 });

  const typeColors = { discussion: "#5E6B8C", reading: "#6B8C5E", finished: "#8C6B5E", want: "#8C5E6B", seeking: "#6B5E8C", suggestion: "#5E8C6B" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: th.bg, overflowY: "auto", fontFamily: '"Palatino Linotype", Palatino, serif' }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 100px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: th.accent, fontSize: 22, padding: "0 10px 0 0" }}>‹</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: th.textSoft, textTransform: "uppercase", letterSpacing: 1 }}>{genre}</div>
            <h2 style={{ margin: 0, fontSize: 22, color: th.text }}>👥 Group</h2>
          </div>
        </div>

        {/* No access — free tier */}
        {!authUser || (!canRead && !canPost) ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <h3 style={{ margin: "0 0 8px", color: th.text, fontSize: 18 }}>Groups are a Paid Feature</h3>
            <p style={{ color: th.textSoft, fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
              Join genre groups, share what you're reading, ask for recommendations, and connect with other readers. Available on all paid plans.
            </p>
            {authUser && <button onClick={onOpenSubscription} style={btnStyle(th.accent)}>Upgrade to Join</button>}
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", color: th.textSoft, padding: 40 }}>Loading...</div>
        ) : (
          <>
            {/* Group info bar */}
            <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 36 }}>📚</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: th.text, fontSize: 16 }}>{genre} Readers</div>
                <button onClick={loadMembers} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: th.textSoft, fontSize: 13 }}>
                  {memberCount} {memberCount === 1 ? "member" : "members"} · View all
                </button>
              </div>
              {canPost && (
                <button onClick={handleJoinLeave} disabled={joining} style={btnStyle(isMember ? th.bgMuted : th.accent, isMember ? th.text : "#fff")}>
                  {joining ? "…" : isMember ? "✓ Joined" : "Join"}
                </button>
              )}
              {!canPost && canRead && (
                <div style={{ fontSize: 12, color: th.textSoft, fontStyle: "italic" }}>Read only</div>
              )}
            </div>

            {/* Community Rules Banner */}
            <div style={{ ...cardStyle, marginBottom: 16, background: `${th.accent}10`, borderColor: `${th.accent}40` }}>
              <button onClick={() => setRulesOpen(v => !v)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: th.accent, fontFamily: '"Palatino Linotype", Palatino, serif' }}>🛡️ Community Rules</span>
                <span style={{ fontSize: 12, color: th.textSoft }}>{rulesOpen ? "▲ Hide" : "▼ Show"}</span>
              </button>
              {rulesOpen && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  {COMMUNITY_RULES.map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{r.emoji}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: th.text }}>{r.title}</div>
                        <div style={{ fontSize: 12, color: th.textSoft, lineHeight: 1.5, marginTop: 2 }}>{r.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Storyteller read-only notice */}
            {canRead && !canPost && (
              <div style={{ ...cardStyle, background: th.accent + "15", borderColor: th.accent + "40", textAlign: "center", padding: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: th.textSoft }}>You can browse this group. <button onClick={onOpenSubscription} style={{ background: "none", border: "none", color: th.accent, cursor: "pointer", fontSize: 13, padding: 0, fontWeight: 600 }}>Upgrade to The Librarian</button> to join and post.</span>
              </div>
            )}

            {/* First-post rules agreement modal */}
            {showRulesModal && (
              <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                <div style={{ background: th.bg, borderRadius: 16, padding: 24, width: "100%", maxWidth: 400, maxHeight: "80vh", overflowY: "auto", fontFamily: '"Palatino Linotype", Palatino, serif', boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: 18, color: th.text, textAlign: "center" }}>🛡️ Community Rules</h3>
                  <p style={{ margin: "0 0 16px", fontSize: 12, color: th.textSoft, textAlign: "center" }}>Please read and agree before posting.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                    {COMMUNITY_RULES.map((r, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: th.bgMuted, borderRadius: 8, padding: "10px 12px" }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{r.emoji}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: th.text }}>{r.title}</div>
                          <div style={{ fontSize: 11, color: th.textSoft, lineHeight: 1.5, marginTop: 2 }}>{r.body}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { localStorage.setItem("sk_rules_agreed", "1"); setRulesAgreed(true); setShowRulesModal(false); setShowNewPost(true); }} style={{ width: "100%", padding: "12px", borderRadius: 10, background: th.accent, border: "none", color: th.bg, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', marginBottom: 8 }}>
                    I Agree — Let Me Post
                  </button>
                  <button onClick={() => setShowRulesModal(false)} style={{ width: "100%", padding: "10px", borderRadius: 10, background: "none", border: `1px solid ${th.border}`, color: th.textSoft, fontSize: 13, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* New Post button */}
            {canPost && isMember && !showNewPost && (
              <button onClick={() => { if (!rulesAgreed) { setShowRulesModal(true); } else { setShowNewPost(true); } }} style={{ ...btnStyle(th.accent), width: "100%", marginBottom: 16, padding: "12px 20px", fontSize: 15 }}>
                + New Post
              </button>
            )}

            {/* New Post form */}
            {showNewPost && (
              <div style={{ ...cardStyle, marginBottom: 16 }}>
                <h3 style={{ margin: "0 0 12px", color: th.text, fontSize: 16 }}>New Post</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {POST_TYPES.map(pt => (
                    <button key={pt.id} onClick={() => setPostType(pt.id)} style={{
                      background: postType === pt.id ? typeColors[pt.id] : th.bgMuted,
                      border: `1px solid ${postType === pt.id ? typeColors[pt.id] : th.border}`,
                      borderRadius: 20, padding: "5px 12px", cursor: "pointer",
                      color: postType === pt.id ? "#fff" : th.textSoft, fontSize: 12,
                      fontFamily: '"Palatino Linotype", Palatino, serif',
                    }}>{pt.label}</button>
                  ))}
                </div>
                {(postType === "reading" || postType === "finished" || postType === "want" || postType === "suggestion") && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input style={{ ...inputStyle, flex: 1 }} placeholder="Book title" value={postBook} onChange={e => setPostBook(e.target.value)} />
                    <input style={{ ...inputStyle, flex: 1 }} placeholder="Author" value={postAuthor} onChange={e => setPostAuthor(e.target.value)} />
                  </div>
                )}
                <textarea
                  placeholder="What's on your mind?"
                  value={postContent} onChange={e => setPostContent(e.target.value)}
                  rows={3} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5, marginBottom: 8 }}
                />
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button onClick={() => setShowNewPost(false)} style={btnStyle(th.bgMuted, th.text)}>Cancel</button>
                  <button onClick={handlePost} style={btnStyle(th.accent)}>Post</button>
                </div>
                {postMsg && <div style={{ fontSize: 13, color: "#c0392b", marginTop: 6 }}>{postMsg}</div>}
              </div>
            )}

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}>
              <button onClick={() => setFilterType("all")} style={{
                background: filterType === "all" ? th.accent : th.bgMuted,
                border: `1px solid ${th.border}`, borderRadius: 20, padding: "5px 14px",
                color: filterType === "all" ? "#fff" : th.textSoft, fontSize: 12, cursor: "pointer",
                fontFamily: '"Palatino Linotype", Palatino, serif', flexShrink: 0,
              }}>All</button>
              {POST_TYPES.map(pt => (
                <button key={pt.id} onClick={() => setFilterType(pt.id)} style={{
                  background: filterType === pt.id ? typeColors[pt.id] : th.bgMuted,
                  border: `1px solid ${th.border}`, borderRadius: 20, padding: "5px 14px",
                  color: filterType === pt.id ? "#fff" : th.textSoft, fontSize: 12, cursor: "pointer",
                  fontFamily: '"Palatino Linotype", Palatino, serif', flexShrink: 0,
                }}>{pt.short}</button>
              ))}
            </div>

            {/* Posts feed */}
            {filteredPosts.length === 0 ? (
              <div style={{ textAlign: "center", color: th.textSoft, fontStyle: "italic", padding: 32 }}>
                {filterType === "all" ? "No posts yet. Be the first!" : `No ${filterType} posts yet.`}
              </div>
            ) : filteredPosts.map(post => {
              const pt = POST_TYPES.find(t => t.id === post.post_type) || POST_TYPES[0];
              const liked = likedPosts.has(post.id);
              return (
                <div key={post.id} style={cardStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ background: typeColors[post.post_type] || th.accent, color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{pt.label}</span>
                    <span style={{ flex: 1 }} />
                    <span style={{ fontSize: 12, color: th.textSoft }}>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  {(post.book_title) && (
                    <div style={{ background: th.bg, borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, color: th.text, fontSize: 14 }}>{post.book_title}</div>
                      {post.book_author && <div style={{ fontSize: 12, color: th.textSoft }}>by {post.book_author}</div>}
                    </div>
                  )}
                  <div style={{ color: th.text, fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>{post.content}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: th.accent, fontSize: 13 }}>@{post.username}</span>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                    <button onClick={() => handleLike(post.id)} style={{
                      background: "none", border: "none", cursor: canPost && isMember ? "pointer" : "default",
                      color: liked ? "#e74c3c" : th.textSoft, fontSize: 13, padding: 0,
                      fontFamily: '"Palatino Linotype", Palatino, serif',
                    }}>
                      {liked ? "❤️" : "🤍"} {post.like_count || 0}
                    </button>
                    <button onClick={() => toggleComments(post.id)} style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: th.textSoft, fontSize: 13, padding: 0,
                      fontFamily: '"Palatino Linotype", Palatino, serif',
                    }}>
                      💬 {post.comment_count || 0} {post.comment_count === 1 ? "comment" : "comments"}
                    </button>
                    {authUser && post.user_id !== authUser.id && (
                      <button onClick={() => handleReport(post.id, "group_post", post.content, post.username)} style={{
                        background: "none", border: "none", cursor: reported.has(post.id) ? "default" : "pointer",
                        color: reported.has(post.id) ? "#6B8C5E" : th.textSoft, fontSize: 12, padding: 0,
                        fontFamily: '"Palatino Linotype", Palatino, serif', marginLeft: "auto",
                      }}>
                        {reported.has(post.id) ? "✓ Reported" : "⚑ Report"}
                      </button>
                    )}
                  </div>

                  {expandedPost === post.id && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${th.border}` }}>
                      {(comments[post.id] || []).map(c => (
                        <div key={c.id} style={{ marginBottom: 10, paddingLeft: 12, borderLeft: `2px solid ${th.border}` }}>
                          <span style={{ fontWeight: 700, color: th.accent, fontSize: 13 }}>@{c.username}</span>
                          <span style={{ fontSize: 11, color: th.textSoft, marginLeft: 6 }}>{new Date(c.created_at).toLocaleDateString()}</span>
                          {authUser && c.user_id !== authUser.id && (
                            <button onClick={() => handleReport(c.id, "group_comment", c.content, c.username)} style={{
                              background: "none", border: "none", cursor: reported.has(c.id) ? "default" : "pointer",
                              color: reported.has(c.id) ? "#6B8C5E" : th.textSoft, fontSize: 11, padding: 0, float: "right",
                              fontFamily: '"Palatino Linotype", Palatino, serif',
                            }}>
                              {reported.has(c.id) ? "✓" : "⚑"}
                            </button>
                          )}
                          <div style={{ color: th.text, fontSize: 13, lineHeight: 1.5, marginTop: 2 }}>{c.content}</div>
                        </div>
                      ))}
                      {canPost && isMember && (
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <input
                            placeholder="Write a comment…"
                            value={commentText} onChange={e => setCommentText(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleComment(post.id); }}
                            style={{ ...inputStyle, flex: 1, padding: "7px 10px", fontSize: 13 }}
                          />
                          <button onClick={() => handleComment(post.id)} style={btnStyle(th.accent)}>Send</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Members modal */}
      {showMembers && (
        <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end" }}>
          <div style={{ background: th.bg, borderRadius: "16px 16px 0 0", padding: 24, width: "100%", maxHeight: "60vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: th.text }}>Members ({memberCount})</h3>
              <button onClick={() => setShowMembers(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: th.textSoft }}>✕</button>
            </div>
            {members.map(m => (
              <div key={m.username} style={{ padding: "10px 0", borderBottom: `1px solid ${th.border}` }}>
                <div style={{ color: th.text, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>@{m.username}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {m.socials?.instagram && <a href={`https://instagram.com/${m.socials.instagram}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#E1306C", textDecoration: "none" }}>📸 @{m.socials.instagram}</a>}
                  {m.socials?.tiktok    && <a href={`https://tiktok.com/@${m.socials.tiktok}`}    target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#010101", textDecoration: "none" }}>🎵 @{m.socials.tiktok}</a>}
                  {m.socials?.facebook  && <a href={`https://facebook.com/${m.socials.facebook}`}  target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#1877F2", textDecoration: "none" }}>📘 {m.socials.facebook}</a>}
                  {m.socials?.x_twitter && <a href={`https://x.com/${m.socials.x_twitter}`}        target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#14171A", textDecoration: "none" }}>🐦 @{m.socials.x_twitter}</a>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BookClubPage({ genre, authUser, supabaseRef, onClose, onOpenSubscription }) {
  const th = SK_THEMES[localStorage.getItem("sk_theme") || "firelight"] || SK_THEMES.firelight;
  const userTier = localStorage.getItem("sk_user_tier") || "reluctant";
  const hasAccess = authUser && ["librarian", "storykeeper"].includes(userTier);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const monthName = monthNames[month - 1];

  const lastSaturday = (() => {
    const d = new Date(year, month, 0);
    while (d.getDay() !== 6) d.setDate(d.getDate() - 1);
    return d.getDate();
  })();
  const basePhase = day <= 10 ? "nominating" : day <= 20 ? "voting" : "reading";
  const currentPhase = day === lastSaturday && day > 20 ? "meeting" : basePhase;

  const meetingUrl = `https://meet.jit.si/StoryKeeper-${genre.replace(/[\s&]/g, "-")}-${year}-${String(month).padStart(2,"0")}`;

  const [session, setSession] = React.useState(null);
  const [nominations, setNominations] = React.useState([]);
  const [myVote, setMyVote] = React.useState(null);
  const [username, setUsername] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [nomTitle, setNomTitle] = React.useState("");
  const [nomAuthor, setNomAuthor] = React.useState("");
  const [nomMsg, setNomMsg] = React.useState("");
  const [posts, setPosts] = React.useState([]);
  const [newPost, setNewPost] = React.useState("");
  const [postMsg, setPostMsg] = React.useState("");
  const [expandedPost, setExpandedPost] = React.useState(null);
  const [postReplies, setPostReplies] = React.useState({});
  const [replyText, setReplyText] = React.useState("");
  const [reportedBC, setReportedBC] = React.useState(new Set());
  const [rulesOpenBC, setRulesOpenBC] = React.useState(false);
  const [showRulesModalBC, setShowRulesModalBC] = React.useState(false);
  const [rulesAgreedBC, setRulesAgreedBC] = React.useState(() => !!localStorage.getItem("sk_rules_agreed"));

  const handleReportBC = async (contentId, contentType, contentText, contentUsername) => {
    if (!authUser || reportedBC.has(contentId)) return;
    await supabaseRef.current.from("reported_content").insert({
      content_id: contentId, content_type: contentType, content_text: contentText,
      content_username: contentUsername, reported_by: authUser.id,
      reporter_username: username, context: genre, status: "pending",
    });
    setReportedBC(prev => new Set([...prev, contentId]));
  };

  React.useEffect(() => {
    if (!authUser || !supabaseRef.current) return;
    supabaseRef.current.from("usernames").select("username").eq("user_id", authUser.id).single()
      .then(({ data }) => { if (data) setUsername(data.username); });
  }, [authUser]);

  const loadData = React.useCallback(async () => {
    if (!supabaseRef.current || !hasAccess) { setLoading(false); return; }
    setLoading(true);
    const sb = supabaseRef.current;

    const meetDate = new Date(year, month - 1, lastSaturday).toISOString().split("T")[0];
    let { data: sess } = await sb.from("book_club_sessions")
      .select("*").eq("genre", genre).eq("year", year).eq("month", month).maybeSingle();
    if (!sess) {
      const { data: newSess } = await sb.from("book_club_sessions")
        .insert({ genre, year, month, status: currentPhase, meeting_date: meetDate })
        .select().single();
      sess = newSess;
    }
    if (sess) {
      setSession(sess);
      const { data: noms } = await sb.from("book_club_nominations")
        .select("*, book_club_votes(user_id)").eq("session_id", sess.id).order("created_at");
      setNominations(noms || []);
      if (authUser) {
        const voted = (noms || []).find(n => (n.book_club_votes || []).some(v => v.user_id === authUser.id));
        setMyVote(voted ? voted.id : null);
      }
    }
    const { data: postsData } = await sb.from("book_club_posts")
      .select("*").eq("genre", genre).order("created_at", { ascending: false }).limit(50);
    setPosts(postsData || []);
    setLoading(false);
  }, [genre, hasAccess, authUser]);

  React.useEffect(() => { loadData(); }, [loadData]);

  const handleNominate = async () => {
    if (!nomTitle.trim()) { setNomMsg("Please enter a book title."); return; }
    if (!authUser) { setNomMsg("Please sign in to nominate."); return; }
    if (!username) { setNomMsg("Please set a username in your profile first."); return; }
    const myNoms = nominations.filter(n => n.user_id === authUser.id);
    if (myNoms.length >= 3) { setNomMsg("You can nominate up to 3 books per month."); return; }
    const { error } = await supabaseRef.current.from("book_club_nominations").insert({
      session_id: session.id, user_id: authUser.id, username,
      book_title: nomTitle.trim(), book_author: nomAuthor.trim() || null,
    });
    if (error) { setNomMsg("Error: " + error.message); return; }
    setNomTitle(""); setNomAuthor(""); setNomMsg("Nominated! ✓");
    loadData();
  };

  const handleVote = async (nomId) => {
    if (!authUser || currentPhase !== "voting") return;
    const sb = supabaseRef.current;
    if (myVote === nomId) {
      await sb.from("book_club_votes").delete().eq("nomination_id", nomId).eq("user_id", authUser.id);
      setMyVote(null);
    } else {
      if (myVote) await sb.from("book_club_votes").delete().eq("nomination_id", myVote).eq("user_id", authUser.id);
      await sb.from("book_club_votes").insert({ nomination_id: nomId, user_id: authUser.id });
      setMyVote(nomId);
    }
    loadData();
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    if (!authUser || !username) { setPostMsg("Sign in and set a username to post."); return; }
    const text = newPost.trim();
    if (containsBannedWords(text)) { setPostMsg("Your post contains language that isn't allowed. Please revise and try again."); return; }
    const toxic = await checkToxicity(text);
    if (toxic) { setPostMsg("Your post was flagged as potentially harmful. Please revise and try again."); return; }
    const { error } = await supabaseRef.current.from("book_club_posts").insert({
      user_id: authUser.id, username, genre, post_type: "discussion", content: text,
    });
    if (error) { setPostMsg("Error posting."); return; }
    setNewPost(""); setPostMsg("");
    loadData();
  };

  const loadReplies = async (postId) => {
    const { data } = await supabaseRef.current.from("book_club_replies")
      .select("*").eq("post_id", postId).order("created_at");
    setPostReplies(prev => ({ ...prev, [postId]: data || [] }));
  };

  const handleReply = async (postId) => {
    if (!replyText.trim() || !authUser || !username) return;
    const text = replyText.trim();
    if (containsBannedWords(text)) { setPostMsg("Your reply contains language that isn't allowed."); return; }
    const toxic = await checkToxicity(text);
    if (toxic) { setPostMsg("Your reply was flagged as potentially harmful. Please revise."); return; }
    await supabaseRef.current.from("book_club_replies").insert({
      post_id: postId, user_id: authUser.id, username, content: text,
    });
    setReplyText("");
    loadReplies(postId);
  };

  const togglePost = (postId) => {
    if (expandedPost === postId) { setExpandedPost(null); return; }
    setExpandedPost(postId);
    loadReplies(postId);
  };

  const winningNom = nominations.length > 0
    ? nominations.reduce((a, b) => (b.book_club_votes?.length || 0) > (a.book_club_votes?.length || 0) ? b : a, nominations[0])
    : null;

  const phaseInfo = {
    nominating: { label: "Nominations Open", emoji: "📝", color: "#6B8C5E", desc: `Nominate a book for ${monthName}'s reading pick. Voting opens on the 11th.` },
    voting:     { label: "Voting Open", emoji: "🗳️", color: "#5E6B8C", desc: `Vote for ${monthName}'s book pick. Voting closes on the 20th.` },
    reading:    { label: "Reading in Progress", emoji: "📖", color: "#8C5E3C", desc: `The group is reading this month's pick. Meeting on the ${lastSaturday}${lastSaturday===1?"st":lastSaturday===2?"nd":lastSaturday===3?"rd":"th"}.` },
    meeting:    { label: "Meeting Day!", emoji: "🎉", color: "#8C5E6B", desc: `Today is ${monthName}'s book club meeting! Join the video call below.` },
  };
  const pi = phaseInfo[currentPhase];

  const cardStyle = { background: th.bgMuted, border: `1px solid ${th.border}`, borderRadius: 12, padding: 16, marginBottom: 12 };
  const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${th.border}`, background: th.bg, color: th.text, fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 14, boxSizing: "border-box", outline: "none" };
  const btnStyle = (color) => ({ background: color, border: "none", borderRadius: 8, padding: "9px 20px", color: "#fff", fontSize: 14, fontFamily: '"Palatino Linotype", Palatino, serif', cursor: "pointer", fontWeight: 600 });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: th.bg, overflowY: "auto", fontFamily: '"Palatino Linotype", Palatino, serif' }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 100px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: th.accent, fontSize: 22, padding: "0 10px 0 0", lineHeight: 1 }}>‹</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: th.textSoft, textTransform: "uppercase", letterSpacing: 1 }}>{genre}</div>
            <h2 style={{ margin: 0, fontSize: 22, color: th.text }}>📚 Book Club</h2>
          </div>
        </div>

        {/* Tier gate */}
        {!hasAccess ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
            <h3 style={{ margin: "0 0 8px", color: th.text, fontSize: 18 }}>
              {!authUser ? "Sign In to Join Book Club" : "Book Club is a Premium Feature"}
            </h3>
            <p style={{ color: th.textSoft, fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
              {!authUser
                ? "You need to be signed in to participate in monthly book picks, voting, and live video discussions."
                : "Monthly book picks, voting, and live video discussions are available on The Librarian and The StoryKeeper plans."}
            </p>
            {authUser && <button onClick={onOpenSubscription} style={btnStyle(th.accent)}>Upgrade to Join</button>}
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", color: th.textSoft, padding: 40 }}>Loading...</div>
        ) : (
          <>
            {/* Phase banner */}
            <div style={{ ...cardStyle, background: pi.color + "22", borderColor: pi.color + "55", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 28 }}>{pi.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, color: pi.color, fontSize: 15 }}>{pi.label}</div>
                  <div style={{ color: th.textSoft, fontSize: 13, marginTop: 2 }}>{pi.desc}</div>
                </div>
              </div>
            </div>

            {/* NOMINATING PHASE */}
            {currentPhase === "nominating" && (
              <div style={cardStyle}>
                <h3 style={{ margin: "0 0 14px", color: th.text, fontSize: 16 }}>📝 Nominate a Book</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input style={inputStyle} placeholder="Book title *" value={nomTitle} onChange={e => setNomTitle(e.target.value)} />
                  <input style={inputStyle} placeholder="Author (optional)" value={nomAuthor} onChange={e => setNomAuthor(e.target.value)} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: th.textSoft }}>{nominations.filter(n => n.user_id === authUser?.id).length}/3 nominations used</span>
                    <button onClick={handleNominate} style={btnStyle(th.accent)}>Nominate</button>
                  </div>
                  {nomMsg && <div style={{ fontSize: 13, color: nomMsg.includes("Error") ? "#c0392b" : "#6B8C5E" }}>{nomMsg}</div>}
                </div>
              </div>
            )}

            {/* Nominations list (nominating + voting phases) */}
            {(currentPhase === "nominating" || currentPhase === "voting") && nominations.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: "0 0 10px", color: th.text, fontSize: 16 }}>
                  {currentPhase === "voting" ? "🗳️ Vote for Your Pick" : "Current Nominations"}
                </h3>
                {nominations.map(nom => {
                  const voteCount = nom.book_club_votes?.length || 0;
                  const isMine = myVote === nom.id;
                  return (
                    <div key={nom.id} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: th.text, fontSize: 15 }}>{nom.book_title}</div>
                        {nom.book_author && <div style={{ fontSize: 13, color: th.textSoft }}>by {nom.book_author}</div>}
                        <div style={{ fontSize: 12, color: th.textSoft, marginTop: 2 }}>Nominated by @{nom.username}</div>
                      </div>
                      {currentPhase === "voting" && (
                        <button onClick={() => handleVote(nom.id)} style={{
                          background: isMine ? th.accent : th.bgMuted,
                          border: `2px solid ${th.accent}`, borderRadius: 20, padding: "6px 14px",
                          color: isMine ? "#fff" : th.accent, fontSize: 13, cursor: "pointer",
                          fontFamily: '"Palatino Linotype", Palatino, serif', fontWeight: 600,
                        }}>
                          {isMine ? "✓ Voted" : "Vote"} · {voteCount}
                        </button>
                      )}
                      {currentPhase === "nominating" && (
                        <div style={{ fontSize: 13, color: th.textSoft }}>{voteCount} {voteCount === 1 ? "vote" : "votes"}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {nominations.length === 0 && currentPhase === "nominating" && (
              <div style={{ textAlign: "center", color: th.textSoft, fontSize: 14, fontStyle: "italic", marginBottom: 16 }}>
                No nominations yet — be the first!
              </div>
            )}

            {/* READING / MEETING PHASE — show this month's pick */}
            {(currentPhase === "reading" || currentPhase === "meeting") && winningNom && (
              <div style={{ ...cardStyle, marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: th.textSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{monthName}'s Pick</div>
                <div style={{ fontWeight: 700, color: th.text, fontSize: 20, marginBottom: 4 }}>{winningNom.book_title}</div>
                {winningNom.book_author && <div style={{ fontSize: 14, color: th.textSoft }}>by {winningNom.book_author}</div>}
                <div style={{ fontSize: 13, color: th.textSoft, marginTop: 4 }}>
                  {winningNom.book_club_votes?.length || 0} votes · Nominated by @{winningNom.username}
                </div>
                {currentPhase === "meeting" && (
                  <button
                    onClick={() => window.open(meetingUrl, "_blank")}
                    style={{ ...btnStyle("#6B8C5E"), marginTop: 16, width: "100%", fontSize: 16, padding: "12px 20px" }}
                  >
                    📹 Join This Month's Meeting
                  </button>
                )}
                {currentPhase === "reading" && (
                  <div style={{ marginTop: 12, fontSize: 13, color: th.textSoft, fontStyle: "italic" }}>
                    Meeting on {monthName} {lastSaturday} — mark your calendar!
                  </div>
                )}
              </div>
            )}

            {(currentPhase === "reading" || currentPhase === "meeting") && !winningNom && (
              <div style={{ ...cardStyle, textAlign: "center", color: th.textSoft, fontStyle: "italic" }}>
                No book was selected this month.
              </div>
            )}

            {/* DISCUSSION */}
            <div style={{ marginTop: 8 }}>
              <h3 style={{ margin: "0 0 12px", color: th.text, fontSize: 16 }}>💬 Club Discussion</h3>

              {/* Community Rules Banner */}
              <div style={{ ...cardStyle, marginBottom: 16, background: `${th.accent}10`, borderColor: `${th.accent}40` }}>
                <button onClick={() => setRulesOpenBC(v => !v)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: th.accent, fontFamily: '"Palatino Linotype", Palatino, serif' }}>🛡️ Community Rules</span>
                  <span style={{ fontSize: 12, color: th.textSoft }}>{rulesOpenBC ? "▲ Hide" : "▼ Show"}</span>
                </button>
                {rulesOpenBC && (
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    {COMMUNITY_RULES.map((r, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{r.emoji}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: th.text }}>{r.title}</div>
                          <div style={{ fontSize: 12, color: th.textSoft, lineHeight: 1.5, marginTop: 2 }}>{r.body}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* First-post rules modal */}
              {showRulesModalBC && (
                <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                  <div style={{ background: th.bg, borderRadius: 16, padding: 24, width: "100%", maxWidth: 400, maxHeight: "80vh", overflowY: "auto", fontFamily: '"Palatino Linotype", Palatino, serif', boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 18, color: th.text, textAlign: "center" }}>🛡️ Community Rules</h3>
                    <p style={{ margin: "0 0 16px", fontSize: 12, color: th.textSoft, textAlign: "center" }}>Please read and agree before posting.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                      {COMMUNITY_RULES.map((r, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: th.bgMuted, borderRadius: 8, padding: "10px 12px" }}>
                          <span style={{ fontSize: 16, flexShrink: 0 }}>{r.emoji}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: th.text }}>{r.title}</div>
                            <div style={{ fontSize: 11, color: th.textSoft, lineHeight: 1.5, marginTop: 2 }}>{r.body}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => { localStorage.setItem("sk_rules_agreed", "1"); setRulesAgreedBC(true); setShowRulesModalBC(false); }} style={{ width: "100%", padding: "12px", borderRadius: 10, background: th.accent, border: "none", color: th.bg, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', marginBottom: 8 }}>
                      I Agree — Let Me Post
                    </button>
                    <button onClick={() => setShowRulesModalBC(false)} style={{ width: "100%", padding: "10px", borderRadius: 10, background: "none", border: `1px solid ${th.border}`, color: th.textSoft, fontSize: 13, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {authUser && username ? (
                <div style={{ ...cardStyle, marginBottom: 16 }}>
                  {!rulesAgreedBC ? (
                    <button onClick={() => setShowRulesModalBC(true)} style={{ width: "100%", padding: "12px", borderRadius: 8, background: th.accent, border: "none", color: th.bg, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif' }}>
                      ✏️ Write a Post — Agree to Rules First
                    </button>
                  ) : (
                    <>
                      <textarea
                        placeholder={`Share your thoughts about ${genre} books…`}
                        value={newPost}
                        onChange={e => setNewPost(e.target.value)}
                        rows={3}
                        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                        <button onClick={handlePost} style={btnStyle(th.accent)}>Post</button>
                      </div>
                      {postMsg && <div style={{ fontSize: 13, color: "#c0392b", marginTop: 4 }}>{postMsg}</div>}
                    </>
                  )}
                </div>
              ) : (
                <div style={{ ...cardStyle, textAlign: "center", color: th.textSoft, fontSize: 14 }}>
                  {!authUser ? "Sign in to join the discussion." : "Set a username in your profile to post."}
                </div>
              )}

              {posts.length === 0 && (
                <div style={{ textAlign: "center", color: th.textSoft, fontSize: 14, fontStyle: "italic", padding: 20 }}>
                  No posts yet. Start the conversation!
                </div>
              )}

              {posts.map(post => (
                <div key={post.id} style={cardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: th.accent, fontSize: 14 }}>@{post.username}</span>
                    <span style={{ fontSize: 12, color: th.textSoft }}>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ color: th.text, fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>{post.content}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => togglePost(post.id)} style={{ background: "none", border: "none", cursor: "pointer", color: th.textSoft, fontSize: 12, padding: 0 }}>
                      {expandedPost === post.id ? "Hide replies" : `Replies (${postReplies[post.id]?.length ?? "…"})`}
                    </button>
                    {authUser && post.user_id !== authUser.id && (
                      <button onClick={() => handleReportBC(post.id, "book_club_post", post.content, post.username)} style={{
                        background: "none", border: "none", cursor: reportedBC.has(post.id) ? "default" : "pointer",
                        color: reportedBC.has(post.id) ? "#6B8C5E" : th.textSoft, fontSize: 12, padding: 0, marginLeft: "auto",
                        fontFamily: '"Palatino Linotype", Palatino, serif',
                      }}>
                        {reportedBC.has(post.id) ? "✓ Reported" : "⚑ Report"}
                      </button>
                    )}
                  </div>

                  {expandedPost === post.id && (
                    <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: `2px solid ${th.border}` }}>
                      {(postReplies[post.id] || []).map(r => (
                        <div key={r.id} style={{ marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, color: th.accent, fontSize: 13 }}>@{r.username}</span>
                          <span style={{ fontSize: 12, color: th.textSoft, marginLeft: 6 }}>{new Date(r.created_at).toLocaleDateString()}</span>
                          {authUser && r.user_id !== authUser.id && (
                            <button onClick={() => handleReportBC(r.id, "book_club_reply", r.content, r.username)} style={{
                              background: "none", border: "none", cursor: reportedBC.has(r.id) ? "default" : "pointer",
                              color: reportedBC.has(r.id) ? "#6B8C5E" : th.textSoft, fontSize: 11, padding: 0, float: "right",
                              fontFamily: '"Palatino Linotype", Palatino, serif',
                            }}>
                              {reportedBC.has(r.id) ? "✓" : "⚑"}
                            </button>
                          )}
                          <div style={{ color: th.text, fontSize: 13, lineHeight: 1.5, marginTop: 2 }}>{r.content}</div>
                        </div>
                      ))}
                      {authUser && username && (
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <input
                            placeholder="Write a reply…"
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            style={{ ...inputStyle, flex: 1, padding: "6px 10px", fontSize: 13 }}
                            onKeyDown={e => { if (e.key === "Enter") { handleReply(post.id); } }}
                          />
                          <button onClick={() => handleReply(post.id)} style={btnStyle(th.accent)}>Reply</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function UserProfileModal({ authUser, supabaseRef, onClose, onSignOut, onOpenSubscription }) {
  const th = SK_THEMES[localStorage.getItem("sk_theme") || "firelight"] || SK_THEMES.firelight;
  const [avatar, setAvatar] = React.useState(() => localStorage.getItem("sk_avatar") || null);
  const [avatarPos, setAvatarPos] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("sk_avatar_pos") || "null") || { x: 50, y: 50 }; } catch { return { x: 50, y: 50 }; }
  });
  const [uploading, setUploading] = React.useState(false);
  const [repositioning, setRepositioning] = React.useState(false);
  const [repoPos, setRepoPos] = React.useState({ x: 50, y: 50 });
  const [showOverlay, setShowOverlay] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const dragRef = React.useRef(null);
  const dragStart = React.useRef(null);
  const [editingUsername, setEditingUsername] = React.useState(false);
  const [usernameInput, setUsernameInput] = React.useState("");
  const [editingPassword, setEditingPassword] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [accountMsg, setAccountMsg] = React.useState("");
  const [bio, setBio] = React.useState(() => authUser?.user_metadata?.bio || "");
  const [editingBio, setEditingBio] = React.useState(false);
  const [bioInput, setBioInput] = React.useState("");
  const [bioMsg, setBioMsg] = React.useState("");
  const [topBooks, setTopBooks] = React.useState(() => {
    try { return JSON.parse(authUser?.user_metadata?.top_books || "null") || []; } catch { return []; }
  });
  const [editingTopBooks, setEditingTopBooks] = React.useState(false);
  const [topBooksInput, setTopBooksInput] = React.useState([]);
  const [topBooksMsg, setTopBooksMsg] = React.useState("");
  const fileRef = React.useRef(null);

  // Book stats
  const stats = React.useMemo(() => {
    const userBooks = (() => { try { return JSON.parse(localStorage.getItem("sk_user_books") || "[]"); } catch { return []; } })();
    const ebooks = userBooks.filter(b => !b.type || b.type === "ebooks" || b.mediaType === "ebook").length;
    const audiobooks = userBooks.filter(b => b.type === "audiobooks" || b.mediaType === "audiobook").length;
    const reading = userBooks.filter(b => b.status === "reading").length;
    const finished = userBooks.filter(b => b.status === "finished" || b.status === "read").length;
    return { total: userBooks.length, ebooks, audiobooks, reading, finished };
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // Resize to max 400x400 for quality while staying manageable
        const maxSize = 400;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setAvatar(dataUrl);
        setRepoPos({ x: 50, y: 50 });
        setRepositioning(true); // open reposition mode
        setUploading(false);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const sb = supabaseRef.current;
      const { data: { session } } = await sb.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not logged in");
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed");
      // Clear all local data
      localStorage.clear();
      await sb.auth.signOut();
      window.location.reload();
    } catch (err) {
      alert("Could not delete account: " + err.message);
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const displayName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || authUser?.email?.split("@")[0] || "Reader";
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9100,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: th.bg, borderRadius: 16, padding: "32px 28px",
        width: Math.min(window.innerWidth - 32, 400),
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 12px 48px rgba(0,0,0,0.6)",
        fontFamily: '"Palatino Linotype", Palatino, serif',
      }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", color: th.accent,
            fontSize: 22, padding: "0 10px 0 0", lineHeight: 1, fontFamily: '"Palatino Linotype", Palatino, serif',
          }}>‹</button>
          <h2 style={{ margin: 0, fontSize: 20, color: th.text, flex: 1, textAlign: "center" }}>My Profile</h2>
          <div style={{ width: 32 }} />
        </div>

        {/* Avatar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
          {repositioning && avatar ? (
            // Drag-to-reposition mode
            <div style={{ width: "100%", marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: th.textSoft, textAlign: "center", marginBottom: 8 }}>Drag to reposition your photo</div>
              <div
                ref={dragRef}
                style={{ width: 160, height: 160, borderRadius: "50%", overflow: "hidden", border: `3px solid ${th.accent}`, margin: "0 auto 12px", cursor: "grab", position: "relative", touchAction: "none" }}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  dragStart.current = { px: e.clientX, py: e.clientY, ox: repoPos.x, oy: repoPos.y };
                }}
                onPointerMove={(e) => {
                  if (!dragStart.current) return;
                  const dx = (e.clientX - dragStart.current.px) / 1.6;
                  const dy = (e.clientY - dragStart.current.py) / 1.6;
                  setRepoPos({
                    x: Math.max(0, Math.min(100, dragStart.current.ox - dx)),
                    y: Math.max(0, Math.min(100, dragStart.current.oy - dy)),
                  });
                }}
                onPointerUp={() => { dragStart.current = null; }}
              >
                <img src={avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${repoPos.x}% ${repoPos.y}%`, pointerEvents: "none", userSelect: "none" }} />
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button onClick={() => { setRepositioning(false); setAvatar(localStorage.getItem("sk_avatar") || null); }} style={{ padding: "8px 20px", borderRadius: 8, background: "none", border: `1px solid ${th.border}`, color: th.textSoft, cursor: "pointer", fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif' }}>Cancel</button>
                <button onClick={() => {
                  const pos = repoPos;
                  try { localStorage.setItem("sk_avatar", avatar); localStorage.setItem("sk_avatar_pos", JSON.stringify(pos)); } catch {}
                  setAvatarPos(pos);
                  setRepositioning(false);
                }} style={{ padding: "8px 20px", borderRadius: 8, background: th.accent, border: "none", color: th.bg, cursor: "pointer", fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif' }}>Save Position</button>
              </div>
            </div>
          ) : (
            // Normal avatar display
            <div
              onClick={() => setShowOverlay(v => !v)}
              style={{ width: 90, height: 90, borderRadius: "50%", cursor: "pointer", overflow: "hidden", border: `3px solid ${th.accent}`, background: th.bgMuted, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, position: "relative" }}
            >
              {avatar
                ? <img src={avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${avatarPos.x}% ${avatarPos.y}%` }} />
                : <span style={{ fontSize: 32, color: th.accent, fontWeight: 700 }}>{initials}</span>
              }
              {showOverlay && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <button onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); setShowOverlay(false); }} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: 6, padding: "3px 8px", fontSize: 10, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif' }}>📷 Change</button>
                  {avatar && <button onClick={(e) => { e.stopPropagation(); setRepoPos(avatarPos); setRepositioning(true); setShowOverlay(false); }} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: 6, padding: "3px 8px", fontSize: 10, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif' }}>↕ Reposition</button>}
                </div>
              )}
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
          <div style={{ fontSize: 20, fontWeight: 700, color: th.text, marginBottom: 2 }}>{displayName}</div>
          <div style={{ fontSize: 13, color: th.textSoft }}>{authUser?.email}</div>
          {!repositioning && <div style={{ fontSize: 11, color: th.textSoft, marginTop: 4, fontStyle: "italic" }}>Tap photo to edit</div>}
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: th.textSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>My Bio</div>
          {editingBio ? (
            <div>
              <textarea
                value={bioInput}
                onChange={e => { if (e.target.value.length <= 300) setBioInput(e.target.value); }}
                placeholder="Tell other readers a little about yourself..."
                style={{
                  width: "100%", boxSizing: "border-box", minHeight: 100, borderRadius: 8,
                  border: `1px solid ${th.border}`, background: th.bgMuted, color: th.text,
                  fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif',
                  padding: "10px 12px", resize: "vertical", outline: "none",
                }}
              />
              <div style={{ fontSize: 11, color: th.textSoft, textAlign: "right", marginBottom: 8 }}>{bioInput.length}/300</div>
              {bioMsg && <div style={{ fontSize: 12, color: th.accent, marginBottom: 8 }}>{bioMsg}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setEditingBio(false); setBioMsg(""); }} style={{ flex: 1, padding: "9px", borderRadius: 8, background: "none", border: `1px solid ${th.border}`, color: th.textSoft, cursor: "pointer", fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif' }}>Cancel</button>
                <button onClick={async () => {
                  const { error } = await supabaseRef.current.auth.updateUser({ data: { bio: bioInput } });
                  if (error) { setBioMsg("Could not save. Try again."); return; }
                  setBio(bioInput);
                  setEditingBio(false);
                  setBioMsg("");
                }} style={{ flex: 1, padding: "9px", borderRadius: 8, background: th.accent, border: "none", color: th.bg, cursor: "pointer", fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif' }}>Save</button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => { setBioInput(bio); setEditingBio(true); setBioMsg(""); }}
              style={{ background: th.bgMuted, borderRadius: 8, padding: "12px 14px", fontSize: 13, color: bio ? th.text : th.textSoft, fontStyle: bio ? "normal" : "italic", cursor: "pointer", minHeight: 48, lineHeight: 1.6 }}
            >
              {bio || "Tap to add a bio..."}
            </div>
          )}
        </div>

        {/* Top Books */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: th.textSoft, textTransform: "uppercase", letterSpacing: 1 }}>My Top Books</div>
            {!editingTopBooks && (
              <button onClick={() => { setTopBooksInput(topBooks.length ? [...topBooks] : [{ title: "", author: "" }]); setEditingTopBooks(true); setTopBooksMsg(""); }}
                style={{ background: "none", border: `1px solid ${th.border}`, borderRadius: 6, padding: "3px 10px", fontSize: 11, color: th.textSoft, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif' }}>
                {topBooks.length ? "Edit" : "+ Add"}
              </button>
            )}
          </div>
          {editingTopBooks ? (
            <div>
              {topBooksInput.map((book, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: th.accent, fontWeight: 700, width: 18, textAlign: "center", flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    <input
                      value={book.title}
                      onChange={e => { const b = [...topBooksInput]; b[i] = { ...b[i], title: e.target.value }; setTopBooksInput(b); }}
                      placeholder="Book title"
                      style={{ width: "100%", boxSizing: "border-box", padding: "6px 10px", borderRadius: 6, border: `1px solid ${th.border}`, background: th.bgMuted, color: th.text, fontSize: 12, fontFamily: '"Palatino Linotype", Palatino, serif', outline: "none" }}
                    />
                    <input
                      value={book.author}
                      onChange={e => { const b = [...topBooksInput]; b[i] = { ...b[i], author: e.target.value }; setTopBooksInput(b); }}
                      placeholder="Author"
                      style={{ width: "100%", boxSizing: "border-box", padding: "6px 10px", borderRadius: 6, border: `1px solid ${th.border}`, background: th.bgMuted, color: th.text, fontSize: 12, fontFamily: '"Palatino Linotype", Palatino, serif', outline: "none" }}
                    />
                  </div>
                  <button onClick={() => { const b = topBooksInput.filter((_, j) => j !== i); setTopBooksInput(b); }}
                    style={{ background: "none", border: "none", color: th.textSoft, cursor: "pointer", fontSize: 16, padding: "0 4px", flexShrink: 0 }}>×</button>
                </div>
              ))}
              {topBooksInput.length < 10 && (
                <button onClick={() => setTopBooksInput([...topBooksInput, { title: "", author: "" }])}
                  style={{ width: "100%", padding: "8px", borderRadius: 8, background: "none", border: `1px dashed ${th.border}`, color: th.textSoft, cursor: "pointer", fontSize: 12, fontFamily: '"Palatino Linotype", Palatino, serif', marginBottom: 10 }}>
                  + Add another book
                </button>
              )}
              {topBooksMsg && <div style={{ fontSize: 12, color: th.accent, marginBottom: 8 }}>{topBooksMsg}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setEditingTopBooks(false); setTopBooksMsg(""); }}
                  style={{ flex: 1, padding: "9px", borderRadius: 8, background: "none", border: `1px solid ${th.border}`, color: th.textSoft, cursor: "pointer", fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif' }}>Cancel</button>
                <button onClick={async () => {
                  const filtered = topBooksInput.filter(b => b.title.trim());
                  const { error } = await supabaseRef.current.auth.updateUser({ data: { top_books: JSON.stringify(filtered) } });
                  if (error) { setTopBooksMsg("Could not save. Try again."); return; }
                  setTopBooks(filtered);
                  setEditingTopBooks(false);
                  setTopBooksMsg("");
                }} style={{ flex: 1, padding: "9px", borderRadius: 8, background: th.accent, border: "none", color: th.bg, cursor: "pointer", fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif' }}>Save</button>
              </div>
            </div>
          ) : topBooks.length ? (
            <div style={{ background: th.bgMuted, borderRadius: 8, overflow: "hidden" }}>
              {topBooks.map((book, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: i < topBooks.length - 1 ? `1px solid ${th.border}` : "none" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: th.accent, width: 18, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: th.text, fontWeight: 600 }}>{book.title}</div>
                    {book.author && <div style={{ fontSize: 11, color: th.textSoft }}>{book.author}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: th.bgMuted, borderRadius: 8, padding: "12px 14px", fontSize: 13, color: th.textSoft, fontStyle: "italic" }}>
              Tap "+ Add" to create your top books list.
            </div>
          )}
        </div>

        {/* Book Stats */}
        <div style={{ marginBottom: 24, background: th.bgMuted, borderRadius: 12, padding: "16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: th.textSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>My Library</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "Total", value: stats.total },
              { label: "eBooks", value: stats.ebooks },
              { label: "Audiobooks", value: stats.audiobooks },
              { label: "Reading", value: stats.reading },
              { label: "Finished", value: stats.finished },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: "center", background: th.bg, borderRadius: 8, padding: "10px 4px" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: th.accent }}>{value}</div>
                <div style={{ fontSize: 11, color: th.textSoft }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: th.textSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Subscription</div>
          <div style={{
            background: th.bgMuted, borderRadius: 10, padding: "12px 16px",
            display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8,
          }}>
            <div>
              <div style={{ fontSize: 14, color: th.text, fontWeight: 700 }}>The Reluctant Reader</div>
              <div style={{ fontSize: 12, color: th.textSoft }}>Free plan</div>
            </div>
            <span style={{ fontSize: 18 }}>📖</span>
          </div>
          <button onClick={() => { onClose(); onOpenSubscription(); }} style={{
            width: "100%", padding: "10px", borderRadius: 8,
            background: th.accent, border: "none", color: th.bg,
            cursor: "pointer", fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif',
            marginBottom: 8,
          }}>Upgrade Plan</button>
          <button onClick={() => window.open("https://billing.stripe.com/p/login/test_00000000", "_blank")} style={{
            width: "100%", padding: "10px", borderRadius: 8,
            background: th.bgMuted, border: `1px solid ${th.border}`, color: th.text,
            cursor: "pointer", fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif',
          }}>Manage Subscription</button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 13 }}>🔒</span>
            <span style={{ fontSize: 11, color: th.textSoft }}>Payments are secure and encrypted via Stripe.</span>
          </div>
        </div>

        {/* Account Actions */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: th.textSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Account</div>

          {/* Email */}
          <div style={{ background: th.bgMuted, borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontSize: 13, color: th.textSoft }}>
            <span style={{ fontWeight: 700, color: th.text }}>Email: </span>{authUser?.email}
          </div>

          {/* Update Username */}
          {!editingUsername ? (
            <button onClick={() => { setUsernameInput(authUser?.user_metadata?.full_name || ""); setEditingUsername(true); setAccountMsg(""); }} style={{
              width: "100%", padding: "10px", borderRadius: 8, marginBottom: 8,
              background: th.bgMuted, border: `1px solid ${th.border}`, color: th.text,
              cursor: "pointer", fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif', textAlign: "left",
            }}>✏️ Update Username</button>
          ) : (
            <div style={{ marginBottom: 8, background: th.bgMuted, borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12, color: th.textSoft, marginBottom: 6 }}>New username</div>
              <input value={usernameInput} onChange={e => setUsernameInput(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${th.border}`, background: th.bg, color: th.text, fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif', boxSizing: "border-box", marginBottom: 8 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setEditingUsername(false)} style={{ flex: 1, padding: "8px", borderRadius: 6, background: "none", border: `1px solid ${th.border}`, color: th.textSoft, cursor: "pointer", fontSize: 12, fontFamily: '"Palatino Linotype", Palatino, serif' }}>Cancel</button>
                <button onClick={async () => {
                  const sb = supabaseRef.current;
                  if (!sb) return;
                  const trimmed = usernameInput.trim();
                  if (!trimmed) { setAccountMsg("Username cannot be empty."); return; }
                  // Check uniqueness in usernames table
                  const { data: existing } = await sb.from("usernames").select("user_id").eq("username", trimmed.toLowerCase()).single();
                  if (existing && existing.user_id !== authUser.id) {
                    setAccountMsg("That username is already taken."); return;
                  }
                  // Release old username entry if any, reserve new one
                  await sb.from("usernames").delete().eq("user_id", authUser.id);
                  await sb.from("usernames").insert({ username: trimmed.toLowerCase(), user_id: authUser.id });
                  const { error } = await sb.auth.updateUser({ data: { full_name: trimmed } });
                  if (error) setAccountMsg("Error: " + error.message);
                  else { setAccountMsg("Username updated!"); setEditingUsername(false); }
                }} style={{ flex: 1, padding: "8px", borderRadius: 6, background: th.accent, border: "none", color: th.bg, cursor: "pointer", fontSize: 12, fontFamily: '"Palatino Linotype", Palatino, serif' }}>Save</button>
              </div>
            </div>
          )}

          {/* Update Password */}
          {!editingPassword ? (
            <button onClick={() => { setEditingPassword(true); setNewPassword(""); setConfirmPassword(""); setAccountMsg(""); }} style={{
              width: "100%", padding: "10px", borderRadius: 8, marginBottom: 8,
              background: th.bgMuted, border: `1px solid ${th.border}`, color: th.text,
              cursor: "pointer", fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif', textAlign: "left",
            }}>🔒 Update Password</button>
          ) : (
            <div style={{ marginBottom: 8, background: th.bgMuted, borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12, color: th.textSoft, marginBottom: 6 }}>New password</div>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${th.border}`, background: th.bg, color: th.text, fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif', boxSizing: "border-box", marginBottom: 6 }} />
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${th.border}`, background: th.bg, color: th.text, fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif', boxSizing: "border-box", marginBottom: 8 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setEditingPassword(false)} style={{ flex: 1, padding: "8px", borderRadius: 6, background: "none", border: `1px solid ${th.border}`, color: th.textSoft, cursor: "pointer", fontSize: 12, fontFamily: '"Palatino Linotype", Palatino, serif' }}>Cancel</button>
                <button onClick={async () => {
                  if (newPassword !== confirmPassword) { setAccountMsg("Passwords don't match."); return; }
                  if (newPassword.length < 6) { setAccountMsg("Password must be at least 6 characters."); return; }
                  const sb = supabaseRef.current;
                  if (!sb) return;
                  const { error } = await sb.auth.updateUser({ password: newPassword });
                  if (error) setAccountMsg("Error: " + error.message);
                  else { setAccountMsg("Password updated!"); setEditingPassword(false); setNewPassword(""); setConfirmPassword(""); }
                }} style={{ flex: 1, padding: "8px", borderRadius: 6, background: th.accent, border: "none", color: th.bg, cursor: "pointer", fontSize: 12, fontFamily: '"Palatino Linotype", Palatino, serif' }}>Save</button>
              </div>
            </div>
          )}

          {accountMsg && <div style={{ fontSize: 12, color: accountMsg.startsWith("Error") ? "#8B2A2A" : "#2d6a2d", marginBottom: 8, padding: "6px 10px", background: accountMsg.startsWith("Error") ? "#FFF0F0" : "#F0FFF0", borderRadius: 6 }}>{accountMsg}</div>}

          <button onClick={() => { onSignOut(); onClose(); }} style={{
            width: "100%", padding: "10px", borderRadius: 8, marginBottom: 8,
            background: th.bgMuted, border: `1px solid ${th.border}`, color: th.text,
            cursor: "pointer", fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif',
          }}>🚪 Sign Out</button>

          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)} style={{
              width: "100%", padding: "10px", borderRadius: 8,
              background: "#F5E0E0", border: "1px solid #D4A0A0", color: "#8B2A2A",
              cursor: "pointer", fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif',
            }}>Delete Account</button>
          ) : (
            <div style={{ background: "#FFF0F0", border: "1px solid #D4A0A0", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, color: "#8B2A2A", marginBottom: 10, fontWeight: 700 }}>Are you sure?</div>
              <div style={{ fontSize: 12, color: "#8B4A4A", marginBottom: 12, lineHeight: 1.5 }}>
                This permanently deletes your account and all library data. This cannot be undone.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setDeleteConfirm(false)} style={{
                  flex: 1, padding: "9px", borderRadius: 8,
                  background: th.bgMuted, border: `1px solid ${th.border}`, color: th.text,
                  cursor: "pointer", fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif',
                }}>Cancel</button>
                <button onClick={handleDeleteAccount} disabled={deleting} style={{
                  flex: 1, padding: "9px", borderRadius: 8,
                  background: "#C0392B", border: "none", color: "#fff",
                  cursor: deleting ? "wait" : "pointer", fontSize: 13,
                  fontFamily: '"Palatino Linotype", Palatino, serif', opacity: deleting ? 0.6 : 1,
                }}>{deleting ? "Deleting..." : "Yes, Delete"}</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign: "center" }}>
          <button onClick={onClose} style={{
            background: th.bgMuted, border: `1px solid ${th.border}`, borderRadius: 8,
            padding: "9px 28px", color: th.text, fontSize: 14,
            fontFamily: '"Palatino Linotype", Palatino, serif', cursor: "pointer",
          }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ authUser, supabaseRef, onClose }) {
  const th = SK_THEMES[localStorage.getItem("sk_theme") || "firelight"] || SK_THEMES.firelight;
  const [reports, setReports] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("pending");
  const [actionMsg, setActionMsg] = React.useState("");

  const loadReports = async () => {
    setLoading(true);
    const { data } = await supabaseRef.current
      .from("reported_content")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setReports(data || []);
    setLoading(false);
  };

  React.useEffect(() => { loadReports(); }, []);

  const updateStatus = async (id, status) => {
    await supabaseRef.current.from("reported_content").update({ status, resolved_at: new Date().toISOString() }).eq("id", id);
    setActionMsg(`Marked as ${status}.`);
    setTimeout(() => setActionMsg(""), 2000);
    loadReports();
  };

  const deletePost = async (report) => {
    const tableMap = {
      group_post: "group_posts",
      group_comment: "group_comments",
      book_club_post: "book_club_posts",
      book_club_reply: "book_club_replies",
    };
    const table = tableMap[report.content_type];
    if (table) await supabaseRef.current.from(table).delete().eq("id", report.content_id);
    await updateStatus(report.id, "deleted");
  };

  const filtered = reports.filter(r => activeTab === "all" || r.status === activeTab);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: th.bg, overflowY: "auto", fontFamily: '"Palatino Linotype", Palatino, serif' }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: th.accent, fontSize: 22, padding: "0 10px 0 0" }}>‹</button>
          <h2 style={{ margin: 0, fontSize: 22, color: th.text }}>🛡️ Admin — Moderation Dashboard</h2>
        </div>

        {actionMsg && <div style={{ background: "#6B8C5E22", border: "1px solid #6B8C5E", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#3A5C2E" }}>{actionMsg}</div>}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["pending", "dismissed", "deleted", "all"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "7px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontWeight: 600,
              fontFamily: '"Palatino Linotype", Palatino, serif', textTransform: "capitalize",
              background: activeTab === tab ? th.accent : th.bgMuted,
              color: activeTab === tab ? th.bg : th.textSoft,
              border: `1px solid ${activeTab === tab ? th.accent : th.border}`,
            }}>{tab} {tab !== "all" && `(${reports.filter(r => r.status === tab).length})`}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: th.textSoft }}>Loading reports...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: th.textSoft, fontStyle: "italic" }}>No {activeTab} reports.</div>
        ) : (
          filtered.map(r => (
            <div key={r.id} style={{ background: th.bgMuted, border: `1px solid ${r.status === "pending" ? "#C4803C" : th.border}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: th.accent, textTransform: "uppercase", letterSpacing: 1 }}>{r.content_type?.replace(/_/g, " ")}</span>
                  <span style={{ fontSize: 11, color: th.textSoft, marginLeft: 10 }}>{r.context}</span>
                </div>
                <span style={{ fontSize: 11, color: th.textSoft }}>{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <div style={{ background: th.bg, borderRadius: 8, padding: "10px 12px", marginBottom: 10, fontSize: 13, color: th.text, lineHeight: 1.6, borderLeft: "3px solid #C4803C" }}>
                "{r.content_text}"
              </div>
              <div style={{ fontSize: 12, color: th.textSoft, marginBottom: 12 }}>
                Posted by <strong>@{r.content_username}</strong> · Reported by <strong>@{r.reporter_username}</strong>
              </div>
              {r.status === "pending" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => deletePost(r)} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "#8C3A3A", border: "none", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontWeight: 600 }}>
                    🗑 Delete Post
                  </button>
                  <button onClick={() => updateStatus(r.id, "dismissed")} style={{ flex: 1, padding: "8px", borderRadius: 8, background: th.bg, border: `1px solid ${th.border}`, color: th.textSoft, fontSize: 12, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif' }}>
                    Dismiss
                  </button>
                </div>
              )}
              {r.status !== "pending" && (
                <div style={{ fontSize: 11, color: th.textSoft, fontStyle: "italic" }}>
                  {r.status === "deleted" ? "✓ Post deleted" : "✓ Dismissed"} · {r.resolved_at ? new Date(r.resolved_at).toLocaleDateString() : ""}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [showHome, setShowHome] = useState(() => {
    const h = window.location.hash || localStorage.getItem("sk_last_hash") || "";
    if (h && h !== "#") return false;
    const saved = localStorage.getItem("sk_current_page");
    if (saved && saved !== "home") return false;
    return true;
  });
  const [genre, setGenre] = useState(() => {
    const h = window.location.hash || localStorage.getItem("sk_last_hash") || "";
    if (h.startsWith("#genre=")) return decodeURIComponent(h.slice(7));
    const saved = localStorage.getItem("sk_current_page");
    if (saved && saved.startsWith("genre:")) return saved.slice(6);
    return null;
  });
  const [mediaType, setMediaType] = useState(() => localStorage.getItem("sk_media_type") || "ebooks");
  const [bgTask, setBgTask] = useState(null);
  const [bgToast, setBgToast] = useState(null);
  const bgToastTimer = useRef(null);
  const supabaseRef = useRef(null);
  const [authUser, setAuthUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("signin"); // "signin" | "signup"
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState("");

  useEffect(() => {
    const onProgress = (e) => setBgTask(e.detail);
    const onComplete = (e) => {
      setBgTask(null);
      const d = e.detail;
      const msg = d.task === 'enrich'
        ? `✨ Enrichment complete — ${d.enriched} books updated${d.stopped ? " (stopped early)" : ""}`
        : `🔄 Re-detect complete — ${d.changed} genres updated${d.stopped ? " (stopped early)" : ""}`;
      setBgToast(msg);
      clearTimeout(bgToastTimer.current);
      bgToastTimer.current = setTimeout(() => setBgToast(null), 6000);
    };
    window.addEventListener('sk-bg-progress', onProgress);
    window.addEventListener('sk-bg-complete', onComplete);
    return () => {
      window.removeEventListener('sk-bg-progress', onProgress);
      window.removeEventListener('sk-bg-complete', onComplete);
    };
  }, []);

  // --- Cloud sync helpers ---
  const SYNC_KEYS = [
    "sk_user_books",
    "sk_statuses_ebooks", "sk_statuses_audiobooks",
    "sk_favorites_ebooks", "sk_favorites_audiobooks",
    "sk_progress_ebooks", "sk_progress_audiobooks",
    "sk_dates_ebooks", "sk_dates_audiobooks",
    "sk_sessions_ebooks", "sk_sessions_audiobooks",
    "sk_chapters_ebooks",
    "sk_dark_factor", "sk_world_building",
    "sk_connections", "sk_genre_overrides", "sk_hidden_books",
    "sk_avatar", "sk_avatar_pos",
  ];

  const gatherLocalData = () => {
    const payload = {};
    SYNC_KEYS.forEach(k => {
      const v = localStorage.getItem(k);
      if (!v) return;
      try {
        const parsed = JSON.parse(v);
        // Strip descriptions from books — they're large and re-enrichable
        if (k === "sk_user_books" && Array.isArray(parsed)) {
          payload[k] = parsed.map(({ description: _d, ...rest }) => rest);
        } else {
          payload[k] = parsed;
        }
      } catch { payload[k] = v; }
    });
    return payload;
  };

  const applyCloudData = (data) => {
    if (!data) return;
    SYNC_KEYS.forEach(k => {
      if (data[k] === undefined) return;

      if (k === "sk_user_books") {
        // Merge cloud books with local books — never overwrite locally-enriched fields
        const local = (() => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; } })();
        const cloudBooks = Array.isArray(data[k]) ? data[k] : [];
        const localMap = new Map();
        local.forEach(b => {
          if (b.isbn) localMap.set(b.isbn, b);
          localMap.set(b.title?.toLowerCase().trim(), b);
        });
        const merged = cloudBooks.map(cloudBook => {
          const localBook =
            (cloudBook.isbn && localMap.get(cloudBook.isbn)) ||
            localMap.get(cloudBook.title?.toLowerCase().trim());
          if (!localBook) return cloudBook; // new book from cloud — add it
          // Prefer locally-enriched fields; fill missing fields from cloud
          return {
            ...cloudBook,
            ...localBook,
            // Fields where cloud can fill in if local is missing
            coverUrl: localBook.coverUrl || cloudBook.coverUrl,
            description: localBook.description || cloudBook.description,
            author: localBook.author || cloudBook.author,
            isbn: localBook.isbn || cloudBook.isbn,
            _totalPages: localBook._totalPages || cloudBook._totalPages,
            _totalChapters: localBook._totalChapters || cloudBook._totalChapters,
          };
        });
        // Keep any local books not in cloud (locally added, not yet synced)
        const cloudIsbns = new Set(cloudBooks.map(b => b.isbn).filter(Boolean));
        const cloudTitles = new Set(cloudBooks.map(b => b.title?.toLowerCase().trim()).filter(Boolean));
        local.forEach(localBook => {
          const inCloud =
            (localBook.isbn && cloudIsbns.has(localBook.isbn)) ||
            cloudTitles.has(localBook.title?.toLowerCase().trim());
          if (!inCloud) merged.push(localBook);
        });
        localStorage.setItem(k, JSON.stringify(merged));

      } else if (k === "sk_genre_overrides") {
        // Merge overrides — local manually-set genres take precedence
        const local = (() => { try { return JSON.parse(localStorage.getItem(k) || "{}"); } catch { return {}; } })();
        const merged = { ...data[k], ...local }; // local wins conflicts
        localStorage.setItem(k, JSON.stringify(merged));

      } else {
        // Store strings (e.g. base64 avatar) as-is; everything else as JSON
        const val = data[k];
        localStorage.setItem(k, typeof val === "string" ? val : JSON.stringify(val));
      }
    });
    // Notify components to re-read from localStorage
    window.dispatchEvent(new CustomEvent("sk-cloud-synced"));
  };

  const withTimeout = (promise, ms = 10000) =>
    Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout")), ms))]);

  const syncToCloud = async (user) => {
    const sb = supabaseRef.current;
    if (!sb || !user) return;
    const payload = gatherLocalData();
    await withTimeout(
      sb.from("user_libraries").upsert({ user_id: user.id, data: payload, updated_at: new Date().toISOString() })
    );
  };

  const syncFromCloud = async (user) => {
    const sb = supabaseRef.current;
    if (!sb || !user) return false;
    const { data, error } = await withTimeout(
      sb.from("user_libraries").select("data, updated_at").eq("user_id", user.id).single()
    );
    if (error || !data) return false;
    applyCloudData(data.data);
    return true;
  };

  const [syncStatus, setSyncStatus] = useState(""); // "", "syncing", "done", "error"
  const syncDebounceRef = useRef(null);

  const triggerAutoSync = (user) => {
    if (!user) return;
    clearTimeout(syncDebounceRef.current);
    syncDebounceRef.current = setTimeout(() => syncToCloud(user), 5000);
  };

  // Supabase auth session
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    supabaseRef.current = sb;
    sb.auth.getSession().then(({ data }) => {
      setAuthUser(data.session?.user ?? null);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      setAuthUser(user);
      if (user) {
        // Load subscription tier from Supabase
        sb.from("user_subscriptions").select("tier").eq("user_id", user.id).maybeSingle()
          .then(({ data }) => {
            localStorage.setItem("sk_user_tier", data?.tier || "reluctant");
          });
      } else {
        localStorage.setItem("sk_user_tier", "reluctant");
      }
      // Only pull from cloud on an actual new sign-in, not on page refresh (INITIAL_SESSION / TOKEN_REFRESHED)
      if (user && event === "SIGNED_IN") {
        const pulled = await syncFromCloud(user);
        if (!pulled) await syncToCloud(user);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSubmit = async () => {
    const sb = supabaseRef.current;
    if (!sb) return;
    setAuthError(""); setAuthSuccess(""); setAuthLoading(true);
    try {
      if (authMode === "signup") {
        const { error } = await sb.auth.signUp({ email: authEmail, password: authPassword });
        if (error) throw error;
        setAuthSuccess("Check your email to confirm your account!");
      } else {
        const { error } = await sb.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
        setShowAuthModal(false);
      }
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    const sb = supabaseRef.current;
    if (!sb) return;
    await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  };

  const handleSignOut = async () => {
    const sb = supabaseRef.current;
    if (sb) await sb.auth.signOut();
    setShowSidebar(false);
  };

  const [nests, setNests] = useState(DEFAULT_ASSIGNMENTS);
  const [openNestId, setOpenNestId] = useState(null);
  const [showFavorites, setShowFavorites] = useState(() => {
    const h = window.location.hash || localStorage.getItem("sk_last_hash") || "";
    return h === "#favorites" || localStorage.getItem("sk_current_page") === "favorites";
  });
  const [showTBR, setShowTBR] = useState(() => {
    const h = window.location.hash || localStorage.getItem("sk_last_hash") || "";
    return h === "#tbr" || localStorage.getItem("sk_current_page") === "tbr";
  });
  const [showStats, setShowStats] = useState(() => {
    const h = window.location.hash || localStorage.getItem("sk_last_hash") || "";
    return h === "#stats" || localStorage.getItem("sk_current_page") === "stats";
  });
  const [showSidebar, setShowSidebar] = useState(false);
  const [showPlatforms, setShowPlatforms] = useState(() => {
    const h = window.location.hash || localStorage.getItem("sk_last_hash") || "";
    return h === "#platforms" || localStorage.getItem("sk_current_page") === "platforms";
  });
  const [showSubscription, setShowSubscription] = useState(() => {
    const h = window.location.hash || localStorage.getItem("sk_last_hash") || "";
    return h === "#subscription" || localStorage.getItem("sk_current_page") === "subscription";
  });
  const [showAbout, setShowAbout] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const isAdmin = authUser?.email === ADMIN_EMAIL;
  const [showSettings, setShowSettings] = useState(() => {
    const h = window.location.hash || localStorage.getItem("sk_last_hash") || "";
    return h === "#settings" || localStorage.getItem("sk_current_page") === "settings";
  });
  const [showProfile, setShowProfile] = useState(() => {
    const h = window.location.hash || localStorage.getItem("sk_last_hash") || "";
    return h === "#profile" || localStorage.getItem("sk_current_page") === "profile";
  });
  const [showCommunity, setShowCommunity] = useState(() => {
    const h = window.location.hash || localStorage.getItem("sk_last_hash") || "";
    return h === "#community" || localStorage.getItem("sk_current_page") === "community";
  });
  const [showGroup, setShowGroup] = useState(() => {
    const h = window.location.hash || localStorage.getItem("sk_last_hash") || "";
    return h.startsWith("#group=") || localStorage.getItem("sk_current_page")?.startsWith("group:");
  });
  const [groupGenre, setGroupGenre] = useState(() => {
    const h = window.location.hash || localStorage.getItem("sk_last_hash") || "";
    if (h.startsWith("#group=")) return decodeURIComponent(h.slice(7));
    const saved = localStorage.getItem("sk_current_page") || "";
    if (saved.startsWith("group:")) return saved.slice(6);
    return null;
  });
  const [showBookClub, setShowBookClub] = useState(() => {
    const h = window.location.hash || localStorage.getItem("sk_last_hash") || "";
    return h.startsWith("#bookclub=") || localStorage.getItem("sk_current_page")?.startsWith("bookclub:");
  });
  const [bookClubGenre, setBookClubGenre] = useState(() => {
    const h = window.location.hash || localStorage.getItem("sk_last_hash") || "";
    if (h.startsWith("#bookclub=")) return decodeURIComponent(h.slice(10));
    const saved = localStorage.getItem("sk_current_page") || "";
    if (saved.startsWith("bookclub:")) return saved.slice(9);
    return null;
  });
  const isMobile = useIsMobile();
  const [ebookProgressMode, setEbookProgressMode] = useState(() => localStorage.getItem("sk_ebook_progress_mode") || "page");
  const [audiobookProgressMode, setAudiobookProgressMode] = useState(() => localStorage.getItem("sk_audiobook_progress_mode") || "chapter");
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem("sk_theme") || "firelight");
  const th = SK_THEMES[themeKey] || SK_THEMES.firelight;
  const [globalSearch, setGlobalSearch] = useState("");
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [hoverKnot, setHoverKnot] = useState(null); // "toggle" | "stats"
  const [sidebarHover, setSidebarHover] = useState(null);
  const [searchBook, setSearchBook] = useState(null);
  const [autoOpenBook, setAutoOpenBook] = useState(null);

  // Persist current page to localStorage so refresh (including iOS pull-to-refresh) restores position
  useEffect(() => {
    let page = "home";
    if (showCommunity) page = "community";
    else if (showGroup && groupGenre) page = "group:" + groupGenre;
    else if (showBookClub && bookClubGenre) page = "bookclub:" + bookClubGenre;
    else if (genre) page = "genre:" + genre;
    else if (showStats) page = "stats";
    else if (showPlatforms) page = "platforms";
    else if (showFavorites) page = "favorites";
    else if (showTBR) page = "tbr";
    else if (showSubscription) page = "subscription";
    else if (showProfile) page = "profile";
    else if (showSettings) page = "settings";
    localStorage.setItem("sk_current_page", page);
    localStorage.setItem("sk_last_hash", window.location.hash);
  }, [genre, showStats, showPlatforms, showFavorites, showTBR, showSubscription, showProfile, showSettings, showBookClub, bookClubGenre, showGroup, groupGenre, showCommunity]);

  // Save hash right before unload (catches pull-to-refresh on iOS)
  useEffect(() => {
    const onUnload = () => {
      localStorage.setItem("sk_last_hash", window.location.hash);
    };
    window.addEventListener("pagehide", onUnload);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("pagehide", onUnload);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const h = window.location.hash;
      setShowPlatforms(h === "#platforms");
      setShowFavorites(h === "#favorites");
      setShowTBR(h === "#tbr");
      setShowStats(h === "#stats");
      setShowSubscription(h === "#subscription");
      setShowProfile(h === "#profile");
      setShowSettings(h === "#settings");
      setShowCommunity(h === "#community");
      if (h.startsWith("#group=")) {
        setShowGroup(true);
        setGroupGenre(decodeURIComponent(h.slice(7)));
      } else {
        setShowGroup(false);
      }
      if (h.startsWith("#bookclub=")) {
        setShowBookClub(true);
        setBookClubGenre(decodeURIComponent(h.slice(10)));
      } else {
        setShowBookClub(false);
      }
      if (h.startsWith("#genre=")) {
        const g = decodeURIComponent(h.slice(7));
        setGenre(g);
        setShowHome(false);
      } else {
        setGenre(null);
        setShowHome(!h || h === "#");
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleNestClick = (nestGenre) => {
    window.location.hash = nestGenre ? "#genre=" + encodeURIComponent(nestGenre) : "";
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
      {/* Lantern animations */}
      <style>{`
        @keyframes goldPulse {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.5; }
        }
        .gold-pulse {
          animation: goldPulse 2s ease-in-out infinite;
        }
        @keyframes lanternSway {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }
        @keyframes lanternGlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }
        .lantern-sway {
          animation: lanternSway 4s ease-in-out infinite;
          transform-origin: 50% 0;
        }
        .lantern-glow rect.glow-layer {
          animation: lanternGlow 3s ease-in-out infinite;
        }
      `}</style>

      {/* STATS PAGE */}
      {showStats && <StatsPage onClose={() => { setShowStats(false); window.location.hash = ""; }} mediaType={mediaType} />}

      {/* FAVORITES SHELF PAGE */}
      {showFavorites && (
        <FavoritesShelf onClose={() => { setShowFavorites(false); window.location.hash = ""; }} />
      )}

      {/* TBR SHELF PAGE */}
      {showTBR && (
        <TBRShelf onClose={() => { setShowTBR(false); window.location.hash = ""; }} />
      )}

      {/* ADMIN DASHBOARD */}
      {showAdmin && isAdmin && (
        <AdminDashboard authUser={authUser} supabaseRef={supabaseRef} onClose={() => setShowAdmin(false)} />
      )}

      {/* PLATFORMS PAGE */}
      {showPlatforms && <PlatformPage onClose={() => { setShowPlatforms(false); window.location.hash = ""; }} mediaType={mediaType} th={th} themeKey={themeKey} />}

      {/* SUBSCRIPTION PAGE */}
      {showSubscription && <SubscriptionPage onClose={() => { setShowSubscription(false); window.location.hash = ""; }} />}

      {/* COMMUNITY PAGE */}
      {showCommunity && (
        <CommunityPage
          authUser={authUser}
          supabaseRef={supabaseRef}
          onClose={() => { setShowCommunity(false); window.location.hash = ""; }}
          onOpenGroup={(g) => { setShowCommunity(false); setGroupGenre(g); setShowGroup(true); window.location.hash = "#group=" + encodeURIComponent(g); }}
          onOpenBookClub={(g) => { setShowCommunity(false); setBookClubGenre(g); setShowBookClub(true); window.location.hash = "#bookclub=" + encodeURIComponent(g); }}
          onOpenSubscription={() => { setShowCommunity(false); setShowSubscription(true); window.location.hash = "#subscription"; }}
        />
      )}

      {/* GENRE GROUP PAGE */}
      {showGroup && groupGenre && (
        <GenreGroupPage
          genre={groupGenre}
          authUser={authUser}
          supabaseRef={supabaseRef}
          onClose={() => { setShowGroup(false); setGroupGenre(null); window.location.hash = ""; }}
          onOpenSubscription={() => { setShowGroup(false); setGroupGenre(null); setShowSubscription(true); window.location.hash = "#subscription"; }}
        />
      )}

      {/* BOOK CLUB PAGE */}
      {showBookClub && bookClubGenre && (
        <BookClubPage
          genre={bookClubGenre}
          authUser={authUser}
          supabaseRef={supabaseRef}
          onClose={() => { setShowBookClub(false); setBookClubGenre(null); window.location.hash = ""; }}
          onOpenSubscription={() => { setShowBookClub(false); setBookClubGenre(null); setShowSubscription(true); window.location.hash = "#subscription"; }}
        />
      )}

      {/* HAMBURGER BUTTON */}
      <button
        onClick={() => setShowSidebar(true)}
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 1000,
          background: "none",
          border: "none",
          fontSize: 22,
          color: "#F5ECD7",
          cursor: "pointer",
          lineHeight: 1,
          padding: "4px 6px",
          display: showSidebar ? "none" : "block",
        }}
        aria-label="Open menu"
      >
        ☰
      </button>

      {/* GLOBAL SEARCH BUTTON — main screen only */}
      <button
        onClick={() => { setShowGlobalSearch(true); setGlobalSearch(""); }}
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 1000,
          background: "rgba(0,0,0,0.25)",
          border: "1px solid rgba(245,236,215,0.3)",
          borderRadius: 20,
          fontSize: 11,
          color: "#F5ECD7",
          cursor: "pointer",
          padding: "4px 10px",
          display: (showPlatforms || showFavorites || showTBR || showStats || showSubscription || genre) ? "none" : "flex",
          alignItems: "center",
          gap: 5,
          fontFamily: "Georgia, serif",
        }}
        aria-label="Search library"
      >
        🔍 <span style={{ fontSize: 10, opacity: 0.85 }}>Search Library</span>
      </button>

      {/* GLOBAL SEARCH OVERLAY */}
      {showGlobalSearch && (() => {
        const allUserBooks = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
        const q = globalSearch.toLowerCase().trim();
        const results = q.length < 2 ? [] : allUserBooks.filter(b =>
          b.title?.toLowerCase().includes(q) ||
          b.author?.toLowerCase().includes(q) ||
          b.genre?.toLowerCase().includes(q)
        ).slice(0, 50);
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(30,18,8,0.85)", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 60 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowGlobalSearch(false); }}>
            <div style={{ width: "min(600px, 92vw)", display: "flex", flexDirection: "column", gap: 0 }} onClick={e => e.stopPropagation()}>
              {/* Search input */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F5ECD7", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>🔍</span>
                <input
                  autoFocus
                  value={globalSearch}
                  onChange={e => setGlobalSearch(e.target.value)}
                  onKeyDown={e => e.key === "Escape" && setShowGlobalSearch(false)}
                  placeholder="Search by title, author, or genre…"
                  style={{ flex: 1, border: "none", background: "transparent", fontFamily: "Georgia, serif", fontSize: 15, color: "#3A2A1A", outline: "none" }}
                />
                {globalSearch && <button onClick={() => setGlobalSearch("")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#8B5E3C" }}>✕</button>}
              </div>

              {/* Results */}
              <div style={{ background: "#F5ECD7", borderRadius: 10, overflow: "hidden", maxHeight: "70vh", overflowY: "auto" }}>
                {q.length < 2 ? (
                  <div style={{ padding: "20px 16px", fontFamily: "Georgia, serif", fontSize: 13, color: "#8B5E3C", textAlign: "center", fontStyle: "italic" }}>
                    Type at least 2 characters to search your entire library
                  </div>
                ) : results.length === 0 ? (
                  <div style={{ padding: "20px 16px", fontFamily: "Georgia, serif", fontSize: 13, color: "#8B5E3C", textAlign: "center", fontStyle: "italic" }}>
                    No books found for "{globalSearch}"
                  </div>
                ) : results.map((book, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: "1px solid #E8D5B0", cursor: "pointer" }}
                    onClick={() => {
                      const targetMedia = (book.type === "audiobooks" || book.mediaType === "audiobook") ? "audiobooks" : "ebooks";
                      setMediaType(targetMedia);
                      localStorage.setItem("sk_media_type", targetMedia);
                      setAutoOpenBook(book);
                      setGenre(book.genre || null);
                      window.location.hash = "#genre=" + encodeURIComponent(book.genre || "");
                      setShowHome(false);
                      setShowGlobalSearch(false);
                      setGlobalSearch("");
                    }}>
                    {book.coverUrl
                      ? <img src={book.coverUrl} alt="" style={{ width: 36, height: 52, objectFit: "cover", borderRadius: 3, flexShrink: 0 }} />
                      : <div style={{ width: 36, height: 52, background: "#D8C3A5", borderRadius: 3, flexShrink: 0 }} />
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 14, fontWeight: 700, color: "#3A2A1A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {book.title}
                      </div>
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#6B4E32", fontStyle: "italic" }}>{book.author}</div>
                      <div style={{ fontFamily: "Georgia, serif", fontSize: 11, color: "#8B5E3C", marginTop: 2 }}>{book.genre}</div>
                    </div>
                    <div style={{ fontSize: 18, flexShrink: 0 }} title={(book.type === "audiobooks" || book.mediaType === "audiobook") ? "Audiobook" : "eBook"}>
                      {(book.type === "audiobooks" || book.mediaType === "audiobook") ? "🎧" : "📚"}
                    </div>
                  </div>
                ))}
                {results.length > 0 && (
                  <div style={{ padding: "8px 14px", fontFamily: "Georgia, serif", fontSize: 11, color: "#8B5E3C", fontStyle: "italic", textAlign: "center" }}>
                    {results.length} result{results.length !== 1 ? "s" : ""}{allUserBooks.filter(b => b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.genre?.toLowerCase().includes(q)).length > 50 ? " (showing first 50)" : ""}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* SIDEBAR OVERLAY */}
      {showSidebar && (
        <div
          onClick={() => setShowSidebar(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 998,
          }}
        />
      )}

      {/* SIDEBAR PANEL */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: 260,
        zIndex: 999,
        background: `linear-gradient(to bottom, ${th.bg}, ${th.bgDeep})`,
        borderRight: `2px solid ${th.accent}`,
        boxShadow: "4px 0 20px rgba(0,0,0,0.2)",
        padding: "60px 0 20px 0",
        transform: showSidebar ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s ease",
      }}>
        {/* Close button */}
        <button
          onClick={() => setShowSidebar(false)}
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            background: "none",
            border: "none",
            fontSize: 18,
            color: th.text,
            cursor: "pointer",
          }}
          aria-label="Close menu"
        >
          ✕
        </button>

        {/* Sidebar header */}
        <div style={{
          fontFamily: '"Palatino Linotype", Palatino, serif',
          fontSize: 18,
          fontWeight: 700,
          color: th.text,
          textAlign: "center",
          padding: "0 20px 20px",
          borderBottom: `1px solid ${th.border}`,
        }}>
          📚 StoryKeeper
        </div>

        {/* Welcome message when signed in */}
        {authUser && (
          <div style={{
            padding: "12px 24px",
            fontFamily: '"Palatino Linotype", Palatino, serif',
            fontSize: 13,
            color: th.textSoft,
            fontStyle: "italic",
            borderBottom: `1px solid ${th.border}`,
            textAlign: "center",
          }}>
            Welcome Home, {authUser.user_metadata?.given_name || authUser.user_metadata?.name?.split(" ")[0] || authUser.email?.split("@")[0]}
          </div>
        )}

        {/* Menu items */}
        {[
          { key: "community",     label: "👥 Community",             action: () => { setShowSidebar(false); setShowCommunity(true); window.location.hash = "#community"; } },
          { key: "profile",       label: "👤 My Profile",            action: () => { setShowSidebar(false); setShowProfile(true); window.location.hash = "#profile"; } },
          { key: "platforms",     label: "🔗 Platform Connections", action: () => { setShowSidebar(false); setShowPlatforms(true); window.location.hash = "#platforms"; } },
          { key: "favorites",     label: "❤️ My Favorites",         action: () => { setShowSidebar(false); setShowFavorites(true); window.location.hash = "#favorites"; } },
          { key: "tbr",           label: "📚 My TBR Shelf",          action: () => { setShowSidebar(false); setShowTBR(true); window.location.hash = "#tbr"; } },
          { key: "stats",         label: "📖 My Story So Far",        action: () => { setShowSidebar(false); setShowStats(true); window.location.hash = "#stats"; } },
          { key: "subscription",  label: "🗝️ Subscription",          action: () => { setShowSidebar(false); setShowSubscription(true); window.location.hash = "#subscription"; } },
          { key: "contact",       label: "✉️ Contact Us",             action: () => { setShowSidebar(false); window.location.href = "mailto:support@thestorykeeper.co"; } },
          { key: "about",         label: "💗 About StoryKeeper",      action: () => { setShowSidebar(false); setShowAbout(true); } },
          ...(isAdmin ? [{ key: "admin", label: "🛡️ Moderation Dashboard", action: () => { setShowSidebar(false); setShowAdmin(true); } }] : []),
          ...(!authUser ? [{ key: "signin", label: "🔐 Sign In / Sign Up", action: () => { setShowSidebar(false); setAuthMode("signin"); setAuthEmail(""); setAuthPassword(""); setAuthError(""); setAuthSuccess(""); setShowAuthModal(true); } }] : [{ key: "signout", label: "🚪 Sign Out", action: handleSignOut }]),
        ].map((item) => (
          <div
            key={item.key}
            onClick={item.action}
            onMouseEnter={() => setSidebarHover(item.key)}
            onMouseLeave={() => setSidebarHover(null)}
            style={{
              padding: "14px 24px",
              fontFamily: '"Palatino Linotype", Palatino, serif',
              fontSize: 15,
              color: th.text,
              cursor: "pointer",
              borderBottom: `1px solid ${th.border}`,
              background: sidebarHover === item.key ? `${th.accent}18` : "transparent",
              borderLeft: "3px solid transparent",
              transition: "background 0.15s",
            }}
          >
            {item.label}
          </div>
        ))}

        {/* Settings */}
        <div
          onClick={() => { setShowSidebar(false); setShowSettings(true); window.location.hash = "#settings"; }}
          onMouseEnter={() => setSidebarHover("settings")}
          onMouseLeave={() => setSidebarHover(null)}
          style={{
            padding: "14px 24px",
            fontFamily: '"Palatino Linotype", Palatino, serif',
            fontSize: 15,
            color: th.text,
            borderBottom: `1px solid ${th.border}`,
            background: sidebarHover === "settings" ? `${th.accent}18` : "transparent",
            borderLeft: "3px solid transparent",
            transition: "background 0.15s",
            cursor: "pointer",
          }}
        >
          ⚙️ Settings
        </div>
      </div>

      {/* SEARCH RESULT MODAL */}
      {searchBook && (
        <BookModal
          book={searchBook}
          onClose={() => setSearchBook(null)}
          onBookEdited={(updated) => {
            const books = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
            const idx = books.findIndex(b => (b.isbn && b.isbn === updated.isbn) || b.title === updated.title);
            if (idx !== -1) { books[idx] = { ...books[idx], ...updated }; localStorage.setItem("sk_user_books", JSON.stringify(books)); }
            setSearchBook(null);
          }}
          favorites={(() => { try { return { ...JSON.parse(localStorage.getItem("sk_favorites_ebooks") || "{}"), ...JSON.parse(localStorage.getItem("sk_favorites_audiobooks") || "{}") }; } catch { return {}; } })()}
          setFavorites={(updater) => {
            const key = `sk_favorites_${searchBook.type || mediaType}`;
            const prev = (() => { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } })();
            const next = typeof updater === "function" ? updater(prev) : updater;
            localStorage.setItem(key, JSON.stringify(next));
          }}
          statuses={(() => { try { return { ...JSON.parse(localStorage.getItem("sk_statuses_ebooks") || "{}"), ...JSON.parse(localStorage.getItem("sk_statuses_audiobooks") || "{}") }; } catch { return {}; } })()}
          setStatuses={(updater) => {
            const key = `sk_statuses_${searchBook.type || mediaType}`;
            const prev = (() => { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } })();
            const next = typeof updater === "function" ? updater(prev) : updater;
            localStorage.setItem(key, JSON.stringify(next));
          }}
          progress={(() => { try { return { ...JSON.parse(localStorage.getItem("sk_progress_ebooks") || "{}"), ...JSON.parse(localStorage.getItem("sk_progress_audiobooks") || "{}") }; } catch { return {}; } })()}
          setProgress={(updater) => {
            const key = `sk_progress_${searchBook.type || mediaType}`;
            const prev = (() => { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } })();
            const next = typeof updater === "function" ? updater(prev) : updater;
            localStorage.setItem(key, JSON.stringify(next));
          }}
          mediaType={searchBook.type || mediaType}
          onDelete={(book) => {
            const bookKey = book.isbn || book.title;
            const userBooksAll = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
            const isUser = userBooksAll.some(b => (b.isbn && b.isbn === book.isbn) || b.title === book.title);
            if (isUser) {
              localStorage.setItem("sk_user_books", JSON.stringify(userBooksAll.filter(b => !((b.isbn && b.isbn === book.isbn) || b.title === book.title))));
            } else {
              const hidden = JSON.parse(localStorage.getItem("sk_hidden_books") || "[]");
              if (!hidden.includes(bookKey)) hidden.push(bookKey);
              localStorage.setItem("sk_hidden_books", JSON.stringify(hidden));
            }
            setSearchBook(null);
          }}
        />
      )}

      {/* BOOKSHELF PAGE */}
      {genre && (isMobile ? (
        <MobileBookShelf
          genre={genre}
          mediaType={mediaType}
          onToggleMediaType={() => setMediaType(t => { const next = t === "ebooks" ? "audiobooks" : "ebooks"; localStorage.setItem("sk_media_type", next); return next; })}
          onClose={() => { setGenre(null); setShowHome(true); window.location.hash = ""; }}
          onOpenSettings={() => { setShowSettings(true); window.location.hash = "#settings"; }}
          onOpenStats={() => setShowStats(true)}
          onOpenProfile={() => { setShowProfile(true); window.location.hash = "#profile"; }}
          onOpenGroup={() => { setGroupGenre(genre); setShowGroup(true); window.location.hash = "#group=" + encodeURIComponent(genre); }}
          onOpenBookClub={() => { setBookClubGenre(genre); setShowBookClub(true); window.location.hash = "#bookclub=" + encodeURIComponent(genre); }}
          autoOpenBook={autoOpenBook}
          onAutoOpenDone={() => setAutoOpenBook(null)}
        />
      ) : (
        <BookShelf
          genre={genre}
          mediaType={mediaType}
          onClose={() => { setGenre(null); setShowHome(true); window.location.hash = ""; }}
          autoOpenBook={autoOpenBook}
          onAutoOpenDone={() => setAutoOpenBook(null)}
        />
      ))}

      {/* HOME PAGE */}
      {isMobile && (
        <div style={{ display: showHome ? "block" : "none", position: "fixed", inset: 0, zIndex: 500 }}>
          <MobileHomeView
            mediaType={mediaType}
            onToggleMediaType={() => setMediaType(t => { const next = t === "ebooks" ? "audiobooks" : "ebooks"; localStorage.setItem("sk_media_type", next); return next; })}
            onGenreClick={(g) => {
              window.location.hash = "#genre=" + encodeURIComponent(g);
              setGenre(g);
              setShowHome(false);
            }}
            onOpenSettings={() => { setShowSettings(true); window.location.hash = "#settings"; }}
            onOpenStats={() => setShowStats(true)}
            onOpenProfile={() => { setShowProfile(true); window.location.hash = "#profile"; }}
          />
        </div>
      )}
      {!isMobile && showHome && (
        <HomeView
          mediaType={mediaType}
          onToggleMediaType={() => setMediaType(t => { const next = t === "ebooks" ? "audiobooks" : "ebooks"; localStorage.setItem("sk_media_type", next); return next; })}
          onGenreClick={(g) => {
            if (g === "__settings__") {
              return;
            } else {
              window.location.hash = "#genre=" + encodeURIComponent(g);
              setGenre(g);
              setShowHome(false);
            }
          }}
        />
      )}

      {/* Floating background-task progress chip */}
      {bgTask && !showPlatforms && (
        <div onClick={() => setShowPlatforms(true)} style={{
          position: "fixed", bottom: 20, right: 20,
          background: "rgba(20,10,4,0.88)", border: "1px solid #6B4E3270",
          borderRadius: 20, padding: "4px 12px",
          fontFamily: '"Palatino Linotype", Palatino, serif',
          fontSize: 10, color: "#D8C090CC",
          display: "flex", alignItems: "center", gap: 7,
          zIndex: 9999, cursor: "pointer", whiteSpace: "nowrap",
          boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
        }}>
          <span style={{ animation: "goldPulse 1.2s ease-in-out infinite", display: "inline-block" }}>
            {bgTask.task === 'enrich' ? "✨" : "🔄"}
          </span>
          {bgTask.task === 'enrich'
            ? `${bgTask.done}/${bgTask.total} · ${bgTask.enriched} updated`
            : `${bgTask.done}/${bgTask.total} · ${bgTask.changed} changed`}
          <span style={{ fontSize: 9, opacity: 0.55 }}>· view</span>
        </div>
      )}

      {/* Completion toast — auto-dismisses after 6s */}
      {bgToast && (
        <div onClick={() => setBgToast(null)} style={{
          position: "fixed", bottom: 20, right: 20,
          background: "rgba(25,50,25,0.93)", border: "1px solid #4a7a4a70",
          borderRadius: 20, padding: "8px 20px",
          fontFamily: '"Palatino Linotype", Palatino, serif',
          fontSize: 12, color: "#A8D8A8",
          zIndex: 9999, cursor: "pointer", whiteSpace: "nowrap",
          boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
        }}>
          {bgToast} &nbsp;✕
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9000,
          background: "rgba(0,0,0,0.65)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => { setShowSettings(false); window.location.hash = ""; }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: th.bg, borderRadius: 14, padding: "36px 32px",
            width: 420, maxHeight: "85vh", overflowY: "auto",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            fontFamily: '"Palatino Linotype", Palatino, serif',
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
              <button onClick={() => { setShowSettings(false); window.location.hash = ""; }} style={{
                background: "none", border: "none", cursor: "pointer", color: th.accent,
                fontSize: 22, padding: "0 10px 0 0", lineHeight: 1, fontFamily: '"Palatino Linotype", Palatino, serif',
              }}>‹</button>
              <h2 style={{ margin: 0, fontSize: 22, color: th.text, flex: 1, textAlign: "center" }}>⚙️ Settings</h2>
              <div style={{ width: 32 }} />
            </div>

            {/* Color Theme */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: th.textSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Color Theme</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {Object.entries(SK_THEMES).map(([key, t]) => (
                  <button key={key} onClick={() => { setThemeKey(key); localStorage.setItem("sk_theme", key); }} style={{
                    padding: "10px 8px", borderRadius: 10, cursor: "pointer", fontSize: 12,
                    fontFamily: '"Palatino Linotype", Palatino, serif',
                    border: themeKey === key ? `2px solid ${t.accent}` : `2px solid transparent`,
                    background: t.bg,
                    color: t.text,
                    display: "flex", alignItems: "center", gap: 6,
                    boxShadow: themeKey === key ? `0 0 0 1px ${t.accent}` : "0 1px 4px rgba(0,0,0,0.15)",
                    transition: "all 0.15s",
                  }}>
                    <span style={{ width: 14, height: 14, borderRadius: "50%", background: t.accent, flexShrink: 0, display: "inline-block" }} />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Default Media Type */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: th.textSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Default Media Type</div>
              <div style={{ display: "flex", gap: 10 }}>
                {["ebooks", "audiobooks"].map(t => (
                  <button key={t} onClick={() => { setMediaType(t); localStorage.setItem("sk_media_type", t); }} style={{
                    flex: 1, padding: "9px", borderRadius: 8, cursor: "pointer", fontSize: 13,
                    background: mediaType === t ? th.accent : th.bgMuted,
                    color: mediaType === t ? th.bg : th.text,
                    border: "none", fontFamily: '"Palatino Linotype", Palatino, serif',
                  }}>
                    {t === "ebooks" ? "📖 eBooks" : "🎧 Audiobooks"}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Settings */}
            {authUser && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: th.textSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Account</div>
                <div style={{ fontSize: 13, color: th.textMid, marginBottom: 10 }}>Signed in as <strong>{authUser.email}</strong></div>
                <button onClick={async () => {
                  const sb = supabaseRef.current;
                  if (!sb || !authEmail) return;
                  const newEmail = prompt("Enter new email address:");
                  if (!newEmail) return;
                  const { error } = await sb.auth.updateUser({ email: newEmail });
                  if (error) alert(error.message);
                  else alert("Check your new email to confirm the change.");
                }} style={{
                  width: "100%", padding: "9px", marginBottom: 8, borderRadius: 8,
                  background: th.bgMuted, border: "none", cursor: "pointer", fontSize: 13,
                  fontFamily: '"Palatino Linotype", Palatino, serif', color: th.text,
                }}>Change Email</button>
                <button onClick={async () => {
                  const sb = supabaseRef.current;
                  if (!sb) return;
                  const newPass = prompt("Enter new password (min 6 characters):");
                  if (!newPass) return;
                  const { error } = await sb.auth.updateUser({ password: newPass });
                  if (error) alert(error.message);
                  else alert("Password updated successfully.");
                }} style={{
                  width: "100%", padding: "9px", borderRadius: 8,
                  background: th.bgMuted, border: "none", cursor: "pointer", fontSize: 13,
                  fontFamily: '"Palatino Linotype", Palatino, serif', color: th.text,
                }}>Change Password</button>
              </div>
            )}

            {/* Notification Preferences */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: th.textSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Notifications</div>
              {[
                { key: "notif_enrichment", label: "Enrichment complete alerts" },
                { key: "notif_redetect", label: "Re-detect complete alerts" },
              ].map(({ key, label }) => {
                const val = localStorage.getItem(key) !== "false";
                return (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: th.textMid }}>{label}</span>
                    <div onClick={() => { localStorage.setItem(key, val ? "false" : "true"); setShowSettings(s => !s); setShowSettings(s => !s); }}
                      style={{ width: 40, height: 22, borderRadius: 11, background: val ? th.toggleOn : th.toggleOff, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                      <div style={{ position: "absolute", top: 3, left: val ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress Tracking */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: th.textSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Progress Tracking</div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: th.textSoft, marginBottom: 6, fontFamily: "Georgia, serif" }}>📖 Ebook progress tracked by:</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["page", "Page Number"], ["percent", "Percentage %"]].map(([val, label]) => (
                    <button key={val} onClick={() => { setEbookProgressMode(val); localStorage.setItem("sk_ebook_progress_mode", val); }} style={{
                      flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer", fontSize: 13,
                      fontFamily: '"Palatino Linotype", Palatino, serif',
                      border: ebookProgressMode === val ? `2px solid ${th.accent}` : `2px solid ${th.border || "#C9A96E"}`,
                      background: ebookProgressMode === val ? th.accent : th.bgMuted,
                      color: ebookProgressMode === val ? "#FFF8EE" : th.text,
                      fontWeight: ebookProgressMode === val ? 700 : 400,
                      transition: "all 0.15s",
                    }}>{label}</button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: th.textSoft, marginBottom: 6, fontFamily: "Georgia, serif" }}>🎧 Audiobook progress tracked by:</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["chapter", "Chapter Number"], ["percent", "Percentage %"]].map(([val, label]) => (
                    <button key={val} onClick={() => { setAudiobookProgressMode(val); localStorage.setItem("sk_audiobook_progress_mode", val); }} style={{
                      flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer", fontSize: 13,
                      fontFamily: '"Palatino Linotype", Palatino, serif',
                      border: audiobookProgressMode === val ? `2px solid ${th.accent}` : `2px solid ${th.border || "#C9A96E"}`,
                      background: audiobookProgressMode === val ? th.accent : th.bgMuted,
                      color: audiobookProgressMode === val ? "#FFF8EE" : th.text,
                      fontWeight: audiobookProgressMode === val ? 700 : 400,
                      transition: "all 0.15s",
                    }}>{label}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Data Management */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: th.textSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Data Management</div>
              <button onClick={() => {
                const books = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
                const statuses_e = JSON.parse(localStorage.getItem("sk_statuses_ebooks") || "{}");
                const statuses_a = JSON.parse(localStorage.getItem("sk_statuses_audiobooks") || "{}");
                const progress_e = JSON.parse(localStorage.getItem("sk_progress_ebooks") || "{}");
                const progress_a = JSON.parse(localStorage.getItem("sk_progress_audiobooks") || "{}");
                const dates_e = JSON.parse(localStorage.getItem("sk_dates_ebooks") || "{}");
                const dates_a = JSON.parse(localStorage.getItem("sk_dates_audiobooks") || "{}");
                const favorites_e = JSON.parse(localStorage.getItem("sk_favorites_ebooks") || "{}");
                const favorites_a = JSON.parse(localStorage.getItem("sk_favorites_audiobooks") || "{}");
                const backup = { books, statuses_e, statuses_a, progress_e, progress_a, dates_e, dates_a, favorites_e, favorites_a, exportedAt: new Date().toISOString() };
                const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = "storykeeper-backup.json"; a.click();
              }} style={{
                width: "100%", padding: "9px", marginBottom: 8, borderRadius: 8,
                background: th.bgMuted, border: "none", cursor: "pointer", fontSize: 13,
                fontFamily: '"Palatino Linotype", Palatino, serif', color: th.text,
              }}>📤 Download Full Backup (JSON)</button>

              <label style={{ display: "block", width: "100%", padding: "9px", marginBottom: 8, borderRadius: 8, background: th.bgMuted, border: "none", cursor: "pointer", fontSize: 13, fontFamily: '"Palatino Linotype", Palatino, serif', color: th.text, textAlign: "center", boxSizing: "border-box" }}>
                📥 Restore From Backup
                <input type="file" accept=".json" style={{ display: "none" }} onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    try {
                      const raw = ev.target.result;
                      const data = JSON.parse(raw);
                      // Support both full backup format and raw books array
                      const books = Array.isArray(data) ? data : (data.books || []);
                      if (!books?.length) { alert("❌ No books found in this file."); return; }
                      if (!window.confirm(`Restore ${books.length} books from backup? This will merge with your current library.`)) return;
                      const existing = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
                      const existingTitles = new Set(existing.map(b => (b.title || "").toLowerCase().trim()));
                      const newBooks = books.filter(b => b.title && !existingTitles.has(b.title.toLowerCase().trim()));
                      localStorage.setItem("sk_user_books", JSON.stringify([...existing, ...newBooks]));
                      if (!Array.isArray(data)) {
                        if (data.statuses_e) localStorage.setItem("sk_statuses_ebooks", JSON.stringify(data.statuses_e));
                        if (data.statuses_a) localStorage.setItem("sk_statuses_audiobooks", JSON.stringify(data.statuses_a));
                        if (data.progress_e) localStorage.setItem("sk_progress_ebooks", JSON.stringify(data.progress_e));
                        if (data.progress_a) localStorage.setItem("sk_progress_audiobooks", JSON.stringify(data.progress_a));
                        if (data.dates_e) localStorage.setItem("sk_dates_ebooks", JSON.stringify(data.dates_e));
                        if (data.dates_a) localStorage.setItem("sk_dates_audiobooks", JSON.stringify(data.dates_a));
                        if (data.favorites_e) localStorage.setItem("sk_favorites_ebooks", JSON.stringify(data.favorites_e));
                        if (data.favorites_a) localStorage.setItem("sk_favorites_audiobooks", JSON.stringify(data.favorites_a));
                      }
                      refreshBookCounts();
                      alert(`✅ Restored ${newBooks.length} books! (${books.length - newBooks.length} duplicates skipped)`);
                      e.target.value = "";
                    } catch(err) { alert("❌ Could not read backup file. Error: " + err.message); }
                  };
                  reader.readAsText(file);
                }} />
              </label>
              <button onClick={() => {
                const books = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
                const incomplete = books.filter(b => needsDesc(b) || !b.coverUrl || !b.author);
                if (incomplete.length === 0) { alert("All books are complete — nothing to export!"); return; }
                const headers = ["Title", "Author", "Genre", "Type", "Missing", "ISBN"];
                const rows = incomplete.map(b => {
                  const missing = [needsDesc(b) && "Description", !b.coverUrl && "Cover", !b.author && "Author"].filter(Boolean).join(", ");
                  return [b.title || "", b.author || "", b.genre || "", b.mediaType || b.type || "", missing, b.isbn || ""].map(v => `"${v}"`).join(",");
                });
                const csv = [headers.join(","), ...rows].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = "storykeeper-incomplete-books.csv"; a.click();
              }} style={{
                width: "100%", padding: "9px", marginBottom: 8, borderRadius: 8,
                background: th.bgMuted, border: "none", cursor: "pointer", fontSize: 13,
                fontFamily: '"Palatino Linotype", Palatino, serif', color: th.text,
              }}>📋 Download Incomplete Books</button>
              <button onClick={() => {
                if (window.confirm("⚠️ This will permanently clear your entire library. Are you sure?")) {
                  if (window.confirm("Are you absolutely sure? This cannot be undone.")) {
                    localStorage.removeItem("sk_user_books");
                    setShowSettings(false);
                    alert("Library cleared.");
                  }
                }
              }} style={{
                width: "100%", padding: "9px", borderRadius: 8,
                background: "#F5E0E0", border: "1px solid #D4A0A0", cursor: "pointer", fontSize: 13,
                fontFamily: '"Palatino Linotype", Palatino, serif', color: "#8B2A2A",
              }}>🗑️ Clear Entire Library</button>
            </div>

            {/* Account */}
            <div style={{ marginBottom: 24, paddingTop: 20, borderTop: `1px solid ${th.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: th.textSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Account</div>
              {authUser ? (
                <div>
                  <div style={{ fontSize: 13, color: th.textMid, marginBottom: 12, fontFamily: "Georgia, serif" }}>
                    Signed in as <strong>{authUser.email}</strong>
                  </div>
                  <button onClick={async () => {
                    setSyncStatus("syncing");
                    try {
                      await syncToCloud(authUser);
                      setSyncStatus("done");
                      setTimeout(() => setSyncStatus(""), 3000);
                    } catch { setSyncStatus("error"); setTimeout(() => setSyncStatus(""), 3000); }
                  }} style={{
                    width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${th.border}`,
                    background: th.bgDeep, color: th.text, cursor: "pointer", fontSize: 14,
                    fontFamily: '"Palatino Linotype", Palatino, serif', marginBottom: 8,
                  }}>
                    {syncStatus === "syncing" ? "☁️ Syncing…" : syncStatus === "done" ? "✅ Synced!" : syncStatus === "error" ? "❌ Sync failed" : "☁️ Sync Now"}
                  </button>
                  <button onClick={async () => {
                    setSyncStatus("syncing");
                    try {
                      await syncFromCloud(authUser);
                      setSyncStatus("done");
                      setTimeout(() => setSyncStatus(""), 3000);
                      window.location.reload();
                    } catch { setSyncStatus("error"); setTimeout(() => setSyncStatus(""), 3000); }
                  }} style={{
                    width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${th.border}`,
                    background: th.bgDeep, color: th.text, cursor: "pointer", fontSize: 14,
                    fontFamily: '"Palatino Linotype", Palatino, serif', marginBottom: 8,
                  }}>
                    ⬇️ Pull from Cloud
                  </button>
                  <button onClick={() => { handleSignOut(); setShowSettings(false); }} style={{
                    width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${th.border}`,
                    background: th.bgMuted, color: th.text, cursor: "pointer", fontSize: 14,
                    fontFamily: '"Palatino Linotype", Palatino, serif',
                  }}>🚪 Sign Out</button>
                </div>
              ) : (
                <div>
                  <button onClick={handleGoogleAuth} style={{
                    width: "100%", padding: "11px", marginBottom: 10, borderRadius: 8,
                    border: `1px solid ${th.border}`, background: th.bgMuted,
                    fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: th.text,
                    fontFamily: '"Palatino Linotype", Palatino, serif',
                  }}>
                    <img src="https://www.google.com/favicon.ico" alt="" style={{ width: 16, height: 16 }} />
                    Continue with Google
                  </button>
                  <button onClick={() => { setShowSettings(false); setAuthMode("signin"); setAuthEmail(""); setAuthPassword(""); setAuthError(""); setAuthSuccess(""); setShowAuthModal(true); }} style={{
                    width: "100%", padding: "11px", borderRadius: 8, border: `1px solid ${th.border}`,
                    background: th.bgDeep, color: th.text, cursor: "pointer", fontSize: 14,
                    fontFamily: '"Palatino Linotype", Palatino, serif',
                  }}>
                    Sign In with Email
                  </button>
                </div>
              )}
            </div>

            <div style={{ textAlign: "center" }}>
              <button onClick={() => { setShowSettings(false); window.location.hash = ""; }} style={{
                background: th.accent, border: "none", borderRadius: 8,
                padding: "9px 28px", color: th.bg, fontSize: 14,
                fontFamily: '"Palatino Linotype", Palatino, serif', cursor: "pointer",
              }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE MODAL */}
      {showProfile && (
        authUser ? (
          <UserProfileModal
            authUser={authUser}
            supabaseRef={supabaseRef}
            onClose={() => { setShowProfile(false); window.location.hash = ""; }}
            onSignOut={handleSignOut}
            onOpenSubscription={() => { setShowProfile(false); setShowSubscription(true); window.location.hash = "#subscription"; }}
          />
        ) : (
          <div style={{ position: "fixed", inset: 0, zIndex: 9100, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowProfile(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: th.bg, borderRadius: 16, padding: "36px 28px", width: Math.min(window.innerWidth - 32, 360), fontFamily: '"Palatino Linotype", Palatino, serif', boxShadow: "0 12px 48px rgba(0,0,0,0.6)", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
              <h2 style={{ margin: "0 0 12px", fontSize: 20, color: th.text }}>My Profile</h2>
              <p style={{ fontSize: 14, color: th.textSoft, marginBottom: 24, lineHeight: 1.6 }}>Sign in to access your profile, sync your library across devices, and manage your subscription.</p>
              <button onClick={() => { setShowProfile(false); handleGoogleAuth(); }} style={{ width: "100%", padding: "12px", marginBottom: 10, borderRadius: 8, border: `1px solid ${th.border}`, background: th.bgMuted, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: th.text, fontFamily: '"Palatino Linotype", Palatino, serif' }}>
                <img src="https://www.google.com/favicon.ico" alt="" style={{ width: 16, height: 16 }} />
                Continue with Google
              </button>
              <button onClick={() => { setShowProfile(false); window.location.hash = ""; }} style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${th.border}`, background: "none", color: th.textSoft, fontSize: 13, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif' }}>Cancel</button>
            </div>
          </div>
        )
      )}

      {/* ABOUT MODAL */}
      {showAbout && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9000,
          background: "rgba(0,0,0,0.65)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setShowAbout(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: th.bg, borderRadius: 14, padding: "40px 36px",
            width: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            fontFamily: '"Palatino Linotype", Palatino, serif',
          }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 24, color: th.text, textAlign: "center", fontStyle: "italic" }}>
              About StoryKeeper
            </h2>
            <p style={{ fontSize: 14, color: th.textMid, lineHeight: 1.8, margin: "0 0 14px" }}>
              <strong>StoryKeeper</strong> was born from a simple idea — your library should live in one beautiful place.
            </p>
            <p style={{ fontSize: 14, color: th.textMid, lineHeight: 1.8, margin: "0 0 14px" }}>
              Whether you're an avid reader with thousands of eBooks, an audiobook devotee, or somewhere in between, StoryKeeper brings your entire collection together across platforms like Kindle, Kobo, and Goodreads — organized, enriched, and always at your fingertips.
            </p>
            <p style={{ fontSize: 14, color: th.textMid, lineHeight: 1.8, margin: "0 0 20px" }}>
              We believe reading is more than a hobby. It's a lifestyle. StoryKeeper is your cozy corner of the internet — a place to celebrate the stories that have shaped you and discover the ones that will.
            </p>
            <p style={{ fontSize: 14, color: th.textSoft, lineHeight: 1.8, margin: "0 0 6px", fontStyle: "italic" }}>
              I hope you love your cozy little reading nook as much as I loved bringing it to life.
            </p>
            <p style={{ fontSize: 14, color: th.textSoft, fontStyle: "italic", margin: 0 }}>
              With love, Michelle <span style={{ filter: "drop-shadow(0 0 4px #ff69b4) drop-shadow(0 0 8px #ff69b4)", animation: "goldPulse 1.8s ease-in-out infinite" }}>💗</span>
            </p>
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <button onClick={() => setShowAbout(false)} style={{
                background: th.accent, border: "none", borderRadius: 8,
                padding: "9px 28px", color: th.bg, fontSize: 14,
                fontFamily: '"Palatino Linotype", Palatino, serif', cursor: "pointer",
              }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9000,
          background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setShowAuthModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: th.bg, borderRadius: 14, padding: "36px 32px",
            width: 360, boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            fontFamily: '"Palatino Linotype", Palatino, serif',
          }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 22, color: th.text, textAlign: "center" }}>
              {authMode === "signin" ? "Welcome Back" : "Create Account"}
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: 12, color: th.textSoft, textAlign: "center", fontStyle: "italic" }}>
              StoryKeeper
            </p>

            {/* Google */}
            <button onClick={handleGoogleAuth} style={{
              width: "100%", padding: "10px", marginBottom: 16,
              background: th.bgMuted, border: `1px solid ${th.border}`, borderRadius: 8,
              fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: th.text,
            }}>
              <img src="https://www.google.com/favicon.ico" alt="" style={{ width: 16, height: 16 }} />
              Continue with Google
            </button>

            <div style={{ textAlign: "center", fontSize: 11, color: th.textSoft, marginBottom: 16 }}>— or —</div>

            <input
              type="email" placeholder="Email address" value={authEmail}
              onChange={e => setAuthEmail(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", marginBottom: 10, border: `1px solid ${th.border}`, borderRadius: 7, fontSize: 14, boxSizing: "border-box", fontFamily: "Georgia, serif", background: th.bgDeep, color: th.text }}
            />
            <input
              type="password" placeholder="Password" value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAuthSubmit()}
              style={{ width: "100%", padding: "10px 12px", marginBottom: 16, border: `1px solid ${th.border}`, borderRadius: 7, fontSize: 14, boxSizing: "border-box", fontFamily: "Georgia, serif", background: th.bgDeep, color: th.text }}
            />

            {authError && <div style={{ fontSize: 12, color: "#B94A4A", marginBottom: 10, textAlign: "center" }}>{authError}</div>}
            {authSuccess && <div style={{ fontSize: 12, color: "#2d6a2d", marginBottom: 10, textAlign: "center" }}>{authSuccess}</div>}

            <button onClick={handleAuthSubmit} disabled={authLoading || !authEmail || !authPassword} style={{
              width: "100%", padding: "11px", background: th.accent, border: "none", borderRadius: 8,
              color: th.bg, fontSize: 15, cursor: "pointer", marginBottom: 14,
              opacity: authLoading || !authEmail || !authPassword ? 0.6 : 1,
            }}>
              {authLoading ? "Please wait…" : authMode === "signin" ? "Sign In" : "Create Account"}
            </button>

            <div style={{ textAlign: "center", fontSize: 12, color: th.textMid }}>
              {authMode === "signin" ? "Don't have an account? " : "Already have an account? "}
              <span onClick={() => { setAuthMode(authMode === "signin" ? "signup" : "signin"); setAuthError(""); setAuthSuccess(""); }}
                style={{ color: th.accent, cursor: "pointer", textDecoration: "underline" }}>
                {authMode === "signin" ? "Sign up" : "Sign in"}
              </span>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
