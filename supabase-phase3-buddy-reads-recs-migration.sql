-- Phase 3: buddy reads with chapter-locked comments, and community recommendations.
-- RUN in Supabase on 2026-11-15 and verified (4 tables with RLS, 16 policies after the 2026-11-16 read-own fix, 7 functions
-- callable by signed-in users only). Safe to run again.
-- Nothing here changes or reads existing tables.
--
-- 1. Buddy reads (buddy_reads, buddy_read_members, buddy_read_comments)
--    Private, invite-only reading groups for one book. Readers join with a short invite
--    code. Each member records the chapter they've reached. A comment is tagged with a
--    chapter, and the database only returns it to members who have reached that chapter
--    (or who wrote it), so spoilers can't leak even if the app has a bug.
--    Up to 20 members per buddy read.
--
-- 2. Community recommendations (shared_ratings + two functions)
--    Strictly opt-in. A reader who turns on "Share my ratings anonymously" has their star
--    ratings copied here. Each reader can read only their own rows (needed for saving
--    and deleting them); nobody can read anyone else's. Two functions return only combined results (book, number
--    of readers, average rating), never who rated what, and only for books rated by at
--    least 2 (recommendations) or 3 (popular) different readers.

-- 1. Buddy reads ---------------------------------------------------------------------------
create table if not exists buddy_reads (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  author text check (char_length(author) <= 300),
  isbn text check (char_length(isbn) <= 20),
  cover_url text check (char_length(cover_url) <= 1000),
  total_chapters int check (total_chapters between 1 and 500),
  start_date date,
  invite_code text not null unique default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)),
  created_at timestamptz not null default now()
);

create table if not exists buddy_read_members (
  buddy_read_id uuid not null references buddy_reads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text check (char_length(username) <= 60),
  current_chapter int not null default 0 check (current_chapter between 0 and 500),
  finished_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (buddy_read_id, user_id)
);
create index if not exists buddy_read_members_user on buddy_read_members(user_id);

