# The Deck

A doomscroll replacement: bite-sized, multi-topic learning content you author
yourself (by hand or via Claude Code) and push to GitHub. No backend, no build
step — plain HTML/CSS/JS reading JSON files.

Two ways to consume the same content:
- **Study mode** — pick a topic, work through it module by module, in order.
  For when you've sat down with 15–20 minutes.
- **Feed mode** — an endless shuffled stream of cards pulled from every topic,
  unseen ones first. For when you'd otherwise be doomscrolling.

Progress ("learned" / "flagged to remember") is saved in the browser via
`localStorage`, per device.

## Run locally

Any static file server works, e.g.:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy on GitHub Pages

1. Push this folder to a GitHub repo.
2. Repo Settings → Pages → Deploy from branch → `main` / root.
3. Visit the given `github.io` URL on your phone, then "Add to Home Screen"
   for an app-like icon (the included `manifest.json` enables this).

## Adding new content

The fastest path: open this repo in Claude Code and run

```
/newcards voice-ai [paste notes, describe what you just did, or give a file path]
```

This runs `.claude/commands/newcards.md`, which reads `CONTENT_GUIDE.md`,
drafts new cards from whatever you hand it, shows you a summary, and — once
you confirm — commits and pushes. Works for an existing topic id (adds to it)
or a new one (creates it and registers it).

The realistic habit: whenever you finish something you'd otherwise forget —
a Sierra/Deepgram prep session, a decision you and Alisha made, an article
that actually taught you something — spend 2 minutes running `/newcards`
against it before you move on, rather than treating "add content" as its own
separate task.

See [CONTENT_GUIDE.md](./CONTENT_GUIDE.md) for the underlying schema if you
ever want to write a card by hand instead.

## Structure

```
index.html          — app shell
styles.css           — the "field manual" visual style
app.js               — loads content/, renders Study & Feed modes
manifest.json         — add-to-home-screen support
content/
  index.json          — registry of topics
  dad-prep.json        — pregnancy/newborn prep
  voice-ai.json        — voice AI fundamentals for Sierra/Deepgram prep
CONTENT_GUIDE.md      — schema + instructions for adding topics
.claude/commands/
  newcards.md           — the /newcards Claude Code command
```
