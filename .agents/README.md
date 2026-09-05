# .agents

Single source of truth for guidance shared by Copilot, Codex and Claude Code.

- `rules/*.instructions.md` — the guidance itself. Frontmatter is just a `description`; no tool reads it, because each one glob-matches rules only from its own hardcoded directory.
  The path globs therefore live in the stubs, and only there — `.github/instructions/*.instructions.md` (`applyTo` string, serves both Copilot in VS Code and the Copilot coding agent)
  and `.claude/rules/*.md` (`paths` list). Keep those two in sync with each other when a rule's scope changes. Codex has no glob scoping at all and reaches the rules through the links in `AGENTS.md`.
- `skills/<name>/SKILL.md` — Agent Skills (https://agentskills.io). Read natively by Copilot and Codex. They replace prompt files.

How each tool reaches this folder:

| Tool                 | Instructions                    | Rules                                                        | Skills                     |
| -------------------- | ------------------------------- | ------------------------------------------------------------ | -------------------------- |
| Codex                | `AGENTS.md`                     | links in `AGENTS.md`                                         | `.agents/skills` (native)  |
| Copilot (VS Code)    | `AGENTS.md`                     | stubs in `.github/instructions/`                             | `.agents/skills` (native)  |
| Copilot coding agent | `AGENTS.md`                     | stubs in `.github/instructions/`                             | `.agents/skills` (native)  |
| Claude Code          | `CLAUDE.md` imports `AGENTS.md` | stubs in `.claude/rules/`                                    | stubs in `.claude/skills/` |

Edit content only here. Never edit the stubs by hand except to keep their frontmatter in sync.
