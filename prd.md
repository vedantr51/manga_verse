1. Feature Overview

This feature improves data consistency, usability, and scalability by introducing:

Intelligent title suggestions while adding anime/manga

Canonical title storage to prevent duplicates

Search within the user’s library

Visual identification using preview thumbnails

Support for multiple content types (anime / manga / manhwa)

This feature applies to:

Track Your Journey (add/update flow)

Your Library (browse/search flow)

2. Problem Statement
Current Problems

Users manually type titles → spelling variations create duplicates

Example:

“My Hero Academia”

“My Hero : Academia”

“Boku no Hero Academia”

Large libraries become hard to navigate without search

Similar titles cause confusion without visual context

Poor title normalization reduces:

Sync accuracy

Analytics reliability

AI recommendation quality later

3. Goals & Success Criteria
Goals

Make adding titles fast and error-free

Enforce one canonical title per anime

Prevent duplicate records at DB level

Improve UX with previews

Prepare clean data for future AI personalization

Success Criteria

Same anime always maps to the same stored title

No duplicate anime entries caused by formatting differences

Users can find anime quickly in large libraries

UI remains responsive and lightweight

4. Track Your Journey – Title Suggestions
4.1 Title Input Behavior

When the user starts typing a title:

Suggestions appear in real time

Suggestions are fetched from a trusted metadata source

Input becomes selection-based, not free-text

Allowed Inputs

Selecting a suggestion (preferred)

Manual entry only if no match exists (optional, controlled)

4.2 Suggestions Content

Each suggestion should display:

Canonical title (primary)

Alternate titles (optional, secondary)

Preview thumbnail

Content type:

Anime

Manga

Manhwa

This helps users disambiguate titles with similar names.

4.3 Canonical Title Enforcement

When a user selects a suggestion:

The canonical title ID is saved in DB

Display title may vary

Stored identifier does NOT

This ensures:

“My Hero Academia”

“Boku no Hero Academia”
→ both resolve to the same internal record

5. Status Enhancements
5.1 New Status Option

Add a new status under tracking:

watching

Supported statuses now include:

watching

reading

completed

planned

dropped

This aligns with anime-first usage and improves clarity.

6. Your Library – Search & Discovery
6.1 Library Search Bar

Add a search bar at the top of Your Library.

Search should:

Be case-insensitive

Match canonical title

Match alternate titles

Match partial strings

Example:

“hero”

“academia”

“boku”

All should return My Hero Academia.

6.2 Search Result Display

Each result should show:

Thumbnail

Canonical title

Current user status

Progress (if applicable)

This improves scannability in large libraries.

7. Data Model Considerations (Important)
Canonical Content Entity

Introduce (or prepare for) a central content entity:

contentId (canonical)

canonicalTitle

alternateTitles[]

type (anime / manga / manhwa)

thumbnailUrl

UserSeries Relationship

User data references:

userId

contentId

status

progress

timestamps

This prevents duplication by design, not just UX.

8. Non-Goals (Explicit)

This feature does NOT:

Fetch episodes or chapters

Host or stream content

Use AI inference yet

Allow arbitrary free-text duplicates

9. Future Compatibility (Phase 4B+)

This design enables:

Accurate reading pattern analysis

Genre clustering

Clean AI training signals

Cross-device consistency

No refactor required later.

10. Acceptance Checklist

 Suggestions appear while typing

 Titles are selectable, not free-form

 Canonical title stored consistently

 Duplicate anime entries prevented

 Library search works smoothly

 Thumbnails shown in suggestions & search

 Status “watching” available