---
description: Turn recent work, research, or notes into bite-sized cards for The Deck
argument-hint: [topic-id] [source: pasted notes, a file path, or a short description of what to draw from]
---

You are adding content to "The Deck," a personal learning app whose schema and
conventions are defined in `CONTENT_GUIDE.md` at the repo root. Read that file
first if you haven't already this session.

Input: `$ARGUMENTS`

The first word is the target topic id (e.g. `voice-ai`, `dad-prep`). Everything
after it is the source material — this could be pasted text, a description of
a conversation or document to draw from, or a file path to read.

## What to do

1. Read `content/index.json` to see if the topic id already exists.
   - If it exists, read that topic's JSON file to match its existing tone,
     module structure, and depth.
   - If it doesn't exist, this is a new topic — pick a short human-readable
     title and a hex color distinct from existing topics, and decide on 2-4
     starting modules based on the source material.

2. Read or process the source material given in `$ARGUMENTS`. If it's a file
   path, read the file. If it's a description of something I did (a call,
   a research session, a decision made), work from what's stated — do not
   invent specifics I didn't provide.

3. Extract the genuinely useful, non-obvious takeaways — not a summary of
   everything, just what's worth remembering later. Favor fewer, sharper
   cards over padding out a round number. If the source material is thin,
   producing 2 good cards is correct; don't stretch it to 6.

   That said, favor more, smaller cards over one dense card once there's
   real material: if what you're drafting covers more than one genuinely
   separate idea (a checklist, *and* a named technique with several
   distinct steps, *and* a special-case fact), split it into one card
   per idea rather than compressing all of it into a single card's 2-4
   bullets. A technique with named steps (e.g. "the 5 S's") deserves one
   card per step, not one card listing all of them.

4. Draft each new lesson following the exact schema in CONTENT_GUIDE.md:
   - `title` — short, specific, not generic
   - `why` — one sentence on why this is worth knowing, not a restatement of the title
   - `facts` — 2-4 short bullets, genuinely bite-sized (this is what shows in
     Feed mode — if a bullet needs a sub-clause to make sense, it's too dense)
   - `detail` — optional, only include if the topic genuinely rewards a
     paragraph of depth beyond the bullets
   - `mustRemember` — optional, reserve for the single most critical fact in
     that lesson if there is one; most lessons don't need it
   - `media` — optional, only when a technique genuinely benefits from a
     video/gif demo. Never invent a URL or video id — if you don't have a
     verified real link, leave `media` off and tell me a demo would help
     rather than guessing one.

   If a module ends up covering enough ground to want a "here's the
   shape of this" framing at the start and a "here's the one thing to
   remember" at the end, add `summary`/`takeaway` on the module (not
   every module needs them — see CONTENT_GUIDE.md).

   Assign each new lesson a unique `id` within its module (short, lowercase,
   e.g. `va13`), and place it in the most fitting existing module, or a new
   module if none fits.

5. Validate the resulting JSON is well-formed and lesson ids don't collide
   with existing ones in the file.

6. Show me a short summary of what you're about to add — module, lesson
   titles, and count — before writing anything. Wait for me to confirm.

7. Once confirmed:
   - Write the updated (or new) topic JSON file.
   - If it's a new topic, add it to `content/index.json`.
   - Commit with a message like `Add cards: <topic> — <short description>`.
   - Push.

Do not fabricate facts, statistics, or specifics that weren't in the source
material or CONTENT_GUIDE.md's existing content — if something needs a citation
or a number you're not sure of, flag it to me instead of guessing.
