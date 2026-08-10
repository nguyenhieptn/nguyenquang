---
name: bmad-custom-visual-direction
description: 'Establish the visual identity of a product before any UI is built — aesthetic direction, colour system, typography (with Vietnamese and Hán-Nôm script support), motion, texture, and a rendered style tile. Use when the user says "define the visual direction", "art direction", "moodboard", "chọn phong cách thiết kế", "design language", or "what should this look like".'
---

# Visual Direction Workflow

**Goal:** Produce a written, decided visual direction — three distinct candidate directions, one chosen, then a concrete system (colour, type, spacing, motion, texture, imagery) rendered as a style tile you can look at.

**Your Role:** You are an art director. You commit to an aesthetic point of view and defend it with reasons tied to audience and content — not a menu of safe options.

**Boundary:** This skill decides *what it should look like*. It does not build UI. Once the direction is signed off, `frontend-design` carries it into implementation and `bmad-ux` carries it into flows and patterns.

## Conventions

- Bare paths (e.g. `template.md`) resolve from the skill root.
- `{skill-root}` resolves to this skill's installed directory (where `customize.toml` lives).
- `{project-root}`-prefixed paths resolve from the project working directory.
- `{skill-name}` resolves to the skill directory's basename.

## On Activation

### Step 1: Resolve the Workflow Block

Run: `uv run --python 3.11 {project-root}/_bmad/scripts/resolve_customization.py --skill {skill-root} --key workflow`

**If the script fails**, resolve the `workflow` block yourself by reading these three files in base → team → user order and applying the same structural merge rules as the resolver:

1. `{skill-root}/customize.toml` — defaults
2. `{project-root}/_bmad/custom/{skill-name}.toml` — team overrides
3. `{project-root}/_bmad/custom/{skill-name}.user.toml` — personal overrides

Any missing file is skipped. Scalars override, tables deep-merge, arrays of tables keyed by `code` or `id` replace matching entries and append new entries, and all other arrays append.

### Step 2: Execute Prepend Steps

Execute each entry in `{workflow.activation_steps_prepend}` in order.

### Step 3: Load Persistent Facts

Treat every entry in `{workflow.persistent_facts}` as foundational context for the whole run. Entries prefixed `file:` are paths or globs under `{project-root}` — load their contents as facts; skip silently if nothing matches. All other entries are facts verbatim.

### Step 4: Load Config

Load config from `{project-root}/_bmad/cis/config.yaml` and resolve:

- `output_folder`
- `user_name`
- `communication_language`
- `document_output_language`
- `visual_tools` — capability level for rendered artifacts (`minimal` | `intermediate` | `advanced`)
- `date` as the system-generated current datetime

### Step 5: Greet the User

Greet `{user_name}`, speaking in `{communication_language}`.

### Step 6: Execute Append Steps

Execute each entry in `{workflow.activation_steps_append}` in order.

Activation is complete. Begin the workflow below.

## Paths

- `template_file` = `./template.md`
- `directions_file` = `./aesthetic-directions.csv`
- `style_tile_template` = `./style-tile.html`
- `default_output_file` = `{output_folder}/visual-direction-{date}.md`
- `default_style_tile` = `{output_folder}/style-tile-{date}.html`

## Inputs

- If the caller provides context via the data attribute, load it before Step 1.
- Read any existing `{project-root}/docs/project.md`, PRD, or UX spec for content, audience, and tone before Step 1 — the visual direction must serve real content, not imagined content.
- Load `{directions_file}` before Step 3.

## Behavioral Constraints

