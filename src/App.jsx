import { useState, useEffect } from "react";

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

const ALL_GENRES = ["Fantasy", "Mystery", "Sci-Fi", "Romance", "Thriller", "Self Help", "Dark Romance"];

const DEFAULT_ASSIGNMENTS = [
  { id: 1, left: "22%", top: "9%",  genre: "Fantasy"      },
  { id: 2, left: "75%", top: "8%",  genre: "Mystery"      },
  { id: 3, left: "8%",  top: "28%", genre: "Sci-Fi"       },
  { id: 4, left: "78%", top: "38%", genre: "Romance"      },
  { id: 5, left: "6%",  top: "52%", genre: "Thriller"     },
  { id: 6, left: "76%", top: "58%", genre: "Self Help"    },
  { id: 7, left: "76%", top: "76%", genre: "Dark Romance" },
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
  Mystery: [
    { title: "Sherlock Holmes",       author: "Arthur Conan Doyle",   type: "ebooks",      isbn: "9780743273565", description: "The complete adventures of the world's greatest consulting detective, Sherlock Holmes, and his faithful companion Dr. John Watson. Using razor-sharp deduction and an encyclopedic knowledge of crime, Holmes unravels cases that baffle Scotland Yard across Victorian London and beyond. These stories defined the detective fiction genre and made Holmes one of literature's most iconic characters." },
    { title: "Gone Girl",             author: "Gillian Flynn",         type: "audiobooks",  isbn: "9780307588371", description: "On their fifth wedding anniversary, Amy Dunne goes missing and all evidence points to her husband Nick as the prime suspect. As the investigation unfolds through alternating diary entries and present-day narration, shocking secrets about both characters are revealed. Flynn's psychological thriller is a searing, subversive look at marriage, media, and the stories we tell about ourselves." },
    { title: "The Girl on the Train", author: "Paula Hawkins",         type: "ebooks",      isbn: "9781594634024", description: "Rachel takes the same commuter train every day and becomes fixated on a seemingly perfect couple she watches from the window — until the woman goes missing and Rachel finds herself entangled in the investigation. Told from three unreliable female perspectives, the novel slowly strips away illusions about domestic life and hidden violence. It became a global phenomenon for its twisty, compulsive plotting." },
    { title: "Big Little Lies",       author: "Liane Moriarty",        type: "audiobooks",  isbn: "9780399167065", description: "Three women — Madeline, Celeste, and Jane — form an unlikely friendship at their children's school on Australia's Bondi coast, their lives intersecting around a crime that will be revealed at the school's trivia night. Moriarty weaves together dark themes of domestic abuse, bullying, and class tension with sharp wit and compassion. This clever novel became the basis for the acclaimed HBO miniseries." },
    { title: "In the Woods",          author: "Tana French",           type: "ebooks",      isbn: "9780143113492", description: "Dublin detective Rob Ryan is called to investigate the murder of a young girl found in an ancient wood — the same wood where he was found as a child, the sole survivor of an unexplained incident that erased his memories. As he and his partner Cassie Maddox dig deeper, the past begins to reassert itself dangerously. French's literary debut is a haunting exploration of memory, loss, and the limits of justice." },
    { title: "The Silent Patient",    author: "Alex Michaelides",      type: "ebooks",      isbn: "9781250301697", description: "Alicia Berenson, a famous painter, shoots her husband five times and then never speaks another word. Criminal psychotherapist Theo Faber becomes obsessed with uncovering the motive behind her silence, and takes a job at the secure psychiatric unit where she is held. The novel builds to a stunning twist that recontextualizes everything that came before." },
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
  Thriller: [
    { title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson",      type: "ebooks",      isbn: "9780307454546", description: "Journalist Mikael Blomkvist and hacker Lisbeth Salander are hired by a wealthy industrialist to investigate the decades-old disappearance of his granddaughter, uncovering a dark web of family secrets and serial murder. Larsson's novel is a gripping procedural wrapped in a fierce critique of violence against women in Swedish society. It launched a global phenomenon and introduced one of crime fiction's most unforgettable heroines." },
    { title: "No Country for Old Men",          author: "Cormac McCarthy",    type: "audiobooks",  isbn: "9780307387899", description: "In 1980 West Texas, a welder named Llewelyn Moss stumbles upon the aftermath of a drug deal gone wrong and takes the money — setting a relentless, emotionless killer named Anton Chigurh on his trail. Sheriff Bell, aging and world-weary, pursues both men while reflecting on a world that seems to have left his values behind. McCarthy's lean, violent novel is a philosophical meditation on fate, evil, and mortality." },
    { title: "The Da Vinci Code",               author: "Dan Brown",          type: "ebooks",      isbn: "9780307474278", description: "Harvard symbologist Robert Langdon is called to the Louvre where a curator has been murdered, leaving behind a series of cryptic clues pointing to a secret society and a conspiracy that could shake the foundations of Christianity. Racing across Europe with cryptologist Sophie Neveu, Langdon must decode symbols hidden in the works of Leonardo da Vinci. Brown's page-turning thriller became one of the best-selling novels in history." },
    { title: "Gone Girl",                       author: "Gillian Flynn",      type: "audiobooks",  isbn: "9780307588371", description: "On their fifth wedding anniversary, Amy Dunne goes missing and all evidence points to her husband Nick as the prime suspect. As the investigation unfolds through alternating diary entries and present-day narration, shocking secrets about both characters are revealed. Flynn's psychological thriller is a searing, subversive look at marriage, media, and the stories we tell about ourselves." },
    { title: "I Am Pilgrim",                    author: "Terry Hayes",        type: "ebooks",      isbn: "9781476717494", description: "A retired American intelligence agent known only as Pilgrim is pulled out of anonymity to track a ghost — a faceless man who has found a way to manufacture a weaponized plague with the potential to kill millions. Spanning continents and decades of espionage tradecraft, Hayes's debut is a masterclass in sustained tension. This modern thriller has earned comparisons to the best of John le Carré." },
    { title: "The Firm",                        author: "John Grisham",       type: "ebooks",      isbn: "9780385319058", description: "Mitch McDeere, a brilliant Harvard Law graduate, joins a small but lucrative Memphis law firm only to discover it is under FBI investigation for its ties to the mob. Trapped between the Mafia and federal agents who each want something from him, Mitch must use every ounce of his intelligence to stay alive and free. Grisham's breakthrough legal thriller is a masterwork of claustrophobic, escalating dread." },
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

function BookSpine({ book, index, rowIndex, onClick }) {
  const c = SPINE_COLORS[(rowIndex * 6 + index) % SPINE_COLORS.length];
  const height = 160 + ((rowIndex * 6 + index) % 4) * 18;
  // Raised bands positions as % of height
  const bands = [12, 28, 72, 88];

  return (
    <div
      title={`${book.title} — ${book.author}`}
      onClick={() => onClick && onClick(book)}
      style={{
        width: 50,
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

function CDCase({ book, index, rowIndex, onClick }) {
  const [imgError, setImgError] = useState(false);
  const c = SPINE_COLORS[(rowIndex * 6 + index) % SPINE_COLORS.length];

  return (
    <div
      title={`${book.title} — ${book.author}`}
      onClick={() => onClick && onClick(book)}
      style={{
        width: 90,
        height: 90,
        display: "flex",
        flexDirection: "row",
        position: "relative",
        borderRadius: 2,
        border: "1px solid rgba(0,0,0,0.4)",
        boxShadow: "3px 3px 8px rgba(0,0,0,0.5), -1px 0 3px rgba(0,0,0,0.2)",
        overflow: "hidden",
        flexShrink: 0,
        alignSelf: "flex-end",
        cursor: "pointer",
      }}
    >
      {/* Left spine */}
      <div style={{
        width: 8,
        flexShrink: 0,
        background: "linear-gradient(to right, #1a1a1a, #2a2a2a)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}>
        <span style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          color: "#ffffff",
          fontSize: 7,
          lineHeight: 1.2,
          overflow: "hidden",
          maxHeight: "100%",
          opacity: 0.85,
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}>
          {book.title}
        </span>
      </div>

      {/* Main face */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {!imgError ? (
          <img
            src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`}
            alt={book.title}
            onError={() => setImgError(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div style={{
            width: "100%",
            height: "100%",
            background: `linear-gradient(135deg, ${c.dark} 0%, ${c.base} 100%)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 6,
            boxSizing: "border-box",
          }}>
            <span style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              color: c.text,
              fontSize: 9,
              fontFamily: '"Palatino Linotype", Palatino, serif',
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.3,
              overflow: "hidden",
              maxHeight: "70%",
            }}>
              {book.title}
            </span>
            <span style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              color: c.text,
              fontSize: 7,
              fontFamily: '"Palatino Linotype", Palatino, serif',
              fontStyle: "italic",
              opacity: 0.75,
              overflow: "hidden",
              maxHeight: "25%",
            }}>
              {book.author}
            </span>
          </div>
        )}

        {/* Glossy overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(255,255,255,0.18) 0%, transparent 50%)",
          pointerEvents: "none",
        }} />

        {/* Headphones badge */}
        <div style={{
          position: "absolute",
          bottom: 3,
          right: 3,
          fontSize: 12,
          lineHeight: 1,
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
          pointerEvents: "none",
        }}>
          🎧
        </div>
      </div>
    </div>
  );
}

function BookModal({ book, onClose, favorites, setFavorites, statuses, setStatuses, progress, setProgress, mediaType }) {
  const [imgError, setImgError] = useState(false);
  const [dates, setDates] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`sk_dates_${mediaType}`)) || {}; } catch { return {}; }
  });
  const isbn = book.isbn;
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
    setProgress((prev) => ({ ...prev, [isbn]: Number(e.target.value) }));
  };

  const statusBtnStyle = (s) => ({
    padding: "7px 12px",
    borderRadius: 6,
    border: "1px solid #8B5E3C",
    cursor: "pointer",
    fontFamily: '"Palatino Linotype", Palatino, serif',
    fontSize: 12,
    fontWeight: status === s ? 700 : 400,
    background: status === s ? "#3A2A1A" : "#F8F1E4",
    color: status === s ? "#F8F1E4" : "#3A2A1A",
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
          background: "#F8F1E4",
          border: "1px solid #8B5E3C",
          borderRadius: 12,
          padding: 30,
          position: "relative",
          boxShadow: "0 16px 48px rgba(0,0,0,0.55)",
          maxHeight: "90vh",
          overflowY: "auto",
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
            color: "#6B4E32",
            lineHeight: 1,
            padding: "2px 6px",
          }}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Two-column layout */}
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          {/* Left column — book cover */}
          <div style={{ width: "35%", flexShrink: 0 }}>
            {!imgError ? (
              <img
                src={`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`}
                alt={book.title}
                onError={() => setImgError(true)}
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
                  color: "#F8F1E4",
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              fontFamily: '"Palatino Linotype", Palatino, serif',
              fontSize: 22,
              fontWeight: 700,
              color: "#3A2A1A",
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
              color: "#6B4E32",
              margin: "0 0 12px 0",
            }}>
              {book.author}
            </p>

            {divider}

            <p style={{
              fontFamily: "Georgia, serif",
              fontSize: 13,
              color: "#4B3A2A",
              lineHeight: 1.7,
              margin: "0 0 4px 0",
            }}>
              {book.description}
            </p>

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

            {/* Progress bar — only when reading */}
            {status === "reading" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{
                  fontFamily: "Georgia, serif",
                  fontSize: 12,
                  color: "#4B3A2A",
                  display: "block",
                  marginBottom: 6,
                }}>
                  {mediaType === "audiobooks" ? "Listening Progress" : "Reading Progress"}: {prog}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={prog}
                  onChange={handleProgress}
                  style={{
                    width: "100%",
                    accentColor: "#8B5E3C",
                    cursor: "pointer",
                  }}
                />
              </div>
            )}

            {/* Favorites row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={handleFav}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                  color: isFav ? "#8B2020" : "#8B5E3C",
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
                color: isFav ? "#8B2020" : "#6B4E32",
                fontStyle: "italic",
              }}>
                {isFav ? "Favorited" : "Add to Favorites"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Patterns for each shelf row: "b"=book, "p0/p1"=plant type
const SHELF_PATTERNS = [
  ["b","b","p0","b","b","b","b","b"],
  ["b","b","b","b","p0","b","b","b"],
  ["b","p0","b","b","b","b","b","b"],
  ["b","b","b","b","b","p0","b","b"],
];



const PLANT_IMAGES = ["plant2.png"];

function ShelfPlant({ plantIndex }) {
  const src = "/" + PLANT_IMAGES[plantIndex % PLANT_IMAGES.length];
  return (
    <img
      src={src}
      alt="plant"
      style={{
        width: 220,
        height: 420,
        objectFit: "contain",
        objectPosition: "top center",
        display: "block",
      }}
    />
  );
}

function BookShelf({ genre, mediaType, onClose }) {
  const allBooks = (library[genre] || []).filter((b) => b.type === mediaType);
  const books = allBooks;

  const [selectedBook, setSelectedBook] = useState(null);

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
          {mediaType === "ebooks" ? "📚" : "🎧"} {genre}
        </h1>
        <p style={{
          fontFamily: '"Palatino Linotype", Palatino, serif',
          color: "#4B3A2A",
          fontStyle: "italic",
          fontSize: 15,
        }}>
          {mediaType === "ebooks" ? "📘" : "🎧"} {allBooks.length} {mediaType === "ebooks" ? "eBooks" : "Audiobooks"} in this collection
        </p>
      </div>

      {/* Bookshelves */}
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} style={{ marginBottom: 80, position: "relative" }}>

            {/* Books row — only books, no plants */}
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
                    return mediaType === "audiobooks" ? (
                      <CDCase
                        key={pi}
                        book={book}
                        index={bookIdx - 1}
                        rowIndex={rowIndex}
                        onClick={setSelectedBook}
                      />
                    ) : (
                      <BookSpine
                        key={pi}
                        book={book}
                        index={bookIdx - 1}
                        rowIndex={rowIndex}
                        onClick={setSelectedBook}
                      />
                    );
                  }
                  return null;
                });
              })()}
            </div>

            {/* Real shelf photo */}
            <img
              src="/shelf2.jpg"
              alt="shelf"
              style={{
                width: "100%",
                height: 28,
                objectFit: "cover",
                objectPosition: "center center",
                display: "block",
                boxShadow: "0 6px 14px rgba(0,0,0,0.4)",
              }}
            />

            {/* Plants pinned to shelf edge, vines hanging below */}
            {(() => {
              const pattern = SHELF_PATTERNS[rowIndex % SHELF_PATTERNS.length];
              const totalItems = pattern.length;
              const itemWidth = 60;
              return pattern.map((item, pi) => {
                if (!item.startsWith("p")) return null;
                const pIdx = parseInt(item[1]);
                const leftPct = (pi / totalItems) * 100;
                return (
                  <div key={pi} style={{
                    position: "absolute",
                    left: `${leftPct}%`,
                    top: "100%",
                    transform: "translateX(25%) translateY(-110px)",
                    zIndex: 10,
                    width: itemWidth,
                  }}>
                    <ShelfPlant plantIndex={pIdx} />
                  </div>
                );
              });
            })()}

            <div style={{ height: 8, background: "linear-gradient(to bottom, rgba(0,0,0,0.2), transparent)" }} />
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
        />
      )}
    </div>
  );
}

