# Creative Studio — custom BMad module

Hand-authored creative agents and workflows for this project. Not produced by the BMad installer.

## What is in it

| Kind | Skill | Who / what |
|---|---|---|
| Agent | `bmad-custom-agent-creative-director` | **Iris** 🎬 — Creative Director. Diagnoses the creative problem, routes it to the right method, synthesises the result into one decision. Runs the Creative Sprint. |
| Agent | `bmad-custom-agent-toc-su` | **Tú Lâm** 📜 — Chủ biên Tộc Sử. Clan-facing writing: chương tộc sử, tiểu sử, văn khấn, đặt tên Hán-Việt, xưng hô, đố vui, kịch bản giỗ Tổ, tin Zalo OA. |
| Workflow | `bmad-custom-invention-techniques` | TRIZ contradiction resolution (39 parameters + 40 principles with software analogues), biomimicry, synectics, lateral thinking, morphological analysis. |
| Workflow | `bmad-custom-visual-direction` | Aesthetic direction → colour system with computed contrast → typography with Vietnamese/Hán-Nôm coverage gates → form, texture, motion → rendered style tile. |

Files live in `.claude/skills/bmad-custom-*/`. Each has `SKILL.md` + `customize.toml`, plus assets (CSV catalogues, `template.md`, `style-tile.html`).

## How it relates to the shipped CIS module

CIS covers **breadth** — brainstorming, design thinking, innovation strategy, problem solving, storytelling, presentations. Creative Studio adds:

1. **Depth where CIS has a one-liner.** `bmad-cis-problem-solving` lists "TRIZ Contradiction Matrix" as a single CSV row. `bmad-custom-invention-techniques` actually runs it — parameter mapping, principle selection, mandatory domain translation, dead-end recording.
2. **Routing.** CIS has six agents and no one who decides which to use. Iris does that, and closes the loop with a decision.
3. **Visual identity.** Nothing in CIS or BMM decides what the product looks like before `frontend-design` starts building it.
4. **Project voice.** Tú Lâm carries the genealogy project's register, sourcing discipline, and cultural constraints so they do not have to be re-explained each session.

## Invoking

- By name: "cho tôi nói chuyện với Iris" / "gọi Tú Lâm" / "chạy TRIZ" / "chốt visual direction"
- By skill: `bmad-custom-agent-creative-director`, `bmad-custom-agent-toc-su`, `bmad-custom-invention-techniques`, `bmad-custom-visual-direction`
- Via `bmad-help` — they are registered in `_bmad/_config/bmad-help.csv` under the module **Creative Studio**

## Customising

Edit `customize.toml` inside each skill directory directly — these are custom skills, so the installer will not overwrite them. Layered overrides still work the standard way:

- `_bmad/custom/<skill-name>.toml` — team, committed
- `_bmad/custom/<skill-name>.user.toml` — personal, gitignored

Agent descriptors are registered in `_bmad/custom/config.toml` under `[agents.*]`.

## After re-running the BMad installer

Two installer-managed files are patched by hand and **will be regenerated**, dropping these entries:

- `_bmad/_config/bmad-help.csv` — re-append the five `Creative Studio` rows (kept in `_bmad/custom/creative-studio-help-rows.csv`)
- `_bmad/_config/skill-manifest.csv` — not patched; these skills work without it, they simply do not appear in installer inventory

`.claude/skills/bmad-custom-*/` and `_bmad/custom/config.toml` are never touched by the installer.

## Dependencies

The activation step in each SKILL.md runs `uv run --python 3.11 _bmad/scripts/resolve_customization.py`. The system `python3` on this machine is 3.9, which lacks `tomllib` — hence `uv`. Every SKILL.md also carries a manual fallback if the script cannot run.
