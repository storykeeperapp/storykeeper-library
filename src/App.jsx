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

function cleanTitle(title) {
  return title
    .replace(/\s*[\(\[].*?[\)\]]/g, "") // remove (Book 1), [Unabridged], etc.
    .replace(/\s*:\s*.+$/, "")           // remove subtitle after colon
    .replace(/,?\s*(Book|Vol|Volume|Part|Series)\s*\d+.*/i, "") // remove series numbering
    .trim();
}

const ALL_GENRES = [
  "Fantasy", "Mystery", "Sci-Fi", "Romance", "Thriller",
  "Self Help", "Dark Romance", "Fiction", "Historical Fiction",
  "Cookbooks", "Drama",
];

// Map Open Library subjects to our genres
function detectGenre(subjects = []) {
  const s = subjects.join(" ").toLowerCase();
  if (s.includes("dark romance")) return "Dark Romance";
  if (s.includes("cooking") || s.includes("cookbook") || s.includes("recipes") || s.includes("baking") || s.includes("culinary")) return "Cookbooks";
  if (s.includes("historical fiction") || s.includes("historical novel") || s.includes("history") || s.includes("world war") || s.includes("medieval")) return "Historical Fiction";
  if (s.includes("drama") || s.includes("play") || s.includes("theatre") || s.includes("theater")) return "Drama";
  if (s.includes("fantasy") || s.includes("magic") || s.includes("dragon")) return "Fantasy";
  if (s.includes("mystery") || s.includes("detective") || s.includes("crime")) return "Mystery";
  if (s.includes("science fiction") || s.includes("sci-fi") || s.includes("space") || s.includes("futur")) return "Sci-Fi";
  if (s.includes("romance") || s.includes("love story")) return "Romance";
  if (s.includes("thriller") || s.includes("suspense")) return "Thriller";
  if (s.includes("self-help") || s.includes("self help") || s.includes("personal development") || s.includes("motivation")) return "Self Help";
  if (s.includes("fiction") || s.includes("literary") || s.includes("novel")) return "Fiction";
  return "Fiction";
}

const DEFAULT_ASSIGNMENTS = [
  { id: 1,  left: "22%", top: "9%",  genre: "Fantasy"           },
  { id: 2,  left: "75%", top: "8%",  genre: "Mystery"           },
  { id: 3,  left: "8%",  top: "28%", genre: "Sci-Fi"            },
  { id: 4,  left: "78%", top: "38%", genre: "Romance"           },
  { id: 5,  left: "6%",  top: "52%", genre: "Thriller"          },
  { id: 6,  left: "76%", top: "58%", genre: "Self Help"         },
  { id: 7,  left: "76%", top: "76%", genre: "Dark Romance"      },
  { id: 8,  left: "35%", top: "18%", genre: "Fiction"           },
  { id: 9,  left: "60%", top: "22%", genre: "Historical Fiction" },
  { id: 10, left: "20%", top: "42%", genre: "Cookbooks"         },
  { id: 11, left: "50%", top: "38%", genre: "Drama"             },
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
  const height = 180 + ((rowIndex * 6 + index) % 4) * 20;
  // Raised bands positions as % of height
  const bands = [12, 28, 72, 88];

  return (
    <div
      title={`${book.title} — ${book.author}`}
      onClick={() => onClick && onClick(book)}
      style={{
        width: 58,
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
  const height = 120 + ((rowIndex * 6 + index) % 4) * 10;

  return (
    <div
      title={`${book.title} — ${book.author}`}
      onClick={() => onClick && onClick(book)}
      style={{
        width: 90,
        height,
        display: "flex",
        flexDirection: "row",
        position: "relative",
        borderRadius: "3px 4px 4px 3px",
        boxShadow: "4px 0 12px rgba(0,0,0,0.7), -1px 0 4px rgba(0,0,0,0.4)",
        overflow: "hidden",
        flexShrink: 0,
        alignSelf: "flex-end",
        cursor: "pointer",
        background: `linear-gradient(to right, ${c.dark} 0%, ${c.base} 15%, ${c.mid} 50%, ${c.base} 85%, ${c.dark} 100%)`,
      }}
    >
      {/* Leather texture */}
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(175deg, transparent 0px, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)", pointerEvents: "none" }} />

      {/* Raised bands */}
      {[12, 28, 72, 88].map((pct, i) => (
        <div key={i} style={{
          position: "absolute",
          top: `${pct}%`, left: 0, right: 0, height: 7,
          background: `linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, ${c.base} 20%, rgba(255,255,255,0.08) 50%, ${c.mid} 80%, rgba(0,0,0,0.3) 100%)`,
          boxShadow: "0 1px 2px rgba(0,0,0,0.4), 0 -1px 1px rgba(0,0,0,0.3)",
          zIndex: 2,
        }} />
      ))}

      {/* Top flourish */}
      <div style={{ position: "absolute", top: "14%", left: "50%", transform: "translateX(-50%)", color: c.text, fontSize: 9, opacity: 0.7, zIndex: 3, lineHeight: 1, textShadow: "0 0 3px rgba(0,0,0,0.5)" }}>❧</div>

      {/* Headphones icon — center */}
      <div style={{
        position: "absolute", top: "38%", left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: 22,
        zIndex: 3,
        filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.8))",
        lineHeight: 1,
        opacity: 0.85,
      }}>🎧</div>

      {/* Title */}
      <div style={{
        position: "absolute",
        top: "50%", bottom: "12%",
        left: 4, right: 4,
        display: "flex", alignItems: "center", justifyContent: "center",
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
          textShadow: "0 0 8px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)",
          lineHeight: 1.3,
          overflow: "hidden",
          maxHeight: "100%",
          opacity: 0.92,
        }}>
          {book.title}
        </div>
      </div>

      {/* Author */}
      <div style={{
        position: "absolute", bottom: "14%", left: 0, right: 0,
        display: "flex", justifyContent: "center",
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
          maxHeight: 55,
        }}>
          {book.author}
        </div>
      </div>

      {/* Spine binding edge */}
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 5, background: "linear-gradient(to right, rgba(0,0,0,0.4), rgba(255,255,255,0.04) 60%, transparent)", borderRadius: "3px 0 0 3px", pointerEvents: "none", zIndex: 4 }} />
      {/* Right shadow */}
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 5, background: "linear-gradient(to left, rgba(0,0,0,0.35), transparent)", pointerEvents: "none" }} />
    </div>
  );
}