function FavoritesShelf({ onClose }) {
  const [selectedBook, setSelectedBook] = useState(null);

  // Merge ebook + audiobook favorites for the favorites shelf
  const [favorites, setFavorites] = useState(() => {
    try {
      const eb = JSON.parse(localStorage.getItem("sk_favorites_ebooks")) || {};
      const ab = JSON.parse(localStorage.getItem("sk_favorites_audiobooks")) || {};
      return { ...eb, ...ab };
    } catch { return {}; }
  });
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

  // Collect all favorited books from the library
  const favoritedBooks = [];
  Object.values(library).forEach((genreBooks) => {
    genreBooks.forEach((book) => {
      if (favorites[book.isbn]) {
        favoritedBooks.push(book);
      }
    });
  });

  // Split into rows of 6
  const rows = [];
  for (let i = 0; i < favoritedBooks.length; i += 6) {
    rows.push(favoritedBooks.slice(i, i + 6));
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
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
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
          rows.map((row, rowIndex) => (
            <div key={rowIndex} style={{ marginBottom: 80, position: "relative" }}>
              {/* Books row */}
              <div style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 5,
                padding: "0 8px",
              }}>
                {row.map((book, idx) => (
                  <BookSpine
                    key={book.isbn}
                    book={book}
                    index={idx}
                    rowIndex={rowIndex}
                    onClick={setSelectedBook}
                  />
                ))}
              </div>

              {/* Shelf photo */}
              <img
                src="/shelf2.jpg"
                alt="shelf"
                style={{
                  width: "100%",
                  height: 28,
                  objectFit: "cover",
                  objectPosition: "center center",
                  display: "block",
                  boxShadow: "0 6px 14px rgba(0,0,0,0.4)",
                }}
              />

              <div style={{ height: 8, background: "linear-gradient(to bottom, rgba(0,0,0,0.2), transparent)" }} />
            </div>
          ))
        )}
      </div>

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
        />
      )}
    </div>
  );
}

