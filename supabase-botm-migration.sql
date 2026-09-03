-- Run this once in Supabase's SQL Editor to move Book of the Month off the bundled JSON.
-- After this, update the monthly pick by editing this table directly (Table Editor or SQL)
-- — no app rebuild or store resubmission needed ever again.

create table if not exists book_of_the_month (
  month text primary key,           -- "2026-09" format
  title text not null,
  author text not null,
  isbn text,
  cover text,
  genre text,
  goodreads_url text,
  note text,
  created_at timestamptz default now()
);

alter table book_of_the_month enable row level security;

create policy "Public read access"
  on book_of_the_month for select
  using (true);

-- Seed with the current September pick (matches public/book-of-the-month.json)
insert into book_of_the_month (month, title, author, isbn, cover, genre, goodreads_url, note)
values (
  '2026-09',
  'The Knave and the Moon',
  'Rachel Gillig',
  '9780316601849',
  'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1768433474i/241564688.jpg',
  'Fantasy & Romantasy',
  'https://www.goodreads.com/book/show/241564688-the-knave-and-the-moon',
  'Trapped as the king''s bride and grieving a cathedral turned to ruin, Sybil Delling finds an unlikely hope when a fighter with no name and no memory enters the royal tournaments — one who may be her only way out. Rachel Gillig''s gothic sequel to The Knight and the Moth is a tale of faith, sacrifice, and redemption in a kingdom built on secrets.'
)
on conflict (month) do update set
  title = excluded.title,
  author = excluded.author,
  isbn = excluded.isbn,
  cover = excluded.cover,
  genre = excluded.genre,
  goodreads_url = excluded.goodreads_url,
  note = excluded.note;

-- To set next month's pick later, just run:
-- insert into book_of_the_month (month, title, author, isbn, cover, genre, goodreads_url, note)
-- values ('2026-10', '...', '...', '...', '...', '...', '...', '...');