function BookModal({ book, onClose, favorites, setFavorites, statuses, setStatuses, progress, setProgress, mediaType, onBookEdited }) {
  const [imgError, setImgError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState({ title: book.title, author: book.author || "", description: book.description || "", genre: book.genre || "Fiction", coverUrl: book.coverUrl || "" });
  const [dates, setDates] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`sk_dates_${mediaType}`)) || {}; } catch { return {}; }
  });

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

  const handleGenreChange = (newGenre) => {
    setSelectedGenre(newGenre);
    if (isUserBook) {
      try {
        const all = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
        const idx = all.findIndex(b => b.title === book.title && (b.author === book.author || !book.author));
        if (idx !== -1) { all[idx].genre = newGenre; localStorage.setItem("sk_user_books", JSON.stringify(all)); }
      } catch { /* ignore */ }
    } else {
      try {
        const overrides = JSON.parse(localStorage.getItem("sk_genre_overrides") || "{}");
        overrides[isbn] = newGenre;
        localStorage.setItem("sk_genre_overrides", JSON.stringify(overrides));
      } catch { /* ignore */ }
    }
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

  const [fetching, setFetching] = useState(false);
  const [fetchMsg, setFetchMsg] = useState(null);

  const handleFetchInfo = async () => {
    if (!isUserBook) return;
    setFetching(true);
    setFetchMsg(null);
    try {
      const cleaned = cleanTitle(book.title);
      const queries = [
        book.isbn ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${book.isbn}&maxResults=1` : null,
        book.author ? `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(cleaned)}+inauthor:${encodeURIComponent(book.author)}&maxResults=1` : null,
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleaned)}&maxResults=1`,
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
              color: "#8B5E3C",
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

        {/* Edit form */}
        {editing && (
          <div>
            <h2 style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 20, color: "#3A2A1A", margin: "0 0 16px 0", paddingRight: 30 }}>
              ✏️ Edit Book
            </h2>
            {[
              { label: "Title", field: "title" },
              { label: "Author", field: "author" },
              { label: "Cover URL", field: "coverUrl", placeholder: "https://..." },
            ].map(({ label, field, placeholder }) => (
              <div key={field} style={{ marginBottom: 12 }}>
                <label style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#4B3A2A", display: "block", marginBottom: 4 }}>{label}</label>
                <input
                  type="text"
                  value={editFields[field]}
                  placeholder={placeholder || ""}
                  onChange={e => setEditFields(p => ({ ...p, [field]: e.target.value }))}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #8B5E3C", fontFamily: "Georgia, serif", fontSize: 13, background: "#FFFDF8", color: "#3A2A1A", boxSizing: "border-box" }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#4B3A2A", display: "block", marginBottom: 4 }}>Genre</label>
              <select
                value={editFields.genre}
                onChange={e => setEditFields(p => ({ ...p, genre: e.target.value }))}
                style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #8B5E3C", fontFamily: "Georgia, serif", fontSize: 13, background: "#FFFDF8", color: "#3A2A1A" }}
              >
                {ALL_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#4B3A2A", display: "block", marginBottom: 4 }}>Description</label>
              <textarea
                value={editFields.description}
                onChange={e => setEditFields(p => ({ ...p, description: e.target.value }))}
                rows={4}
                style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #8B5E3C", fontFamily: "Georgia, serif", fontSize: 13, background: "#FFFDF8", color: "#3A2A1A", resize: "vertical", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleSaveEdit}
                style={{ padding: "8px 20px", background: "#3A2A1A", color: "#F8F1E4", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 14, fontWeight: 700 }}
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{ padding: "8px 16px", background: "none", border: "1px solid #8B5E3C", borderRadius: 6, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 14, color: "#3A2A1A" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Two-column layout */}
        {!editing && <>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          {/* Left column — book cover */}
          <div style={{ width: "35%", flexShrink: 0 }}>
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

            {/* Genre row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0 4px" }}>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#6B4E32", fontStyle: "italic", whiteSpace: "nowrap" }}>
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
                  background: "#F8F1E4",
                  color: "#3A2A1A",
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                {ALL_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              {selectedGenre !== currentGenre && (
                <span style={{ fontFamily: "Georgia, serif", fontSize: 11, color: "#6B4E32", fontStyle: "italic" }}>
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

            {/* Find Cover & Info — for imported books missing data */}
            {isUserBook && (!book.coverUrl || !book.description) && (
              <div style={{ marginBottom: 12 }}>
                <button
                  onClick={handleFetchInfo}
                  disabled={fetching}
                  style={{
                    padding: "6px 14px",
                    background: fetching ? "#D8C3A5" : "transparent",
                    border: "1px solid #8B5E3C",
                    borderRadius: 6,
                    cursor: fetching ? "default" : "pointer",
                    fontFamily: '"Palatino Linotype", Palatino, serif',
                    fontSize: 12,
                    color: "#3A2A1A",
                  }}
                >
                  {fetching ? "Searching…" : "🔍 Find Cover & Info"}
                </button>
                {fetchMsg && (
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 11, color: "#6B4E32", fontStyle: "italic", marginTop: 5 }}>
                    {fetchMsg}
                  </div>
                )}
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

function StackedBooks({ books, rowIndex, startColorIndex, onBookClick }) {
  const count = books && books.length > 0 ? Math.min(books.length, 5) : 4 + (rowIndex % 2);

  return (
    <div style={{
      flexShrink: 0,
      alignSelf: "flex-end",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 2,
      marginLeft: 12,
      marginRight: 12,
    }}>
      {Array.from({ length: count }, (_, i) => {
        const book = books && books[i];
        if (book) {
          return <LyingBookSpine key={i} book={book} index={startColorIndex + i} rowIndex={rowIndex} onClick={onBookClick} />;
        }
        const c = SPINE_COLORS[(startColorIndex + i) % SPINE_COLORS.length];
        return (
          <div key={i} style={{
            width: 160 + (i % 4) * 12, height: 34,
            background: `linear-gradient(to right, ${c.dark}, ${c.base} 20%, ${c.mid} 50%, ${c.base} 80%, ${c.dark})`,
            borderRadius: "2px 2px 3px 3px",
            boxShadow: "0 3px 8px rgba(0,0,0,0.5)",
          }} />
        );
      })}
      <div style={{ width: "85%", height: 4, alignSelf: "center", background: "radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 100%)", marginTop: 1 }} />
    </div>
  );
}


function BookShelf({ genre, mediaType, onClose }) {
  const genreOverrides = (() => { try { return JSON.parse(localStorage.getItem("sk_genre_overrides") || "{}"); } catch { return {}; } })();
  const allBooks = (library[genre] || [])
    .filter(b => b.type === mediaType)
    .filter(b => (genreOverrides[b.isbn] || genre) === genre);
  const overriddenToHere = Object.values(library).flat()
    .filter(b => b.type === mediaType && genreOverrides[b.isbn] === genre && !(library[genre] || []).some(lb => lb.isbn === b.isbn));
  const userBooks = (() => {
    try {
      const all = JSON.parse(localStorage.getItem("sk_user_books")) || [];
      return all.filter(b => b.genre === genre && b.type === mediaType);
    } catch { return []; }
  })();
  const books = [...allBooks, ...overriddenToHere, ...userBooks];

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

  // Split books into rows of 12
  const rows = [];
  for (let i = 0; i < books.length; i += 12) {
    rows.push(books.slice(i, i + 12));
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
          top: 60,
          left: 20,
          padding: "8px 18px",
          borderRadius: "50px",
          border: "1px solid #8B5E3C",
          cursor: "pointer",
          background: '#F8F1E4 url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg") center/cover',
          color: "#3A2A1A",
          fontFamily: '"Baskerville", "Book Antiqua", "Goudy Old Style", Georgia, serif',
          fontWeight: 700,
          fontStyle: "italic",
          fontSize: 15,
          letterSpacing: "0.5px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
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
      <div style={{ maxWidth: 1050, margin: "0 auto", paddingRight: 160 }}>
        {rows.map((row, rowIndex) => {
          const layout = rowIndex % 3; // 0=upright-left+stack-right, 1=stack-left+upright-right, 2=sandwich
          const plantLeft = SHELF_PLANT_POSITIONS[rowIndex % SHELF_PLANT_POSITIONS.length];

          // Split books for each layout
          const third = Math.max(2, Math.floor(row.length / 3));
          const half = Math.max(2, Math.floor(row.length / 2));

          const leftBooks   = layout === 2 ? row.slice(0, third)           : (layout === 0 ? row.slice(0, -Math.min(4, row.length)) : []);
          const stackBooks  = layout === 2 ? row.slice(third, third * 2)   : row.slice(-Math.min(4, row.length));
          const rightBooks  = layout === 2 ? row.slice(third * 2)          : (layout === 0 ? [] : row.slice(0, -Math.min(4, row.length)));
          const hasStack    = row.length >= 6;

          const renderUpright = (books, startIdx) => books.map((book, i) => (
            mediaType === "audiobooks"
              ? <CDCase key={i} book={book} index={startIdx + i} rowIndex={rowIndex} onClick={setSelectedBook} />
              : <BookSpine key={i} book={book} index={startIdx + i} rowIndex={rowIndex} onClick={setSelectedBook} />
          ));

          // Calculate plant x based on actual book widths so it lands in the gap
          const bookW = mediaType === "audiobooks" ? 94 : 62;
          const stackW = 300;
          const padL = 24;
          const containerW = 890;
          let plantPx;
          if (layout === 0) {
            plantPx = padL + leftBooks.length * bookW + 62;
          } else if (layout === 1) {
            plantPx = padL + stackW + 880;
          } else {
            plantPx = padL + leftBooks.length * bookW + 45;
          }
          const plantX = Math.min(plantPx, 950) + "px";
          // Per-layout bottom offset (lower value = plant sits lower)
          const plantBottom = layout === 0 ? -90 : layout === 1 ? -100 : -110;

          return (
            <div key={rowIndex} style={{ marginBottom: 0, position: "relative", overflow: "visible" }}>

              {/* Books row — overflow hidden, sits in front of plant pot */}
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
                    <StackedBooks books={stackBooks} rowIndex={rowIndex} startColorIndex={leftBooks.length} onBookClick={setSelectedBook} />
                  </div>}
                </>}

                {layout === 1 && <>
                  {hasStack && <div style={{ marginRight: 8 }}>
                    <StackedBooks books={stackBooks} rowIndex={rowIndex} startColorIndex={rightBooks.length} onBookClick={setSelectedBook} />
                  </div>}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginRight: 60 }}>
                    {renderUpright(rightBooks, 0)}
                  </div>
                </>}

                {layout === 2 && <>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
                    {renderUpright(leftBooks, 0)}
                  </div>
                  {hasStack && <div style={{ marginLeft: "auto" }}>
                    <StackedBooks books={stackBooks} rowIndex={rowIndex} startColorIndex={leftBooks.length} onBookClick={setSelectedBook} />
                  </div>}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginLeft: 16, marginRight: 60 }}>
                    {renderUpright(rightBooks, leftBooks.length + stackBooks.length)}
                  </div>
                </>}
              </div>

              {/* Plant — absolutely positioned so it can overflow upward freely */}
              <div style={{
                position: "absolute",
                bottom: plantBottom,
                left: plantX,
                transform: "translateX(-50%)",
                zIndex: 15,
                pointerEvents: "none",
              }}>
                <ShelfPlant plantIndex={rowIndex} />
              </div>

              {/* Shelf photo */}
              <img
                src="/shelf2.jpg"
                alt="shelf"
                style={{ width: "100%", height: 28, objectFit: "cover", objectPosition: "center center", display: "block", boxShadow: "0 6px 14px rgba(0,0,0,0.4)", position: "relative", zIndex: 5 }}
              />

              {/* Shelf shadow + spacing */}
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

  // Split into rows of 12
  const rows = [];
  for (let i = 0; i < favoritedBooks.length; i += 12) {
    rows.push(favoritedBooks.slice(i, i + 12));
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
          top: 60,
          left: 20,
          padding: "8px 18px",
          borderRadius: "50px",
          border: "1px solid #8B5E3C",
          cursor: "pointer",
          background: '#F8F1E4 url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg") center/cover',
          color: "#3A2A1A",
          fontFamily: '"Baskerville", "Book Antiqua", "Goudy Old Style", Georgia, serif',
          fontWeight: 700,
          fontStyle: "italic",
          fontSize: 15,
          letterSpacing: "0.5px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
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
            if (layout === 0) plantPx = padL + leftBooks.length * bookW + 140;
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
                      <StackedBooks books={stackBooks} rowIndex={rowIndex} startColorIndex={leftBooks.length} onBookClick={setSelectedBook} />
                    </div>}
                  </>}
                  {layout === 1 && <>
                    {hasStack && <div style={{ marginRight: 8 }}>
                      <StackedBooks books={stackBooks} rowIndex={rowIndex} startColorIndex={rightBooks.length} onBookClick={setSelectedBook} />
                    </div>}
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginRight: 60 }}>
                      {renderUpright(rightBooks, 0)}
                    </div>
                  </>}
                  {layout === 2 && <>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>{renderUpright(leftBooks, 0)}</div>
                    {hasStack && <div style={{ marginLeft: "auto" }}>
                      <StackedBooks books={stackBooks} rowIndex={rowIndex} startColorIndex={leftBooks.length} onBookClick={setSelectedBook} />
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
          top: 60,
          left: 20,
          padding: "8px 18px",
          borderRadius: "50px",
          border: "1px solid #8B5E3C",
          cursor: "pointer",
          background: '#F8F1E4 url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg") center/cover',
          color: "#3A2A1A",
          fontFamily: '"Baskerville", "Book Antiqua", "Goudy Old Style", Georgia, serif',
          fontWeight: 700,
          fontStyle: "italic",
          fontSize: 15,
          letterSpacing: "0.5px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
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
  if (shelves.includes('historical-fiction') || shelves.includes('historical fiction') || shelves.includes('historical') || shelves.includes('world-war') || shelves.includes('medieval')) return 'Historical Fiction';
  if (shelves.includes('drama') || shelves.includes('play') || shelves.includes('theatre') || shelves.includes('shakespeare')) return 'Drama';
  if (shelves.includes('romance') || shelves.includes('love') || shelves.includes('chick-lit')) return 'Romance';
  if (shelves.includes('fantasy') || shelves.includes('magic') || shelves.includes('dragon') || shelves.includes('wizard')) return 'Fantasy';
  if (shelves.includes('mystery') || shelves.includes('detective') || shelves.includes('crime') || shelves.includes('cozy')) return 'Mystery';
  if (shelves.includes('sci-fi') || shelves.includes('science-fiction') || shelves.includes('science fiction') || shelves.includes('scifi') || shelves.includes('space')) return 'Sci-Fi';
  if (shelves.includes('thriller') || shelves.includes('suspense') || shelves.includes('horror')) return 'Thriller';
  if (shelves.includes('self-help') || shelves.includes('self help') || shelves.includes('nonfiction') || shelves.includes('non-fiction') || shelves.includes('personal-development') || shelves.includes('business')) return 'Self Help';
  if (shelves.includes('literary') || shelves.includes('literary-fiction') || shelves.includes('classics') || shelves.includes('fiction')) return 'Fiction';
  return null;
}

function ImportModal({ platform, mediaType, onClose, onImport }) {
  const csvPlatforms = ["kindle", "kobo", "goodreads", "audible"];
  const showCSV = csvPlatforms.includes(platform.id);
  const [activeTab, setActiveTab] = useState(showCSV ? "csv" : "search");

  // CSV tab state
  const [csvBooks, setCsvBooks] = useState([]);
  const [csvSkipped, setCsvSkipped] = useState(0);
  const [csvGenres, setCsvGenres] = useState({});

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
        const gRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=1`);
        const gJson = await gRes.json();
        const vol = gJson.items?.[0]?.volumeInfo;
        if (vol) {
          const id13 = vol.industryIdentifiers?.find(i => i.type === "ISBN_13");
          const id10 = vol.industryIdentifiers?.find(i => i.type === "ISBN_10");
          const isbn = (id13 || id10)?.identifier || "";
          const pendingId = `bulk-${i}`;
          const genre = detectGenre(vol.categories || []);
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
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target.result);
      const isGoodreads = platform.id === "goodreads";

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

      const books = rows.map((row, idx) => {
        const title = row["title"] || row["book title"] || row["asin title"] || "";
        const author = row["author"] || row["author(s)"] || row["authors"] || row["narrator"] || "";
        const isbn = (row["isbn13"] || row["isbn"] || row["asin"] || "").replace(/[="]/g, "").replace(/\s/g, "");
        if (!title) return null;

        // Duplicate check
        const isDuplicate = (isbn && existingIsbns.has(isbn)) ||
          existingTitles.has(title.toLowerCase().trim());
        if (isDuplicate) return null;

        const shelves = isGoodreads ? (row["bookshelves"] || "") : "";
        const exclusiveShelf = isGoodreads ? (row["exclusive shelf"] || "") : "";
        const dateRead = isGoodreads ? (row["date read"] || "") : "";
        const dateAdded = isGoodreads ? (row["date added"] || "") : "";

        // Genre detection
        const shelfGenre = isGoodreads
          ? (detectGenreFromGoodreads(shelves, exclusiveShelf) || "Fantasy")
          : "Fantasy";

        // Status mapping
        let status = null;
        if (isGoodreads) {
          if (exclusiveShelf === "read") status = "finished";
          else if (exclusiveShelf === "currently-reading") status = "reading";
          else if (exclusiveShelf === "to-read") status = "want-to-read";
        }

        return { _csvIdx: idx, title, author, isbn, shelfGenre, status, dateRead, dateAdded };
      }).filter(Boolean);

      setCsvBooks(books);
      setCsvSkipped(rows.filter(r => r["title"] || r["book title"]).length - books.length);
      const genreMap = {};
      books.forEach(b => { genreMap[b._csvIdx] = b.shelfGenre || "Fantasy"; });
      setCsvGenres(genreMap);
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
    const genre = detectGenre(result.subject || []);
    const isbn = result.isbn ? result.isbn[0] : null;
    const coverUrl = result.cover_i ? `https://covers.openlibrary.org/b/id/${result.cover_i}-S.jpg` : "";
    const title = result.title || "";

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
    const books = csvBooks.map(b => ({
      title: b.title,
      author: b.author,
      isbn: b.isbn || "",
      coverUrl: "",
      type: mediaType,
      genre: csvGenres[b._csvIdx] || "Fantasy",
      platform: platform.id,
      description: "",
      // Goodreads extras passed through for status/date handling
      _status: isGoodreads ? b.status : null,
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

  const csvInstructions = platform.id === "kindle"
    ? 'Go to amazon.com → Account → Manage Your Content & Devices → the "..." menu → Export library'
    : platform.id === "kobo"
    ? 'Go to kobo.com → My Books → Export'
    : platform.id === "audible"
    ? 'Install the free "Audible Library Exporter" Chrome extension → visit audible.com/library → click the extension icon → Download CSV'
    : 'Go to goodreads.com → My Books → Import/Export → Export Library (exports a CSV with all your books, shelves & reading status)';

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

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {showCSV && <button style={tabBtnStyle("csv")} onClick={() => setActiveTab("csv")}>📁 Upload CSV</button>}
          <button style={tabBtnStyle("bulk")} onClick={() => setActiveTab("bulk")}>📋 Paste Titles</button>
          <button style={tabBtnStyle("search")} onClick={() => setActiveTab("search")}>🔍 Search &amp; Add</button>
        </div>

        {/* CSV Tab */}
        {activeTab === "csv" && showCSV && (
          <div>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "#4B3A2A", marginBottom: 8 }}>
              Export your library from {platform.name} and upload the CSV file below.
            </p>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: "#6B4E32", marginBottom: 14 }}>
              {csvInstructions}
            </p>
            <label style={{
              display: "inline-block",
              padding: "8px 16px",
              background: "#3A2A1A",
              color: "#F8F1E4",
              borderRadius: 6,
              cursor: "pointer",
              fontFamily: '"Palatino Linotype", Palatino, serif',
              fontSize: 13,
              marginBottom: 16,
            }}>
              📁 Choose CSV File
              <input type="file" accept=".csv" onChange={handleCSVFile} style={{ display: "none" }} />
            </label>

            {csvBooks.length > 0 && (
              <>
                <p style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "#3A2A1A", marginBottom: 10 }}>
                  Found {csvBooks.length} new book{csvBooks.length !== 1 ? "s" : ""}.{csvSkipped > 0 ? ` (${csvSkipped} duplicate${csvSkipped !== 1 ? "s" : ""} skipped)` : ""} Confirm genres:
                </p>
                <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 14 }}>
                  {csvBooks.map(b => (
                    <div key={b._csvIdx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderBottom: "1px solid #D8C3A5" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 600, color: "#3A2A1A" }}>{b.title}</div>
                        <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: "#6B4E32" }}>{b.author}</div>
                      </div>
                      {genreSelect(csvGenres[b._csvIdx] || "Fantasy", (val) => setCsvGenres(prev => ({ ...prev, [b._csvIdx]: val })))}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleConfirmCSV}
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
                  📥 Import {csvBooks.length} Book{csvBooks.length !== 1 ? "s" : ""}
                </button>
              </>
            )}
          </div>
        )}

        {/* Bulk Paste Tab */}
        {activeTab === "bulk" && (
          <div>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "#4B3A2A", marginBottom: 4 }}>
              Paste one book title per line. The app will search for each one automatically.
            </p>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: "#6B4E32", marginBottom: 12 }}>
              Tip for Audible users without the exporter: go to audible.com/library, copy your book titles from the page, and paste them here.
            </p>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={"The Name of the Wind\nProject Hail Mary\nDune\n..."}
              rows={8}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #8B5E3C", fontFamily: "Georgia, serif", fontSize: 13, background: "#FFFDF8", color: "#3A2A1A", resize: "vertical", boxSizing: "border-box", marginBottom: 12 }}
            />
            <button
              onClick={handleBulkSearch}
              disabled={bulkSearching || !bulkText.trim()}
              style={{ padding: "9px 20px", background: bulkSearching ? "#D8C3A5" : "#3A2A1A", color: bulkSearching ? "#6B4E32" : "#F8F1E4", border: "none", borderRadius: 6, cursor: bulkSearching ? "default" : "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 14, fontWeight: 700, marginBottom: 16 }}
            >
              {bulkSearching ? `Searching… (${bulkProgress?.done}/${bulkProgress?.total})` : "🔍 Search All Titles"}
            </button>

            {bulkPending.length > 0 && (
              <>
                <p style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "#3A2A1A", marginBottom: 10 }}>
                  Found {bulkPending.length} book{bulkPending.length !== 1 ? "s" : ""}. Confirm genres before importing:
                </p>
                <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 14 }}>
                  {bulkPending.map(b => (
                    <div key={b._pendingId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderBottom: "1px solid #D8C3A5" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 13, fontWeight: 600, color: "#3A2A1A" }}>{b.title}</div>
                        <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontStyle: "italic", color: "#6B4E32" }}>{b.author}</div>
                      </div>
                      <select
                        value={bulkGenres[b._pendingId] || b.genre}
                        onChange={e => setBulkGenres(prev => ({ ...prev, [b._pendingId]: e.target.value }))}
                        style={{ fontFamily: "Georgia, serif", fontSize: 12, padding: "3px 6px", borderRadius: 4, border: "1px solid #8B5E3C", background: "#F8F1E4", color: "#3A2A1A" }}
                      >
                        {ALL_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleConfirmBulk}
                  style={{ padding: "9px 20px", background: "#3A2A1A", color: "#F8F1E4", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 14, fontWeight: 700 }}
                >
                  📥 Import {bulkPending.length} Book{bulkPending.length !== 1 ? "s" : ""}
                </button>
              </>
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === "search" && (
          <div>
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
                    const genre = detectGenre(r.subject || []);
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
        )}
      </div>
    </div>
  );
}

