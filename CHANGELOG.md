# Changelog

## v0.1.0 — 2026-05-26

- Initial release: `stamp(opts)` → spec-conforming A2A AgentCard from a `StampOptions` struct.
- Enforces the full v0.1 envelope: id kebab-case regex, version semver-shaped, max_context_tokens positive integer, models_used non-empty, tool side_effects ∈ {read, mutating, external, destructive}, autonomy_level enum, memory_persistence enum.
- **Enforces the spec's allOf clause**: `autonomy_level=autonomous` → `safety_posture.incident_response_uri` is required, with a clear error message that quotes the offending field and references the spec clause.
- CLI: `agent-card-stamp <stamp-options.json> [--out card.json]`.
- Two fixtures: a Research Assistant (supervised + session memory + 2 read tools + a refusal entry) and a Deployment Orchestrator (autonomous + persistent + 2 destructive + 1 external tools, with IRU and an eval).
- Sibling of `prompt-provenance-stamp` for the A2A side.
- Node 20/22 CI (lint, typecheck, coverage, build, demo, `npm audit`), AGPL-3.0-or-later, Dependabot.
