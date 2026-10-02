# Psychiatry MCQ Bank

A self-contained MCQ practice app with **immediate feedback** — tap an answer and you
instantly see whether it was right, which option was correct, and the full justification.

No build step, no dependencies, no server. Open `index.html` and it runs.

## Contents

164 questions across four source papers:

| Section | Questions |
|---|---|
| Section 1 · Psychiatry Interim Assessment I | 12 (Q4–15) |
| Section 2 · Psychiatry Interim Assessment II (Aug 2019) | 16 (Q1–16) |
| Section 3 · School of Medicine MCQs (Sept 2020) | 96 (Q1–70, Q75–100) |
| Section 4 · Others — General Psychiatry | 40 (Q1–40) |

## Features

- **Immediate feedback** — options lock on selection, the correct answer is revealed,
  and the explanation panel opens automatically.
- **Modes** — full bank of 164, or a single section at a time.
- **Toggles** — shuffle question order, auto-advance after answering, retry missed only.
- **Live tracking** — correct / missed / accuracy counters, progress bar, and a clickable
  dot grid (green = correct, red = missed) for jumping around.
- **Results screen** — percentage, per-section breakdown, and a full review of every
  answered question with all options marked.
- **Progress is saved** in `localStorage`, so you can close the tab and resume.
- **Dark and light themes.**
- **Keyboard shortcuts** — `1`–`5` select an option, `Enter` next, `Backspace` previous.

## Project layout

```
index.html          markup for setup / quiz / results screens
style.css           all styling, dark + light themes
app.js              quiz engine, scoring, persistence, rendering
data/section1.js    Section 1 questions
data/section2.js    Section 2 questions
data/section3a.js   Section 3, questions 1–40
data/section3b.js   Section 3, questions 41–100
data/section4.js    Section 4 questions
```

### Adding questions

Append an object to the `BANK` array in any `data/section3b.js`-style file:

```js
{
  s: "Section 4 · General Psychiatry",  // section label
  n: 41,                                 // question number within that section
  q: "Question stem",
  o: { A: "First option", B: "Second option", C: "Third option" },
  a: ["B"],                              // correct key(s); array accepts more than one
  e: "Why the answer is correct..."      // explanation, one point per line
}
```

## Running locally

Just open `index.html` in a browser, or serve the folder:

```
python -m http.server 8000
```

## Live site

**https://seworm.github.io/PsychiatryMCQ/**

Hosted with GitHub Pages straight from the `main` branch — every commit to `main`
rebuilds the site automatically.