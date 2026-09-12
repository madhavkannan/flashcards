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
          "mustRemember": "Optional — one critical sentence, shown in a highlighted banner on the card."
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