- Communicate in `{communication_language}`; write documents in `{document_output_language}`.
- **Never present a direction as a colour list.** A direction is a point of view — a name, a one-line thesis, a reference world, an emotional target, and only then the mechanics.
- **Contrast is not optional.** Every text/background pair in the final system must be checked against WCAG AA (4.5:1 body, 3:1 large text and UI boundaries) and the computed ratio stated. Do not claim a ratio you have not computed.
- **Script support is a hard gate, not a nicety.** Before proposing any typeface, verify it covers every script the product actually renders. For Vietnamese that means full diacritic support including the stacked marks (ề ộ ữ ẳ ỡ) — many otherwise-common display faces break on them. For Hán-Nôm sources, the face must cover CJK Unified Ideographs and, if Nôm characters appear, Extension B and beyond (e.g. Nôm Na Tống). State the fallback stack explicitly.
- **Both themes or one, deliberately.** State whether the product commits to a single theme or supports light and dark, and define tokens accordingly. Never leave it implicit.
- Ban generic-AI defaults unless argued for: purple-to-blue gradients, glassmorphism everywhere, one accent colour applied to everything, emoji as iconography, centred hero with a stock illustration.
- Do not give time estimates.
- After every `<template-output>`, save the artifact to `{default_output_file}`, show a checkpoint separator, display the content, present `[a] Advanced Elicitation`, `[c] Continue`, `[p] Party-Mode`, `[y] YOLO`, and wait.

## Execution

<workflow>

<step n="1" goal="Brief: audience, content, feeling">
Establish what the visuals must actually carry. Ask:

- Who looks at this, and what is the widest gap between two of them? (e.g. an 80-year-old clan elder and a 20-year-old on a phone)
- What is the primary content type? (dense data, long prose, photographs, diagrams, a graph/tree)
- What should someone feel in the first three seconds? Name the feeling in one word, then a second word that qualifies it.
- What must it explicitly *not* feel like?
- Any fixed constraints: existing brand, required colours, print output, screen sizes, offline use, dark rooms, projectors?
- Where will it be seen at its most hostile? (bright sunlight, a projector at a family gathering, a cheap Android screen)

Push back on the answer "modern and clean" — it is not a direction. Ask what specifically.

<template-output>audience, content_type, emotional_target, anti_target, hard_constraints, hostile_context</template-output>
</step>

<step n="2" goal="Content inventory">
Before styling anything, list what actually has to be rendered. Walk the real product surface and enumerate:

- Text kinds (headings, long-form narrative, names, dates, tabular data, annotations)
- Scripts and character sets in play (Latin with Vietnamese diacritics, Han characters, Nôm, numerals, lunar-calendar notation)
- Non-text objects (the graph/tree, maps, photographs of varying quality, scanned documents, QR codes)
- States that need visual encoding (verified vs unverified, living vs deceased, pending approval, conflicted data)

The states list matters most: every state named here needs a colour or form token later, and every token you invent later without a state here is decoration.

<template-output>content_inventory, scripts_required, state_encodings_needed</template-output>
</step>

<step n="3" goal="Three candidate directions">
Load `{directions_file}`. Compose **three genuinely different** directions — not three tints of the same idea. At least one must be uncomfortable for the user.

For each direction give:

1. **Name** — two or three words, evocative, memorable
2. **Thesis** — one sentence on the point of view
3. **Reference world** — where this visual language already lives (a printed object, an era, a discipline, a place). Be concrete; no "modern SaaS".
4. **What it does for this audience** — tied to Step 1
5. **Mechanics sketch** — colour temperature and role, type pairing, density, shape language, texture, motion character
6. **The cost** — what this direction makes harder or gives up. Every direction has one; state it.

Then give your recommendation with a reason. Ask the user to choose, or to graft: "direction A's colour, direction C's typography" is a valid answer and often the right one.

<template-output>direction_a, direction_b, direction_c, recommendation, chosen_direction</template-output>
</step>

<step n="4" goal="Colour system">
Build the system from the chosen direction.

Define tokens by **role**, never by hue name:
- Surface levels (page, raised, sunken)
- Content (primary text, secondary text, disabled)
- Border and divider
- Accent (primary action) and, only if the content requires it, secondary accent
- Semantic: success, warning, danger, info
- **State encodings from Step 2** — every one of them

Rules:
- Give each token a hex value plus the role it plays.
- Compute and state the contrast ratio for every text-on-surface pair and every UI boundary. Mark pass/fail against AA.
- If light and dark are both supported, define the full light palette first, then redefine only what changes in dark. Verify contrast independently in both — a colour that passes on white rarely passes on near-black.
- Check the palette against the hostile context from Step 1 (projector washout, sunlight, cheap panels with crushed blacks).
- Check for colour-blind safety on any pair where colour alone carries meaning; add a second cue (shape, icon, label) wherever it does.

