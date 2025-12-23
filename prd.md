📄 PRD — MangaVerse (Phase 1)
Product Name

MangaVerse

Phase

Phase 1 — Track + Discover

1. Product Overview

MangaVerse is a companion platform for manga, manhwa, and anime fans.
It helps users track what they read and discover what to read next, without hosting or distributing copyrighted content.

This phase focuses on core usefulness, simplicity, and fast delivery.

2. Problem Statement

Fans who read multiple manga/manhwa/anime often:

Forget where they left off

Lose track of what they’re reading

Struggle to decide what to read next

Existing platforms are either bloated, social-heavy, or focused on content hosting rather than organization and discovery.

3. Goals (Phase 1)
Primary Goals

Allow users to track their reading progress

Help users discover new series based on mood and preferences

Keep the experience simple and calm

Non-Goals (Explicitly Out of Scope)

Reading manga/manhwa chapters

Hosting or displaying copyrighted images

User authentication

Social features

Lore exploration or power comparisons

4. Target User

A manga/manhwa/anime fan who reads multiple series, forgets where they left off, and wants help deciding what to read next.

5. Pages & Navigation

Global Navigation

Home | Track | Discover | About

6. Core User Flows
Flow A — Track Reading

User opens Track page

Adds a series

Selects type (manga / manhwa / anime)

Sets status (reading / completed / on hold)

Enters last chapter or episode

Saves and sees it in the list

Flow B — Discover Series

User opens Discover page

Selects mood

Selects genres

Chooses completed or ongoing

Clicks “Find Recommendations”

Sees list with short explanations

7. Features (Phase 1 Only)
Track

Add series

Track status

Track last chapter/episode

Personal notes

Edit / delete entries

Discover

Mood-based discovery

Genre filtering

Completed vs ongoing filter

Short recommendation explanations

8. Data Model (Phase 1)
Series {
  title: string
  type: "manga" | "manhwa" | "anime"
  status: "reading" | "completed" | "on-hold"
  lastProgress: string | number
  notes: string
}

9. UX Principles

Text-first

Minimal visuals

No gradients or flashy effects

Fast and distraction-free

Clear empty states

10. Tech Stack

Next.js (App Router)

React

Tailwind CSS

JavaScript only

Local state / localStorage (Phase 1)

11. Definition of Done

Phase 1 is complete when:

Users can track series

Users can discover new series

Navigation works correctly

UI is usable and clean

App is deployed

12. Legal Boundary

MangaVerse does not:

Host manga/manhwa chapters

Display copyrighted pages

Scrape external sites

It is a companion platform, not a reader.

IMPORTANT:
Environment variables are already defined and MUST be used as-is.

Use ONLY:
process.env.OPENROUTER_API_KEY
process.env.OPENROUTER_API_URL

Do not create or reference any other API key or URL variables.
If an AI request is needed, always call:
${process.env.OPENROUTER_API_URL}/chat/completions
with Authorization:
Bearer ${process.env.OPENROUTER_API_KEY}
