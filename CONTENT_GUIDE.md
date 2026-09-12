# Adding a new topic

This app reads content, it doesn't have any UI for authoring it. To add a topic,
create a new JSON file and register it — no app code changes needed.

## 1. Create `content/<topic-id>.json`

```json
{
  "id": "topic-id",
  "title": "Human-Readable Title",
  "color": "#2F6F6B",
  "modules": [
    {
      "id": "module-id",
      "label": "Module Label",
      "summary": "Optional — one sentence framing the whole module. Shown as a standalone card before the first lesson.",
      "takeaway": "Optional — one sentence, the single thing worth remembering. Shown as a standalone card after the last lesson.",
      "lessons": [
        {
          "id": "lesson-id",
          "title": "Lesson title",
          "why": "One sentence on why this matters — shown under the title.",
          "facts": [
            "Bite-sized fact one.",
            "Bite-sized fact two.",
            "Bite-sized fact three."
          ],
          "detail": "Optional — a longer paragraph or two of prose for Study mode. Shown collapsed behind a 'Read more' toggle in Feed mode.",
          "mustRemember": "Optional — one critical sentence, shown in a highlighted banner on the card.",
          "media": {
            "type": "youtube",
            "id": "dQw4w9WgXcQ",
            "caption": "Optional — small caption shown under the embed."
          }
        }
      ]
    }
  ]
}
```

Rules:
- `id` values must be unique **within** the file (lesson ids only need to be unique inside their topic — the app namespaces them internally).
- `facts` should be 2–4 short bullet points — these are what show up in Feed mode, so keep them genuinely bite-sized.
- `detail` is optional. Use it when a lesson deserves more depth than three bullets — it's the difference between "Study mode" and "Feed mode" for that lesson.
- `mustRemember` is optional — reserve it for the one thing in that lesson worth flagging, not every lesson needs one.
- `color` is a hex value used as a light accent on that topic's cards and tab.
- **Prefer more, smaller cards over one dense card.** If a lesson is
  covering more than one genuinely separate idea (a checklist, *and* a
  named technique with several steps, *and* a special-case fact), split
  it into one card per idea rather than compressing all of it into 2–4
  bullets. A named technique with distinct steps (e.g. "the 5 S's")
  deserves one card per step, not one card listing all of them.
- `media` is optional, lesson-level. `type` is `"youtube"` (with a
  video `id`, the part after `v=` in the URL) or `"image"` (with a
  `url` instead of `id`) for a still image or gif. Shown inline, only
  on the currently-open card. **Never invent a media URL/id.** Only add
  one you (or whoever is authoring) have actually found and can point
  to a real source for — if a technique would benefit from a demo but
  you don't have a verified link, say so instead of guessing, and leave
  `media` off.
- `summary`/`takeaway` are optional, module-level (siblings of
  `lessons`, not inside it). Use them when a module covers enough
  ground that a one-line "here's the shape of this" at the start and
  "here's the one thing to remember" at the end genuinely helps — not
  every module needs them. They render as their own distinct card and
  don't count toward that module's learned-progress fraction or enter
  the Feed-mode pool.

## 2. Register it in `content/index.json`

```json
{
  "topics": [
    { "id": "dad-prep", "file": "dad-prep.json" },
    { "id": "voice-ai", "file": "voice-ai.json" },
    { "id": "topic-id", "file": "topic-id.json" }
  ]
}
```

## 3. Commit and push

```bash
git add content/topic-id.json content/index.json
git commit -m "Add topic-id content"
git push
```

GitHub Pages rebuilds automatically. The new topic appears as a tab in Study mode
and its lessons join the shuffled pool in Feed mode immediately.

## Asking Claude Code to write a topic for you

A good prompt: "Read CONTENT_GUIDE.md, then write a new topic JSON file on
[subject] with 4–6 modules and 3–5 lessons each, following the existing tone in
content/voice-ai.json. Register it in content/index.json."