create table if not exists buddy_read_comments (
  id uuid primary key default gen_random_uuid(),
  buddy_read_id uuid not null references buddy_reads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text check (char_length(username) <= 60),
  chapter int not null check (chapter between 0 and 500),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists buddy_read_comments_read on buddy_read_comments(buddy_read_id, chapter);

alter table buddy_reads enable row level security;
alter table buddy_read_members enable row level security;
alter table buddy_read_comments enable row level security;

-- Membership checks run as definer so the policies below don't recurse into themselves.
create or replace function is_buddy_member(p_read uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from buddy_read_members where buddy_read_id = p_read and user_id = auth.uid());
$$;

create or replace function my_buddy_chapter(p_read uuid) returns int
language sql stable security definer set search_path = public as $$
  select coalesce((select current_chapter from buddy_read_members where buddy_read_id = p_read and user_id = auth.uid()), -1);
$$;

-- buddy_reads: members (and the creator) can see it; anyone signed in can start one;
-- only the creator can edit or delete it.
drop policy if exists "members read buddy_reads" on buddy_reads;
create policy "members read buddy_reads" on buddy_reads for select
  using (created_by = auth.uid() or is_buddy_member(id));
drop policy if exists "create buddy_reads" on buddy_reads;
create policy "create buddy_reads" on buddy_reads for insert with check (created_by = auth.uid());
drop policy if exists "creator updates buddy_reads" on buddy_reads;
create policy "creator updates buddy_reads" on buddy_reads for update using (created_by = auth.uid()) with check (created_by = auth.uid());
drop policy if exists "creator deletes buddy_reads" on buddy_reads;
create policy "creator deletes buddy_reads" on buddy_reads for delete using (created_by = auth.uid());

-- buddy_read_members: members see each other; you can update your own progress or leave.
-- Joining goes through join_buddy_read() below, except the creator adding themselves.
drop policy if exists "members read buddy_read_members" on buddy_read_members;
create policy "members read buddy_read_members" on buddy_read_members for select using (is_buddy_member(buddy_read_id));
drop policy if exists "creator joins own buddy_read" on buddy_read_members;
create policy "creator joins own buddy_read" on buddy_read_members for insert
  with check (user_id = auth.uid() and exists (select 1 from buddy_reads r where r.id = buddy_read_id and r.created_by = auth.uid()));
drop policy if exists "update own buddy progress" on buddy_read_members;
create policy "update own buddy progress" on buddy_read_members for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "leave buddy_read" on buddy_read_members;
create policy "leave buddy_read" on buddy_read_members for delete using (user_id = auth.uid());

-- buddy_read_comments: the chapter lock. You see a comment once you've reached its chapter.
drop policy if exists "chapter-locked read buddy_read_comments" on buddy_read_comments;
create policy "chapter-locked read buddy_read_comments" on buddy_read_comments for select
  using (user_id = auth.uid() or (is_buddy_member(buddy_read_id) and chapter <= my_buddy_chapter(buddy_read_id)));
drop policy if exists "members post buddy_read_comments" on buddy_read_comments;
create policy "members post buddy_read_comments" on buddy_read_comments for insert
  with check (user_id = auth.uid() and is_buddy_member(buddy_read_id));
drop policy if exists "delete own buddy_read_comments" on buddy_read_comments;
create policy "delete own buddy_read_comments" on buddy_read_comments for delete using (user_id = auth.uid());

-- What a reader sees before joining: the book only, never the members or comments.
create or replace function preview_buddy_read(p_code text)
returns table (id uuid, title text, author text, cover_url text, total_chapters int, member_count bigint)
language sql stable security definer set search_path = public as $$
  select r.id, r.title, r.author, r.cover_url, r.total_chapters,
         (select count(*) from buddy_read_members m where m.buddy_read_id = r.id)
  from buddy_reads r where r.invite_code = upper(trim(p_code));
$$;

create or replace function join_buddy_read(p_code text, p_username text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_count int;
begin
  if auth.uid() is null then raise exception 'Sign in to join a buddy read'; end if;
  select id into v_id from buddy_reads where invite_code = upper(trim(p_code));
  if v_id is null then raise exception 'No buddy read has that code'; end if;
  select count(*) into v_count from buddy_read_members where buddy_read_id = v_id;
  if v_count >= 20 and not exists (select 1 from buddy_read_members where buddy_read_id = v_id and user_id = auth.uid()) then
    raise exception 'This buddy read is full';
  end if;
  insert into buddy_read_members (buddy_read_id, user_id, username)
    values (v_id, auth.uid(), left(p_username, 60))
    on conflict (buddy_read_id, user_id) do nothing;
  return v_id;
end $$;

-- How many comments are still locked for you, per chapter, so the app can say
-- "2 comments unlock at chapter 9" without showing them.
create or replace function buddy_locked_counts(p_read uuid)
returns table (chapter int, comments bigint)
language sql stable security definer set search_path = public as $$
  select c.chapter, count(*) from buddy_read_comments c
  where c.buddy_read_id = p_read and is_buddy_member(p_read)
    and c.chapter > my_buddy_chapter(p_read) and c.user_id <> auth.uid()
  group by c.chapter order by c.chapter;
$$;

-- Functions are callable by everyone by default; limit these to signed-in readers.
revoke all on function is_buddy_member(uuid) from public;
revoke all on function my_buddy_chapter(uuid) from public;
revoke all on function preview_buddy_read(text) from public;
revoke all on function join_buddy_read(text, text) from public;
revoke all on function buddy_locked_counts(uuid) from public;
grant execute on function is_buddy_member(uuid) to authenticated;
grant execute on function my_buddy_chapter(uuid) to authenticated;
grant execute on function preview_buddy_read(text) to authenticated;
grant execute on function join_buddy_read(text, text) to authenticated;
grant execute on function buddy_locked_counts(uuid) to authenticated;
-- Supabase also grants new functions to the anon role directly, which "from public" doesn't cover.
revoke execute on function is_buddy_member(uuid), my_buddy_chapter(uuid), preview_buddy_read(text),
  join_buddy_read(text, text), buddy_locked_counts(uuid) from anon;

-- 2. Community recommendations -------------------------------------------------------------
create table if not exists shared_ratings (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_key text not null check (char_length(book_key) between 1 and 400), -- ISBN, or "title|author" lowercased
  title text not null check (char_length(title) <= 300),
  author text check (char_length(author) <= 300),
  isbn text check (char_length(isbn) <= 20),
  rating smallint not null check (rating between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (user_id, book_key)
);
create index if not exists shared_ratings_book on shared_ratings(book_key);
alter table shared_ratings enable row level security;

-- Readers may add, read, change and remove only their own rows. Other readers' ratings only
-- come out through the two functions below, already combined.
-- The read-own policy was added 2026-11-16: without it, saving ratings (insert ... on conflict
-- do update) failed with "new row violates row-level security policy", and deleting found nothing.
drop policy if exists "read own shared_ratings" on shared_ratings;
create policy "read own shared_ratings" on shared_ratings for select using (user_id = auth.uid());
drop policy if exists "insert own shared_ratings" on shared_ratings;
create policy "insert own shared_ratings" on shared_ratings for insert with check (user_id = auth.uid());
drop policy if exists "update own shared_ratings" on shared_ratings;
create policy "update own shared_ratings" on shared_ratings for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "delete own shared_ratings" on shared_ratings;
create policy "delete own shared_ratings" on shared_ratings for delete using (user_id = auth.uid());

-- "Readers who loved your favorites also loved…": other readers who gave 4-5 stars to any of
-- p_keys, and what else they gave 4-5 stars to. Excludes p_keys and p_exclude (books already
-- owned). Only books loved by at least 2 such readers.
create or replace function book_recommendations(p_keys text[], p_exclude text[] default '{}', p_limit int default 12)
returns table (book_key text, title text, author text, isbn text, readers bigint, avg_rating numeric)
language sql stable security definer set search_path = public as $$
  with similar_readers as (
    select distinct user_id from shared_ratings
    where book_key = any(p_keys) and rating >= 4 and user_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  )
  select s.book_key, max(s.title), max(s.author), max(s.isbn), count(distinct s.user_id), round(avg(s.rating), 1)
  from shared_ratings s join similar_readers r on r.user_id = s.user_id
  where s.rating >= 4 and not (s.book_key = any(p_keys)) and not (s.book_key = any(p_exclude))
  group by s.book_key
  having count(distinct s.user_id) >= 2
  order by count(distinct s.user_id) desc, avg(s.rating) desc
  limit least(greatest(p_limit, 1), 30);
$$;

-- Fallback while there are few readers: the best-rated books across the community.
create or replace function popular_with_readers(p_exclude text[] default '{}', p_limit int default 12)
returns table (book_key text, title text, author text, isbn text, readers bigint, avg_rating numeric)
language sql stable security definer set search_path = public as $$
  select s.book_key, max(s.title), max(s.author), max(s.isbn), count(distinct s.user_id), round(avg(s.rating), 1)
  from shared_ratings s
  where not (s.book_key = any(p_exclude))
  group by s.book_key
  having count(distinct s.user_id) >= 3 and avg(s.rating) >= 4
  order by avg(s.rating) desc, count(distinct s.user_id) desc
  limit least(greatest(p_limit, 1), 30);
$$;

revoke all on function book_recommendations(text[], text[], int) from public;
revoke all on function popular_with_readers(text[], int) from public;
grant execute on function book_recommendations(text[], text[], int) to authenticated;
grant execute on function popular_with_readers(text[], int) to authenticated;
revoke execute on function book_recommendations(text[], text[], int), popular_with_readers(text[], int) from anon;
