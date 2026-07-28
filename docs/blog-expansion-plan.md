# Blog expansion plan (Reeldemo)

Goal: grow each post to a long-form guide (~2,000–3,500 words for comparisons; how-tos and workflow posts aim for depth with concrete steps), researched on the web, drafted section-by-section, then run through **klaut.pro** English / AI-slop audit + polish before publishing to `blog/`.

Status (2026-07-28): All 10 posts expanded. Klaut batch audit `reeldemo-blog-expansion-language-audit-batch-b67af54f` scored 5.0 (good_enough) after rhythm fixes. Ableton Wavetable corrected to Suite-only per Ableton compare-editions.

## Pipeline (every post)

1. **Plan** — H2 outline, research questions, primary keyword, CTA
2. **Research** — WebSearch / official docs (Ableton, Vital, Serum, Surge, GitHub)
3. **Draft** — write one section at a time into HTML (anti-slop: no em dashes, no “not X but Y”, producer language)
4. **Klaut** — `research_paper_start` (markdown-tech-report) → paste sections → `research_paper_audit_english` → `research_paper_polish_english` → apply fixes back to HTML
5. **Ship** — update `posts.json` excerpt if needed, sitemap `lastmod`, commit + push

## Global constraints

- Audience: Ableton producers / sound designers (not SaaS / Instagram Reels)
- ReelSynth = free wavetable **instrument** + Ableton plugin; MIT; Rust; compatible with ReelStudio
- Honest comparisons; no fake features or license keys
- Links: `/reelsynth/#download`, `/studio/`, GitHub where useful

---

## Post plans

### 1. ReelSynth vs Vital vs Serum
- **Slug:** `reelsynth-vs-vital-vs-serum-wavetable-comparison`
- **Keyword:** wavetable synth comparison / Serum vs Vital vs free
- **Sections:** Intro + who this is for → Price & licensing → Sound design depth → Ableton workflow → Presets & ecosystem → Import / ownership → CPU & formats → Decision matrix → FAQ
- **Research:** Vital pricing/features, Serum product page, Ableton plugin formats, ReelSynth repo capabilities

### 2. Free wavetable synths compared (Ableton)
- **Slug:** `free-wavetable-synths-compared-ableton`
- **Sections:** Why free matters → Ableton Wavetable → Vital free → Surge XT → ReelSynth → Side-by-side table → Picking a starter stack → FAQ
- **Research:** Surge XT docs, Ableton Wavetable manual, Vital free tier limits

### 3. Ableton Wavetable vs ReelSynth
- **Slug:** `ableton-wavetable-vs-reelsynth`
- **Sections:** Same job, different homes → Install friction → Modulation in Live → Tables & imports → Licensing / handoff → When to use both → FAQ
- **Research:** Ableton Wavetable device manual, Live edition matrix

### 4. Best free Ableton synth plugins
- **Slug:** `best-free-ableton-synth-plugins`
- **Sections:** How we chose → ReelSynth → Vital → Surge XT → Stock Live instruments → Building a free rack → Install tips → FAQ
- **Research:** Current free plugin recommendations, format notes (VST3/AU)

### 5. Open source wavetable synthesizers compared
- **Slug:** `open-source-wavetable-synthesizers-compared`
- **Sections:** Why license matters → ReelSynth (MIT) → Surge XT (GPL) → Other OSS → Producer license cheat sheet → Ableton use → FAQ
- **Research:** SPDX/licenses, Surge XT license, ReelSynth MIT

### 6. Free Wavetable Synthesizer for Ableton (get started)
- **Slug:** `free-wavetable-synthesizer-for-ableton-get-started-with-reelsynth`
- **Sections:** What wavetable is → Download & install (Win/Mac/Linux) → Load in Live → First patch recipe → Macros & automation → Vital/Serum import teaser → CPU tips → Troubleshooting → FAQ
- **Research:** Ableton plug-in preferences, common Gatekeeper/VST scan issues

### 7. Import Vital and Serum wavetables
- **Slug:** `import-vital-serum-wavetables-ableton-reelsynth`
- **Sections:** Why import → Format matrix → Export from Vital → Export from Serum → Import & load in Live → Reshape after import → Library hygiene → FAQ
- **Research:** Vital export docs, Serum wavetable export, ReelSynth interop

### 8. From reference track to editable Ableton session
- **Slug:** `from-reference-track-to-editable-ableton-session`
- **Sections:** Bounce vs session → Capture intent → Warp & markers → Stems → Editable MIDI/racks → Review loop → Collect All and Save → ReelStudio fit → FAQ
- **Research:** Ableton warping, Collect All and Save, stem workflow

### 9. Keep control in Ableton (older post)
- **Slug:** `from-reference-to-editable-session-agentic-music-production-without-giving-up-co`
- **Sections:** Rewrite longer with producer framing → Constraints before generate → Reference parse → Guardrails → Review → FAQ (anti-slop pass)
- **Research:** Same as post 8 + chat-driven compose practices

### 10. ReelSynth instrument overview
- **Slug:** `reelsynth-open-wavetable-synthesizer-instrument`
- **Sections:** What it is → Architecture (plain language) → Ableton plugin → Formats → Open source / Rust → Stack with ReelStudio → Get started CTA → FAQ
- **Research:** GitHub README, product page facts

---

## Execution order

Comparisons first (1→5), then how-tos (6→7), then Ableton workflow (8→9), then overview (10).
