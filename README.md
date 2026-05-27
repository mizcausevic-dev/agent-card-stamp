# agent-card-stamp

[![CI](https://github.com/mizcausevic-dev/agent-card-stamp/actions/workflows/ci.yml/badge.svg)](https://github.com/mizcausevic-dev/agent-card-stamp/actions/workflows/ci.yml)
[![License: AGPL-3.0-or-later](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)

Build and validate a minimal A2A **AgentCard** per [agent-cards-spec v0.1](https://github.com/mizcausevic-dev/agent-cards-spec) from a `StampOptions` struct.

Sibling of [`prompt-provenance-stamp`](https://github.com/mizcausevic-dev/prompt-provenance-stamp) — same role, different protocol. Part of the [Kinetic Gain Suite](https://suite.kineticgain.com/).

---

## Why

When you author an AgentCard by hand, it's easy to drift from the spec — typos in enum values, an `autonomy_level=autonomous` without the matching `incident_response_uri` (the spec's allOf clause), a tool with `side_effects` set to something that doesn't exist. This tool takes a struct, validates every constraint, and emits a card you can trust.

The error messages quote the actual offending field and what the spec requires, so reviewers see exactly why a card was rejected.

## Validation rules

| Rule | Behavior on violation |
|---|---|
| `agent.id` matches `^[a-z0-9][a-z0-9-]*[a-z0-9]$` and ≥ 2 chars | error: `agent.id "..." must be kebab-case (at least 2 chars)` |
| `agent.version` matches `^\d+\.\d+\.\d+(?:[-+].+)?$` | error: `agent.version "..." must be semver-shaped` |
| `max_context_tokens` is a positive integer | error: `max_context_tokens must be a positive integer, got ...` |
| Required strings non-empty: `name`, `provider`, `description`, `primary_purpose` | error per-field |
| `models_used` has ≥ 1 entry | error |
| `tools` is an array; each tool has a name and a valid `side_effects` enum value | error |
| `autonomy_level` ∈ `{assistive, supervised, autonomous}` | error |
| `memory_persistence` ∈ `{none, session, persistent}` | error |
| **`autonomy_level=autonomous` → `incident_response_uri` required** | error: `... requires safety_posture.incident_response_uri (per agent-cards-spec v0.1 allOf clause)` |

## CLI

```
agent-card-stamp <stamp-options.json> [--out card.json]
```

The input JSON is a `StampOptions` struct (see types) — flat fields like `id`, `name`, `version`, `tools[]`, `max_context_tokens`, `incident_response_uri`. The output is a spec-conforming AgentCard.

Exit codes:

- `0` — card written
- `2` — validation error

## Library

```ts
import { stamp } from "agent-card-stamp";
import type { StampOptions } from "agent-card-stamp";

const opts: StampOptions = {
  id: "my-agent",
  name: "My Agent",
  version: "1.0.0",
  provider: "acme",
  description: "Does the thing.",
  primary_purpose: "Do the thing",
  models_used: [{ model: "claude-sonnet-4", role: "main" }],
  tools: [{ name: "fetch", side_effects: "external" }],
  max_context_tokens: 128000,
  memory_persistence: "session",
  autonomy_level: "supervised"
};

const card = stamp(opts);  // throws on any spec violation
```

## Composes with

- [**`agent-cards-spec`**](https://github.com/mizcausevic-dev/agent-cards-spec) — the schema this enforces.
- [**`agent-card-diff`**](https://github.com/mizcausevic-dev/agent-card-diff) — diff two stamped cards across versions.
- [**`agent-card-readme-generator`**](https://github.com/mizcausevic-dev/agent-card-readme-generator) — render a stamped card as Markdown.
- [**`agent-card-fleet-summary`**](https://github.com/mizcausevic-dev/agent-card-fleet-summary) — fleet-level analysis of stamped cards.
- [**`prompt-provenance-stamp`**](https://github.com/mizcausevic-dev/prompt-provenance-stamp) — sibling for the prompt side.

## License

[AGPL-3.0-or-later](LICENSE)
