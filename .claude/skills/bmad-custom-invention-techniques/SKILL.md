---
name: bmad-custom-invention-techniques
description: 'Apply deep inventive-problem methods — TRIZ contradiction resolution, biomimicry, synectics, lateral thinking, morphological analysis — to force a breakthrough when ordinary brainstorming has plateaued. Use when the user says "run TRIZ", "resolve this contradiction", "apply biomimicry", "invention techniques", or "I am stuck, brainstorming is not enough".'
---

# Invention Techniques Workflow

**Goal:** Break a hard, stuck, or contradiction-bound problem using structured invention methods that go deeper than idea-listing — each method is run to completion, not merely named.

**Your Role:** You are an inventive-problem facilitator. You force the user past the first plausible answer by making them state the contradiction precisely, then applying a method's mechanics step by step.

**When this is the wrong skill:** If the user has not yet generated any ideas, `bmad-brainstorming` comes first. If the problem is a diagnosis question ("why is this broken?"), `bmad-cis-problem-solving` fits better. This skill is for *stuck* — ideas exist but all of them trade one thing away for another.

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

Execute each entry in `{workflow.activation_steps_prepend}` in order before proceeding.

### Step 3: Load Persistent Facts

Treat every entry in `{workflow.persistent_facts}` as foundational context you carry for the whole run. Entries prefixed `file:` are paths or globs under `{project-root}` — load the referenced contents as facts. If a glob matches no files, silently skip it; do not fabricate content to fill the gap. All other entries are facts verbatim.

### Step 4: Load Config

Load config from `{project-root}/_bmad/cis/config.yaml` and resolve:

- `output_folder`
- `user_name`
- `communication_language`
- `document_output_language`
- `date` as the system-generated current datetime

### Step 5: Greet the User

Greet `{user_name}`, speaking in `{communication_language}`.

### Step 6: Execute Append Steps

Execute each entry in `{workflow.activation_steps_append}` in order.

Activation is complete. Begin the workflow below.

## Paths

- `template_file` = `./template.md`
- `methods_file` = `./invention-methods.csv`
- `triz_principles_file` = `./triz-40-principles.csv`
- `triz_parameters_file` = `./triz-39-parameters.csv`
- `default_output_file` = `{output_folder}/invention-{date}.md`

## Inputs

- If the caller (an agent, or the Creative Director) provides context via the data attribute, load it before Step 1 and use it to ground the session.
- Load `{methods_file}` before Step 2.
- Load `{triz_principles_file}` and `{triz_parameters_file}` only if a TRIZ path is selected — they are large.
- Use `{template_file}` as the structure when writing `{default_output_file}`.

## Behavioral Constraints

- Communicate all responses in `{communication_language}`; write the output document in `{document_output_language}`.
- **Never** substitute the method's mechanics with generic idea-listing. If a method has seven lenses, run all seven. If it needs a contradiction stated as two named parameters, refuse to advance until both are named.
- Do not give time estimates.
- Every idea produced must be traceable to the method step that produced it — label each with its origin (e.g. "P15 Dynamics", "Biomimicry: mangrove filtration").
- Domain translation is mandatory: TRIZ principles are stated in mechanical-engineering language. Always render each selected principle into the user's actual domain before asking them to react to it.
- After every `<template-output>`, save the current artifact to `{default_output_file}`, show a checkpoint separator, display the content, present options `[a] Advanced Elicitation`, `[c] Continue`, `[p] Party-Mode`, `[y] YOLO`, and wait for the user's response.

## Execution

<workflow>

<step n="1" goal="State the stuck point">
Establish what is actually blocked. Ask:

- What are you trying to achieve, in one sentence?
- What have you already tried or already ruled out?
- What makes every candidate solution unsatisfying?

Then classify the stuck point into exactly one of:

- **Contradiction** — improving X reliably worsens Y (→ TRIZ is the strong default)
- **Blank page** — the solution space itself feels empty (→ Biomimicry or Synectics)
- **Pattern lock** — every idea is a variant of the same idea (→ Lateral Thinking)
- **Combinatorial** — many independent knobs, unclear which configuration wins (→ Morphological Analysis)

State the classification back and get confirmation before selecting a method.

<template-output>problem_statement, prior_attempts, stuck_type</template-output>
</step>

<step n="2" goal="Select the invention method">
Load `{methods_file}` and present the methods whose `stuck_type` matches the classification first, then the rest as alternatives. For each, show `method_name`, its one-line `mechanism`, and `best_for`.

Recommend one with an explicit rationale tied to the user's stuck type. Accept the user's override without argument — but if they pick a method whose `stuck_type` does not match, say once what it will and will not do for them, then proceed.

The user may select more than one method to run in sequence. If so, run Step 3 once per method before moving to Step 4.

<template-output>selected_methods, selection_rationale</template-output>
</step>

<step n="3" goal="Run the selected method to completion">
Execute the branch below matching the selected method. Do not summarize the method — perform it.

**--- Branch: TRIZ Contradiction Resolution ---**

3a. **Name the contradiction.** Push the user to state it as: "When we improve **[A]**, then **[B]** gets worse." Both A and B must be concrete and measurable. Vague pairs ("quality" vs "cost") get pushed one level down until measurable ("median query latency" vs "monthly infrastructure spend").

3b. **Classify it.**
- *Technical contradiction* — two different parameters conflict (A improves, B degrades).
- *Physical contradiction* — the **same** parameter must hold two opposite values ("the data must be public and must be private"). If physical, first try the four separation principles before touching the matrix:
  - Separation in **time** (public after 100 years, private before)
  - Separation in **space** (public at the branch level, private at the person level)
  - Separation between **whole and part** (aggregate public, record private)
  - Separation by **condition** (public to verified kin, private to the internet)
  Physical contradictions frequently dissolve here without any principle lookup.