function PlatformCard({ platform, connected, onConnect, onDisconnect, onImportClick }) {
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
            onClick={() => onImportClick && onImportClick(platform)}
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

function PlatformPage({ onClose, mediaType }) {
  const [connections, setConnections] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sk_connections")) || {}; } catch { return {}; }
  });
  const [importingPlatform, setImportingPlatform] = useState(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState(null); // { enriched, skipped }

  useEffect(() => {
    localStorage.setItem("sk_connections", JSON.stringify(connections));
  }, [connections]);

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

  const handleEnrich = async () => {
    setEnriching(true);
    setEnrichResult(null);
    const userBooks = JSON.parse(localStorage.getItem("sk_user_books") || "[]");
    const needsEnrich = userBooks.filter(b => !b.description || !b.author || !b.coverUrl);
    let enriched = 0;

    for (const book of needsEnrich) {
      try {
        const idx = userBooks.findIndex(b => b === book);
        let filled = false;

        // --- Try Open Library by ISBN ---
        if (book.isbn) {
          const res = await fetch(
            `https://openlibrary.org/search.json?isbn=${encodeURIComponent(book.isbn)}&limit=1&fields=title,author_name,isbn,subject,cover_i,description,first_sentence`
          );
          const json = await res.json();
          const data = json.docs?.[0];
          if (data) {
            if (!userBooks[idx].author && data.author_name?.length) userBooks[idx].author = data.author_name.join(", ");
            if (!userBooks[idx].coverUrl && data.cover_i) userBooks[idx].coverUrl = `https://covers.openlibrary.org/b/id/${data.cover_i}-M.jpg`;
            if (!userBooks[idx].isbn && data.isbn?.length) userBooks[idx].isbn = data.isbn[0];
            if (!userBooks[idx].description) {
              const d = data.description?.value || data.description || data.first_sentence?.value || data.first_sentence || "";
              if (d && typeof d === "string") userBooks[idx].description = d;
            }
            if (!userBooks[idx].genre && data.subject?.length) userBooks[idx].genre = detectGenre(data.subject);
            filled = true;
          }
        }

        // Helper to apply Google Books volume data
        const applyGoogleVol = (vol) => {
          if (!userBooks[idx].author && vol.authors?.length) userBooks[idx].author = vol.authors.join(", ");
          if (!userBooks[idx].coverUrl && vol.imageLinks?.thumbnail)
            userBooks[idx].coverUrl = vol.imageLinks.thumbnail.replace("http://", "https://").replace("&zoom=1", "&zoom=2");
          if (!userBooks[idx].description && vol.description) userBooks[idx].description = vol.description;
          if (!userBooks[idx].isbn && vol.industryIdentifiers?.length) {
            const id13 = vol.industryIdentifiers.find(i => i.type === "ISBN_13");
            const id10 = vol.industryIdentifiers.find(i => i.type === "ISBN_10");
            userBooks[idx].isbn = (id13 || id10)?.identifier || "";
          }
          if (!userBooks[idx].genre && vol.categories?.length) userBooks[idx].genre = detectGenre(vol.categories);
        };

        // --- Try Open Library by cleaned title ---
        const stillMissing = !userBooks[idx].author || !userBooks[idx].coverUrl || !userBooks[idx].description;
        if (stillMissing && book.title) {
          const cleaned = cleanTitle(book.title);
          const q = book.author
            ? `title=${encodeURIComponent(cleaned)}&author=${encodeURIComponent(book.author)}`
            : `title=${encodeURIComponent(cleaned)}`;
          const res = await fetch(`https://openlibrary.org/search.json?${q}&limit=1&fields=title,author_name,isbn,subject,cover_i,description,first_sentence`);
          const json = await res.json();
          const data = json.docs?.[0];
          if (data) {
            if (!userBooks[idx].author && data.author_name?.length) userBooks[idx].author = data.author_name.join(", ");
            if (!userBooks[idx].coverUrl && data.cover_i) userBooks[idx].coverUrl = `https://covers.openlibrary.org/b/id/${data.cover_i}-M.jpg`;
            if (!userBooks[idx].isbn && data.isbn?.length) userBooks[idx].isbn = data.isbn[0];
            if (!userBooks[idx].description) {
              const d = data.description?.value || data.description || data.first_sentence?.value || data.first_sentence || "";
              if (d && typeof d === "string") userBooks[idx].description = d;
            }
            if (!userBooks[idx].genre && data.subject?.length) userBooks[idx].genre = detectGenre(data.subject);
            filled = true;
          }
        }

        // --- Try Google Books by ISBN ---
        const stillMissing2 = !userBooks[idx].author || !userBooks[idx].coverUrl || !userBooks[idx].description;
        if (stillMissing2 && userBooks[idx].isbn) {
          const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${userBooks[idx].isbn}&maxResults=1`);
          const json = await res.json();
          const vol = json.items?.[0]?.volumeInfo;
          if (vol) { applyGoogleVol(vol); filled = true; }
        }

        // --- Try Google Books by cleaned title + author ---
        const stillMissing3 = !userBooks[idx].author || !userBooks[idx].coverUrl || !userBooks[idx].description;
        if (stillMissing3 && book.title) {
          const cleaned = cleanTitle(book.title);
          const gq = book.author
            ? `intitle:${encodeURIComponent(cleaned)}+inauthor:${encodeURIComponent(book.author)}`
            : `intitle:${encodeURIComponent(cleaned)}`;
          const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${gq}&maxResults=1`);
          const json = await res.json();
          const vol = json.items?.[0]?.volumeInfo;
          if (vol) { applyGoogleVol(vol); filled = true; }
        }

        // --- Last resort: Google Books title-only search ---
        const stillMissing4 = !userBooks[idx].coverUrl || !userBooks[idx].description;
        if (stillMissing4 && book.title) {
          const cleaned = cleanTitle(book.title);
          const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleaned)}&maxResults=3`);
          const json = await res.json();
          const vol = json.items?.find(item => {
            const t = item.volumeInfo?.title?.toLowerCase() || "";
            return t.includes(cleaned.toLowerCase().split(" ")[0]);
          })?.volumeInfo;
          if (vol) { applyGoogleVol(vol); filled = true; }
        }

        if (filled) enriched++;
      } catch { /* skip on network error */ }
      await new Promise(r => setTimeout(r, 120));
    }

    localStorage.setItem("sk_user_books", JSON.stringify(userBooks));
    setEnriching(false);
    setEnrichResult({ enriched, skipped: needsEnrich.length - enriched });
  };

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
          top: 60,
          left: 20,
          padding: "8px 18px",
          borderRadius: "50px",
          border: "1px solid #8B5E3C",
          cursor: "pointer",
          background: '#F8F1E4 url("https://www.myfreetextures.com/wp-content/uploads/2013/07/old-brown-vintage-parchment-paper-texture.jpg") center/cover',
          color: "#3A2A1A",
          fontFamily: '"Baskerville", "Book Antiqua", "Goudy Old Style", Georgia, serif',
          fontWeight: 700,
          fontStyle: "italic",
          fontSize: 15,
          letterSpacing: "0.5px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
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
          marginBottom: 24,
        }}>Connect your reading platforms to import your library</p>

        {/* Enrich Library */}
        <div style={{
          background: "rgba(255,255,255,0.6)",
          border: "1px solid #D8C3A5",
          borderRadius: 10,
          padding: "18px 24px",
          marginBottom: 36,
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 16, fontWeight: 700, color: "#3A2A1A", marginBottom: 4 }}>
              ✨ Enrich My Imported Books
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: "#6B4E32" }}>
              Fill in missing covers, authors, descriptions, and genres for books imported via CSV.
            </div>
            {(() => {
              const total = JSON.parse(localStorage.getItem("sk_user_books") || "[]").length;
              const incomplete = JSON.parse(localStorage.getItem("sk_user_books") || "[]").filter(b => !b.description || !b.author || !b.coverUrl).length;
              if (total === 0) return null;
              return (
                <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: incomplete > 0 ? "#8B5E3C" : "#2d6a2d", marginTop: 6 }}>
                  {incomplete > 0 ? `⚠️ ${incomplete} of ${total} imported books still missing cover, author, or description` : `✅ All ${total} imported books are complete`}
                </div>
              );
            })()}
            {enrichResult && (
              <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: enrichResult.enriched > 0 ? "#2d6a2d" : "#6B4E32", marginTop: 6 }}>
                {enrichResult.enriched > 0
                  ? `✅ Enriched ${enrichResult.enriched} book${enrichResult.enriched !== 1 ? "s" : ""}${enrichResult.skipped > 0 ? ` · ${enrichResult.skipped} could not be found online` : ""}`
                  : "All imported books are already up to date."}
              </div>
            )}
          </div>
          <button
            onClick={handleEnrich}
            disabled={enriching}
            style={{
              padding: "10px 22px",
              background: enriching ? "#D8C3A5" : "#3A2A1A",
              color: enriching ? "#6B4E32" : "#F8F1E4",
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
        </div>

        {/* Clear imported books */}
        <div style={{
          background: "rgba(255,255,255,0.6)",
          border: "1px solid #D8C3A5",
          borderRadius: 10,
          padding: "18px 24px",
          marginBottom: 36,
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: '"Palatino Linotype", Palatino, serif', fontSize: 16, fontWeight: 700, color: "#3A2A1A", marginBottom: 4 }}>
              🗑️ Clear Imported Books
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: "#6B4E32" }}>
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
              <PlatformCard key={p.id} platform={p} connected={!!connections[p.id]} onConnect={connect} onDisconnect={disconnect} onImportClick={setImportingPlatform} />
            ))}
          </div>
        </div>

        {/* Audiobook Platforms */}
        <div style={{ marginBottom: 40 }}>
          {sectionTitle("🎧 Audiobook Platforms")}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {AUDIO_PLATFORMS.map((p) => (
              <PlatformCard key={p.id} platform={p} connected={!!connections[p.id]} onConnect={connect} onDisconnect={disconnect} onImportClick={setImportingPlatform} />
            ))}
          </div>
        </div>
      </div>

      {importingPlatform && (
        <ImportModal
          platform={importingPlatform}
          mediaType={mediaType}
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
            alert(`✅ ${newBooks.length} book${newBooks.length !== 1 ? 's' : ''} imported successfully!${newBooks.some(b => b._status) ? '\n📊 Reading status also imported from Goodreads!' : ''}`);
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
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 14, position: "relative", zIndex: 50 }}>
      <div style={{ position: "relative", width: 420, maxWidth: "90vw" }}>
        {/* Input row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(to bottom, #fdf6e3, #f5e6c0)",
          border: "1px solid #b8893a",
          borderRadius: showDropdown ? "20px 20px 0 0" : 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.18), inset 0 1px 2px rgba(255,255,255,0.6)",
          padding: "6px 14px",
          transition: "border-radius 0.15s",
        }}>
          <span style={{ fontSize: 15, marginRight: 8, opacity: 0.6, color: "#5a3a1a", userSelect: "none" }}>🔍</span>
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
              fontSize: 14,
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
  const [searchBook, setSearchBook] = useState(null);

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
      {showPlatforms && <PlatformPage onClose={() => setShowPlatforms(false)} mediaType={mediaType} />}

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

      {/* SEARCH RESULT MODAL */}
      {searchBook && (
        <BookModal
          book={searchBook}
          onClose={() => setSearchBook(null)}
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
        />
      )}

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

        {/* SEARCH BAR */}
        <SearchBar mediaType={mediaType} onSelectBook={setSearchBook} />

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
