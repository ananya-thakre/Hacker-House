# HH Goa 2026 — Builder ID / Frame Generator

Built for the Hacker House Goa 2026 shortlisting task ("HH Goa Frame / ID Card
Generator"). Static site, no build step, no backend, no dependencies —
everything is drawn in the browser with the Canvas API.

## Run it

Just open `index.html` in a browser — no npm install, no build.

Camera capture (the Selfie button) needs a **secure context**, so if you want
to test that specific feature, serve the folder instead of double-clicking
the file:

```
# from inside this folder
python -m http.server 5500
# then open http://localhost:5500
```

Any static server works (VS Code "Live Server", `npx serve`, etc). Everything
else — upload, validation, canvas rendering, download, share — works fine
straight from `file://`.

## What it does

- **Three formats**: PFP frame (square), Builder ID (portrait pass), Team
  frame (up to 3 people, landscape).
- **Photo input**: drag-and-drop, file picker, or live selfie via
  `getUserMedia`. JPG/PNG/WebP/HEIC accepted. Drag on the preview canvas to
  reposition, use the zoom slider to scale — nothing is cropped for you.
- **Validated fields**: name, email, phone and X handle are checked live as
  you type, with plain-language inline errors (not silent rejection). Phone
  validation is India-first (`+91` / 10-digit mobile) with a general
  international fallback.
- **Builder class auto-suggestion**: typing a stack (e.g. "React, Node")
  guesses a class ("Interface Alchemist") from a keyword map — editable any
  time, and it stops auto-updating the moment you type your own.
- **Photo treatments**: Natural, Cel (posterize), Riso (two-ink duotone with
  a slight misregistration pass) — all done with canvas pixel manipulation,
  no external image APIs.
- **Three themes**: Goa, Night, Sand — distinct palettes, not just a filter
  swap.
- **Name-derived barcode fingerprint** and a reference code, so every card is
  visually unique without claiming to be a real seat allocation.
- **Save as PNG** and **Post to X** (native share sheet on mobile with the
  image attached; desktop copies the image to your clipboard and opens the
  X composer with the caption pre-filled).
- Buttons stay disabled with a plain-language checklist until every required
  field is valid — you always know exactly what's missing.
- Fully responsive, keyboard-focusable, honors `prefers-reduced-motion`.

## Privacy

No accounts, no analytics, no upload endpoint. Photos, emails and phone
numbers never leave the browser tab — they're only ever drawn onto the
canvas on the visitor's own device.

## Structure

```
index.html        markup + copy
css/styles.css     design tokens + all styling
js/app.js          validation, uploads, canvas rendering, download/share
```

No external JS dependencies. Google Fonts (Fraunces, Space Grotesk,
JetBrains Mono, Noto Sans Devanagari) load from `fonts.googleapis.com` — swap
those `<link>` tags in `index.html` for local files if you need it to work
fully offline.