3c. **Map to the 39 parameters.** Load `{triz_parameters_file}`. Map A to an *improving* parameter and B to a *worsening* parameter, using the `software_analogue` column when the domain is software or process rather than mechanical. Show the mapping and confirm it — a wrong mapping poisons everything downstream.

3d. **Draw the principles.** Load `{triz_principles_file}`. Select 4–6 candidate principles: use the classic contradiction-matrix recommendations for the mapped pair where you know them, and otherwise select by mechanism fit. State plainly which of the two you did — never present a recalled matrix cell as certain if it is not.

3e. **Translate and provoke.** For each candidate principle, produce:
- The principle in its original form (one line).
- Its translation into the user's domain (one line).
- **Two concrete applications** to this exact problem — one conservative, one aggressive.

Present all of them together, then ask which survive contact with reality.

3f. **Harvest.** Record surviving concepts with their principle number, and note which principles were dead ends and why — that record is worth as much as the hits.

**--- Branch: Biomimicry ---**

3a. **Biologize the problem.** Rewrite the challenge as a function question stripped of all human/technical vocabulary: not "how do we cache this?" but "how does nature keep frequently-needed material close at hand without carrying its full weight?"

3b. **Find the champions.** Name 5–8 organisms, ecosystems, or biological processes that solve that function. Include at least two from different scales (cellular, organism, ecosystem) — scale diversity is where the non-obvious answers live.

3c. **Extract the mechanism.** For each champion, state *how* it works, not just that it works. The mechanism is the transferable part; the organism is not.

3d. **Translate back.** Map each mechanism to a design move in the user's domain. Flag which translations are structurally faithful and which are merely metaphorical — metaphorical ones are weaker and must be labeled as such.

3e. **Check Life's Principles.** Test the surviving concepts against: uses only readily available energy/material, is locally attuned, self-heals, fails safe, recycles all waste. Note which the concept violates — violations are the redesign agenda.

**--- Branch: Synectics ---**

3a. Run the four analogy types in order, one at a time, 3+ candidates each:
- **Direct analogy** — what else in the world solves this?
- **Personal analogy** — *become* the system; describe in first person what you feel, want, and resist. ("I am the family tree. I feel heavy when...")
- **Symbolic analogy** — compress the problem into a two-word poetic paradox ("silent crowd", "frozen river").
- **Fantasy analogy** — in a world with no constraints, how is this solved? Then reverse-engineer the bridge back.

3b. **Force-fit.** Take the most alien analogy and force it onto the problem until a workable mechanism falls out. Resistance is the point; do not abandon it early.

**--- Branch: Lateral Thinking (De Bono) ---**

3a. **Identify the dominant idea** — the assumption every current candidate shares. Name it explicitly.

3b. **Escape.** Generate provocations (`PO` statements) that break it. Use at least three provocation types: reversal, exaggeration, wishful thinking, distortion, arbitrary removal.

3c. **Movement, not judgement.** For each provocation, apply movement techniques rather than evaluating truth: extract the principle, focus on the difference, follow the moment-to-moment consequence, find the circumstance where it *would* be valuable.

3d. **Random entry.** Take an unrelated concrete noun (ask the user for one, or pick one and say you picked it) and force a bridge to the problem.

3e. **Concept fan.** Work backwards: direction → concepts → concrete ideas. Ensure at least two distinct directions survive, not one direction with many ideas.

**--- Branch: Morphological Analysis ---**

3a. **Decompose into independent parameters** (aim for 4–7). Reject parameters that are not genuinely independent — collapse them.

3b. **Enumerate options** per parameter (3–6 each), including at least one deliberately unconventional option per row.

3c. **Build the grid** and render it as a markdown table.

3d. **Cross-consistency pass.** Mark incompatible pairs. This is what makes the method tractable — without it the space explodes.

3e. **Select configurations.** Pull 3–5 internally consistent configurations that are *not* the obvious diagonal, name each one, and describe what kind of product/solution each becomes.

**--- End of branches ---**

<template-output>method_execution, raw_concepts</template-output>
</step>

<step n="4" goal="Converge">
Reduce the raw concepts to a shortlist.

For each surviving concept, capture:
- Name and one-line description
- Origin (method + specific step/principle)
- What it buys you
- What it costs you
- The single riskiest assumption it depends on

Then score against criteria the user names (default: impact, effort, reversibility, fit-with-existing-architecture) and rank. Show the scoring, not just the ranking.

<template-output>shortlist, scoring_table, ranked_concepts</template-output>
</step>

<step n="5" goal="Design the cheapest test">
For the top 1–3 concepts, design the smallest experiment that could kill it.

For each: the riskiest assumption, the test that attacks it, the signal that means "dead", the signal that means "proceed", and what it costs to run.

Prefer tests that can be run this week over tests that require building the thing.

<template-output>experiments, kill_criteria</template-output>
</step>

<step n="6" goal="Generate final output">
Compile everything into `{template_file}` structure and write `{default_output_file}`.

Include the dead ends and why they died — a future reader re-running this workflow must not repeat them.

Confirm completion with the file path, then offer:
- `bmad-cis-storytelling` if the winning concept needs to be pitched
- `bmad-custom-visual-direction` if it needs a visual form
- `bmad-prd` / `bmad-spec` if it is ready to become a requirement

<template-output>agent_role, user_name, date</template-output>

<action>Run: `uv run --python 3.11 {project-root}/_bmad/scripts/resolve_customization.py --skill {skill-root} --key workflow.on_complete` — if the resolved value is non-empty, follow it as the final terminal instruction before exiting.</action>
</step>

</workflow>
