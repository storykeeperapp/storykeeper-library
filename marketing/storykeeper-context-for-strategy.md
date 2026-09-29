# StoryKeeper — Context for Marketing/Subscription Strategy

*Compiled 2026-09-08 from project history, to paste into another chat/tool for a subscription-structure rethink.*

## What the app is
StoryKeeper is a personal digital library tracker — genre bookshelves for ebooks, audiobooks, and physical books, with a decorative tree/nest home screen. Core promise to users: "have your entire digital library all in one place" (deliberately positioned *away* from "reading tracker" framing after early tester feedback — trackers read as a chore, a unified library reads as a keepsake).

Key features: genre bookshelves, book detail pages, favorites, reading stats/calendar, native platform import (Kindle, Kobo, Audible, Nook, Google Play Books, Goodreads, Libby, Scribd, BookFunnel, Libro.fm, Hoopla, Chirp, Graphic Audio), community discussions/book clubs by genre, customizable genre tiles, dark mode, social profile with links.

Built in React/Vite (single-file app), Supabase backend, RevenueCat for native (iOS/Android) purchases, Stripe for web checkout.

## Timeline
- Beta testing: June–July 2026, ~15 testers recruited via Facebook groups, TikTok/Instagram, direct invites.
- Production launch: Android live on Google Play 2026-08-15; iOS followed shortly after.
- As of 2026-09-06: **53 new users** since launch (56 total accounts including pre-launch test/founder accounts).

## Current subscription structure (4 tiers)

**The Reluctant Reader — Free, forever**
- Up to 100 books total (ebooks + audiobooks)
- All genre shelves, ebooks/audiobooks toggle, manual add, basic status tracking, TBR shelf, bio + top books, social links, Book of the Month
- Locked: physical book shelf, platform imports, genre customization, drag-and-drop reordering, community discussions/book clubs, connect social accounts

**The Storyteller — $4.99/mo ($49.99/yr, save $9.89)**
- Up to 250 books total, adds physical book shelf, ebooks/audiobooks/physical toggle, 2 platform imports, genre drag-and-drop, reading status tracking, read-only community view, connect TikTok/socials
- Locked: genre customization, posting in discussions, book clubs, reading stats/calendar

**The Librarian — $9.99/mo ($99.99/yr, save $19.89)**
- Up to 500 books, unlimited platform imports, full genre customization (rename, custom images, re-detect genres), library search, reading stats/calendar, full community profile, cloud sync (2 devices)

**The StoryKeeper — $14.99/mo ($149.99/yr, save $29.89)** — marked "Most Popular"
- Unlimited books, everything in Librarian, unlimited-device cloud sync, priority support, early access to community features, exclusive badge, first access to author Q&As (coming soon)

UK pricing mirrors USD numbers in GBP (£4.99/£9.99/£14.99). Apple Small Business Program approved — 15% commission from day one on iOS; Google Play also at 15%.

## The core problem: zero real paying conversions

**Root cause already diagnosed and partially fixed:** as of early September, an audit found the two headline "premium" reasons to upgrade — platform imports and the physical book shelf — had **no code actually enforcing the tier gate**. Free users could use both for free. The one real limit (100-book cap) is generous enough that casual users rarely hit it. Conclusion: there was no *functional* reason to pay.

A fix was written (tier gating now actually blocks platform imports and physical shelf for free users, prompts upgrade instead) and shipped 2026-09-03. This is very recent — not enough time has passed to see if it moved the needle.

**Verified via direct database query, 2026-09-07/08:** of 56 total accounts, 13 are on a "lifetime free top-tier access" whitelist (founding beta testers, thanked with permanent free access — not part of the addressable paying pool). Of the remaining **43 paying-eligible users, 0 have ever converted to a paid subscription.** (Two rows in the subscription table that looked like paid conversions were confirmed to be Michelle's own sandbox test purchases, not real customers — since deleted.)

**Engagement is NOT the problem** — of all 56 accounts, 64% were active in the last 30 days and 52% in the last 7 days. People are opening and using the app. They're just not paying.

**Funnel analytics were just added (not yet shipped)** to answer *why*: instrumented events for paywall_viewed (tagged by which locked feature triggered it — TBR shelf, platform import, add-to-library, community, genre group, book club, profile), upgrade_cta_clicked, purchase_completed/cancelled/failed, and book_limit_hit. Once live, this will show whether the drop-off is: people never seeing the paywall at all, seeing it and bouncing, or clicking Upgrade and abandoning at checkout.

## Marketing attempts so far
- Cold outreach to book influencers — sent but no responses yet.
- Beta recruitment worked through Facebook groups, TikTok/Instagram, direct invites.
- Formal marketing/advertising push was deliberately deferred until after launch (decision made 2026-08-03: launch first, market after).
- International: RevenueCat customer country data shows early installs outside the US in Australia, Sweden, Slovenia, Finland, Singapore — all high English-proficiency markets, sample too thin (~1-2 installs/country) to prioritize localization yet.

## Open questions for the subscription rethink
- Is $4.99 entry too high a jump from free with only 43 total addressable users and 0 conversions, or is the problem purely that gates weren't enforced until days ago?
- Does a 100-book free cap combined with now-enforced import/physical-shelf gates give free users enough reason to feel the paywall (they may abandon rather than convert if the free tier suddenly feels worse)?
- Book of the Month is currently a free-tier perk — is that pulling value out of the paid tiers?
- No data yet on where in the funnel people drop off (paywall never seen vs. seen-and-bounced vs. checkout-abandoned) — that's the immediate next diagnostic once the analytics build ships.
- 4 tiers may be too many choices for a 43-person addressable pool; worth considering whether a simpler free/paid split would convert better before the app has scale.