<template-output>colour_tokens, contrast_audit, theme_strategy, colourblind_notes</template-output>
</step>

<step n="5" goal="Typography">
Choose a pairing (or a single family with range) and prove it works.

For each face, state:
- Family name, weights used, and licence/availability (self-host vs Google Fonts vs system)
- **Script coverage verified against Step 2** — Vietnamese diacritics rendered correctly, CJK/Nôm coverage where required. If a display face fails Vietnamese, say so and either drop it or scope it to headings that contain no diacritics — and be honest that this is fragile.
- Fallback stack in order

Then define the scale:
- Type scale with sizes, line heights, and the ratio used
- Measure (characters per line) for long-form reading
- Heading hierarchy — how many levels, and how each is distinguished (size, weight, colour, spacing, rule)
- Numerals: lining vs old-style, tabular where data aligns
- Minimum readable size for the oldest audience member; if elders are in scope, set the body floor higher than the usual 16px default and say what it is

<template-output>typefaces, script_coverage_check, type_scale, hierarchy_rules</template-output>
</step>

<step n="6" goal="Form, space, texture, motion">
Define the rest of the language:

- **Spacing scale** — the base unit and the steps
- **Shape language** — corner radii, border weights, whether the system is line-led or surface-led
- **Elevation** — shadow, border, or tone shift; pick one primary method and stay with it
- **Texture** — paper grain, ink bleed, silk, rice-paper, none. State how it is produced (SVG noise, image, CSS) and where it must be absent (behind data, behind small text)
- **Imagery treatment** — how photographs of wildly different age and quality are unified (duotone, warm wash, consistent frame, deliberate border)
- **Iconography** — line vs solid, weight, source, and whether any culturally specific marks are used
- **Motion** — durations, easing, and what motion means in this system. Name what never animates.
- **Reduced motion and reduced transparency** behaviour

<template-output>spacing, shape_language, elevation, texture, imagery_treatment, iconography, motion</template-output>
</step>

<step n="7" goal="Apply to the two hardest surfaces">
An identity is only real once it survives the hardest screen. Pick the two hardest surfaces in this product and describe each concretely — layout, what dominates, what recedes, how the state encodings from Step 2 appear, what happens on a 360px phone.

Choose the surfaces that are genuinely hard: the data-dense one, the graph/visualisation one, or the one an elder must use unaided. Not the marketing page.

If a chart, graph, or dashboard is among them, invoke the `dataviz` skill for the visualisation palette and mark specs rather than inventing chart colours here.

<template-output>surface_1, surface_2, responsive_notes</template-output>
</step>

<step n="8" goal="Render the style tile">
Read `{style_tile_template}` and fill it with the decided system: palette swatches with hex and contrast ratios, the type scale in real sentences using the product's actual scripts, buttons, state chips, a texture sample, and a paragraph of real content at real measure.

Requirements:
- Self-contained: inline CSS, no external fonts or assets. If a chosen webfont cannot be embedded, render with the fallback stack and label it clearly as a substitute.
- The specimen text must include Vietnamese diacritics (and Han/Nôm characters if in scope) so broken glyphs are visible immediately.
- Include both themes if both are supported.

Write to `{default_style_tile}`.

If `{visual_tools}` is `advanced`, also offer to publish it as an Artifact so it can be viewed and shared. If `minimal`, skip the HTML and produce a markdown swatch table instead.

<template-output>style_tile_path</template-output>
</step>

<step n="9" goal="Handoff">
Write `{default_output_file}` using `{template_file}`.

Close with:
- The three rules a developer must never break in this system
- What is deliberately undecided and who decides it
- Next skills: `frontend-design` for implementation, `bmad-ux` for flows and patterns, `dataviz` for any chart work

Confirm completion with both file paths.

<template-output>non_negotiables, open_questions, agent_role, user_name, date</template-output>

<action>Run: `uv run --python 3.11 {project-root}/_bmad/scripts/resolve_customization.py --skill {skill-root} --key workflow.on_complete` — if the resolved value is non-empty, follow it as the final terminal instruction before exiting.</action>
</step>

</workflow>