function StatsPage({ onClose, mediaType }) {
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedTallyMonth, setSelectedTallyMonth] = useState(null); // { yr, mi }

  const statuses = (() => { try { return JSON.parse(localStorage.getItem(`sk_statuses_${mediaType}`)) || {}; } catch { return {}; } })();
  const favorites = (() => { try { return JSON.parse(localStorage.getItem(`sk_favorites_${mediaType}`)) || {}; } catch { return {}; } })();
  const progress = (() => { try { return JSON.parse(localStorage.getItem(`sk_progress_${mediaType}`)) || {}; } catch { return {}; } })();
  const dates = (() => { try { return JSON.parse(localStorage.getItem(`sk_dates_${mediaType}`)) || {}; } catch { return {}; } })();

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
    padding: "16px 24px",
    textAlign: "center",
    minWidth: 130,
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

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 200,
      backgroundColor: "#F8F1E4",
      backgroundImage: 'url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center",
      overflowY: "auto",
      padding: "30px 40px",
    }}>
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

      <div style={{ maxWidth: 900, margin: "0 auto", paddingTop: 10 }}>
        {/* Header */}
        <h1 style={{
          fontFamily: '"Palatino Linotype", Palatino, serif',
          fontSize: 32,
          color: "#3A2A1A",
          textAlign: "center",
          marginBottom: 30,
        }}>{mediaType === "audiobooks" ? "🎧 My Listening Journey" : "📊 My Reading Journey"}</h1>

        {/* Section 1 — Summary Cards */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
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
        </div>

        {divider}

        {/* Section 2 — Monthly Reading Calendar */}
        <div style={{ marginBottom: 40 }}>
          {sectionTitle(mediaType === "audiobooks" ? "📅 Monthly Listening Calendar" : "📅 Monthly Reading Calendar")}

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

          {/* Day headers */}
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
              return (
                <div key={day} style={{
                  minHeight: 90,
                  border: "1px solid #D8C3A5",
                  borderRadius: 6,
                  padding: 5,
                  background: isToday(day) ? "rgba(139,94,60,0.15)" : "rgba(255,255,255,0.4)",
                  position: "relative",
                }}>
                  <div style={{ fontSize: 11, color: "#6B4E32", fontFamily: "Georgia, serif", marginBottom: 4, fontWeight: 700 }}>{day}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {books.map((b) => (
                      <img
                        key={b.isbn}
                        src={`https://covers.openlibrary.org/b/isbn/${b.isbn}-M.jpg`}
                        alt={b.title}
                        title={b.title}
                        style={{ width: 46, height: 64, objectFit: "cover", borderRadius: 3, border: "1px solid #C9A96E", boxShadow: "1px 1px 4px rgba(0,0,0,0.2)" }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
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
    </div>
  );
}

const EBOOK_PLATFORMS = [
  { id: "kindle",     name: "Kindle",           emoji: "📱", desc: "Amazon's ebook library",         url: "https://read.amazon.com" },
  { id: "apple",      name: "Apple Books",       emoji: "📖", desc: "Apple's book platform",          url: "https://books.apple.com" },
  { id: "kobo",       name: "Kobo",              emoji: "📚", desc: "Rakuten's ebook platform",       url: "https://www.kobo.com" },
  { id: "nook",       name: "Nook",              emoji: "📗", desc: "Barnes & Noble ebooks",          url: "https://www.barnesandnoble.com/b/nook" },
  { id: "googleplay", name: "Google Play Books", emoji: "📘", desc: "Google's ebook store",           url: "https://play.google.com/books" },
  { id: "scribd",     name: "Scribd",            emoji: "📜", desc: "Unlimited reading subscription",  url: "https://www.scribd.com" },
  { id: "bookfunnel", name: "BookFunnel",        emoji: "🎁", desc: "Indie author book delivery",     url: "https://bookfunnel.com" },
  { id: "libby",      name: "Libby / OverDrive", emoji: "🏛️", desc: "Free library ebooks & audio",    url: "https://libbyapp.com" },
];

const AUDIO_PLATFORMS = [
  { id: "audible",      name: "Audible",        emoji: "🎧", desc: "Amazon's audiobook platform",  url: "https://www.audible.com" },
  { id: "librofm",      name: "Libro.fm",       emoji: "🎙️", desc: "Indie bookstore audiobooks",   url: "https://libro.fm" },
  { id: "hoopla",       name: "Hoopla",         emoji: "🎵", desc: "Free library audiobooks",      url: "https://www.hoopladigital.com" },
  { id: "chirp",        name: "Chirp",          emoji: "🐦", desc: "Audiobook deals platform",     url: "https://www.chirpbooks.com" },
  { id: "graphicaudio", name: "Graphic Audio",  emoji: "🎭", desc: "Full-cast audio productions",  url: "https://www.graphicaudio.net" },
];

function PlatformCard({ platform, connected, onConnect, onDisconnect }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{
      background: "rgba(255,255,255,0.75)",
      border: "1px solid #D8C3A5",
      borderRadius: 10,
      padding: "20px 16px",
      textAlign: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}>
      <div style={{ fontSize: 32, marginBottom: 6 }}>{platform.emoji}</div>
      <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 15, fontWeight: 700, color: "#3A2A1A", marginBottom: 4 }}>{platform.name}</div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: "#6B4E32", marginBottom: 10 }}>{platform.desc}</div>
      {connected ? (
        <>
          <div style={{ color: "#2d6a2d", fontFamily: "Georgia, serif", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>✓ Connected</div>
          <button
            onClick={() => { alert("Library import coming soon!"); }}
            style={{
              display: "block",
              width: "100%",
              padding: "7px 0",
              marginBottom: 6,
              background: "#3A2A1A",
              color: "#F8F1E4",
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
          onClick={() => { window.open(platform.url, "_blank"); onConnect(platform.id); }}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "1px solid #8B5E3C",
            cursor: "pointer",
            background: hover ? "#D8C3A5" : "radial-gradient(circle at 30% 30%, #F5E6C8, #D8C3A5 70%)",
            color: "#3A2A1A",
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

function PlatformPage({ onClose }) {
  const [connections, setConnections] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sk_connections")) || {}; } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem("sk_connections", JSON.stringify(connections));
  }, [connections]);

  const connect = (id) => setConnections((prev) => ({ ...prev, [id]: true }));
  const disconnect = (id) => setConnections((prev) => { const next = { ...prev }; delete next[id]; return next; });

  const sectionTitle = (text) => (
    <h2 style={{
      fontFamily: '"Palatino Linotype", Palatino, serif',
      fontSize: 22,
      color: "#3A2A1A",
      marginBottom: 16,
      marginTop: 0,
    }}>{text}</h2>
  );

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 200,
      backgroundColor: "#F8F1E4",
      backgroundImage: 'url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg")',
      backgroundSize: "cover",
      backgroundPosition: "center",
      overflowY: "auto",
      padding: "30px 40px",
    }}>
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
        ← Back
      </button>

      <div style={{ maxWidth: 900, margin: "0 auto", paddingTop: 10 }}>
        <h1 style={{
          fontFamily: '"Palatino Linotype", Palatino, serif',
          fontSize: 32,
          color: "#3A2A1A",
          textAlign: "center",
          marginBottom: 6,
        }}>🔗 My Platforms</h1>
        <p style={{
          textAlign: "center",
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          fontSize: 14,
          color: "#6B4E32",
          marginBottom: 36,
        }}>Connect your reading platforms to import your library</p>

        {/* eBook Platforms */}
        <div style={{ marginBottom: 40 }}>
          {sectionTitle("📚 eBook Platforms")}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {EBOOK_PLATFORMS.map((p) => (
              <PlatformCard key={p.id} platform={p} connected={!!connections[p.id]} onConnect={connect} onDisconnect={disconnect} />
            ))}
          </div>
        </div>

        {/* Audiobook Platforms */}
        <div style={{ marginBottom: 40 }}>
          {sectionTitle("🎧 Audiobook Platforms")}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {AUDIO_PLATFORMS.map((p) => (
              <PlatformCard key={p.id} platform={p} connected={!!connections[p.id]} onConnect={connect} onDisconnect={disconnect} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [genre, setGenre] = useState(null);
  const [mediaType, setMediaType] = useState("ebooks");
  const [nests, setNests] = useState(DEFAULT_ASSIGNMENTS);
  const [openNestId, setOpenNestId] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showPlatforms, setShowPlatforms] = useState(false);
  const [hoverKnot, setHoverKnot] = useState(null); // "toggle" | "stats"
  const [sidebarHover, setSidebarHover] = useState(null);

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
      {/* Gold pulse animation for favorites nest */}
      <style>{`
        @keyframes goldPulse {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.5; }
        }
        .gold-pulse {
          animation: goldPulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* STATS PAGE */}
      {showStats && <StatsPage onClose={() => setShowStats(false)} mediaType={mediaType} />}

      {/* FAVORITES SHELF PAGE */}
      {showFavorites && (
        <FavoritesShelf onClose={() => setShowFavorites(false)} />
      )}

      {/* PLATFORMS PAGE */}
      {showPlatforms && <PlatformPage onClose={() => setShowPlatforms(false)} />}

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
          color: "#3A2A1A",
          cursor: "pointer",
          lineHeight: 1,
          padding: "4px 6px",
          display: showSidebar ? "none" : "block",
        }}
        aria-label="Open menu"
      >
        ☰
      </button>

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
        background: "linear-gradient(to bottom, #f5e6c8, #ede0c4)",
        borderRight: "2px solid #8B5E3C",
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
            color: "#3A2A1A",
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
          color: "#3A2A1A",
          textAlign: "center",
          padding: "0 20px 20px",
          borderBottom: "1px solid #D8C3A5",
        }}>
          📚 StoryKeeper
        </div>

        {/* Menu items */}
        {[
          { key: "platforms", label: "🔗 Platform Connections", action: () => { setShowSidebar(false); setShowPlatforms(true); } },
          { key: "favorites", label: "❤️ My Favorites", action: () => { setShowSidebar(false); setShowFavorites(true); } },
          { key: "stats",     label: "📊 Reading Stats",        action: () => { setShowSidebar(false); setShowStats(true); } },
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
              color: "#3A2A1A",
              cursor: "pointer",
              borderBottom: "1px solid rgba(216,195,165,0.4)",
              background: sidebarHover === item.key ? "rgba(139,94,60,0.1)" : "transparent",
              borderLeft: "3px solid transparent",
              transition: "background 0.15s",
            }}
          >
            {item.label}
          </div>
        ))}

        {/* Settings — coming soon */}
        <div style={{
          padding: "14px 24px",
          fontFamily: '"Palatino Linotype", Palatino, serif',
          fontSize: 15,
          color: "#9B8B7A",
          fontStyle: "italic",
          borderBottom: "1px solid rgba(216,195,165,0.4)",
          borderLeft: "3px solid transparent",
          cursor: "default",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          ⚙️ Settings
          <span style={{ fontSize: 11, fontStyle: "normal" }}>(Coming Soon)</span>
        </div>
      </div>

      {/* BOOKSHELF PAGE */}
      {genre && (
        <BookShelf
          genre={genre}
          mediaType={mediaType}
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

            {/* GOLDEN FAVORITES NEST */}
            <div
              style={{
                position: "absolute",
                left: "46%",
                top: "2%",
                transform: "translate(-50%, -50%)",
                zIndex: 10,
              }}
              onClick={(e) => { e.stopPropagation(); setShowFavorites(true); }}
            >
              <div style={{ position: "relative", width: 100, height: 70, cursor: "pointer" }}>
                <svg viewBox="0 0 100 70" width="100" height="70" style={{ position: "absolute", top: 0, left: 0 }}>
                  <defs>
                    <clipPath id="nestClip-favorites">
                      <ellipse cx="50" cy="44" rx="46" ry="28" />
                    </clipPath>
                  </defs>
                  <image
                    href="/nest_PNG.png"
                    x="-10" y="10" width="120" height="80"
                    clipPath="url(#nestClip-favorites)"
                    preserveAspectRatio="xMidYMid slice"
                  />
                  <ellipse cx="50" cy="68" rx="38" ry="5" fill="rgba(0,0,0,0.3)" />
                  {/* Golden glow ring — always visible, pulsing */}
                  <ellipse
                    cx="50" cy="44" rx="46" ry="28"
                    fill="none"
                    stroke="#ffd700"
                    strokeWidth="3"
                    opacity="0.9"
                    className="gold-pulse"
                  />
                </svg>

                <div style={{
                  position: "absolute",
                  top: "54%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "#ffd700",
                  fontFamily: '"Palatino Linotype", Palatino, serif',
                  fontWeight: 700,
                  fontSize: 11,
                  whiteSpace: "nowrap",
                  textShadow: "0 1px 5px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.8)",
                  pointerEvents: "none",
                }}>
                  ♥ Favorites
                </div>
              </div>
            </div>

            {/* TRUNK KNOT TOGGLE */}
            {hoverKnot === "toggle" && (
              <KnotScrollTooltip text={mediaType === "ebooks" ? "Switch to Audiobooks" : "Switch to eBooks"} left="51%" top="50%" />
            )}
            <button
              onMouseEnter={() => setHoverKnot("toggle")}
              onMouseLeave={() => setHoverKnot(null)}
              onClick={(e) => { e.stopPropagation(); setMediaType(mediaType === "ebooks" ? "audiobooks" : "ebooks"); }}
              style={{
                position: "absolute",
                left: "51%",
                top: "55%",
                transform: "translate(-50%, -50%)",
                width: 56,
                height: 46,
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                fontSize: 28,
                overflow: "hidden",
                padding: 0,
                boxShadow: "0 3px 10px rgba(0,0,0,0.7)",
                background: "transparent",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              <img
                src="/tree knot.jpg"
                alt="knot"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block", mixBlendMode: "multiply", filter: "brightness(0.45) saturate(0.7)" }}
              />
              <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 20, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.9))" }}>
                {mediaType === "ebooks" ? "📚" : "🎧"}
              </span>
            </button>

            {/* STATS KNOT */}
            {hoverKnot === "stats" && (
              <KnotScrollTooltip text={mediaType === "audiobooks" ? "Listening Journal" : "Reading Journal"} left="48%" top="73%" />
            )}
            <button
              onMouseEnter={() => setHoverKnot("stats")}
              onMouseLeave={() => setHoverKnot(null)}
              onClick={(e) => { e.stopPropagation(); setShowStats(true); }}
              style={{
                position: "absolute",
                left: "48%",
                top: "78%",
                transform: "translate(-50%, -50%)",
                width: 56,
                height: 46,
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                fontSize: 28,
                overflow: "hidden",
                padding: 0,
                boxShadow: "0 3px 10px rgba(0,0,0,0.7)",
                background: "transparent",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              <img
                src="/tree knot.jpg"
                alt="stats knot"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block", mixBlendMode: "multiply", filter: "brightness(0.45) saturate(0.7)" }}
              />
              <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 16, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.9))" }}>
                🦉
              </span>
            </button>
          </div>
        </div>

        {/* HINT + MODE BADGE near the roots */}
        <div style={{ textAlign: "center", marginTop: 8, paddingBottom: 20 }}>
          <p style={{ color: "#5a3e28", fontSize: 11, fontStyle: "italic", margin: 0 }}>
            💡 Click a nest to browse · Right-click to reassign its genre
            <span style={{
              marginLeft: 10,
              padding: "2px 10px",
              borderRadius: 20,
              background: mediaType === "ebooks" ? "rgba(26,58,107,0.15)" : "rgba(139,94,60,0.15)",
              border: `1px solid ${mediaType === "ebooks" ? "#1a3a6b" : "#8B5E3C"}`,
              color: mediaType === "ebooks" ? "#1a3a6b" : "#8B5E3C",
              fontStyle: "normal",
              fontWeight: 600,
              fontSize: 11,
            }}>
              {mediaType === "ebooks" ? "📚 eBooks" : "🎧 Audiobooks"}
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
