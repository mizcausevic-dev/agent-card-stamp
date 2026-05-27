import type { AgentCard, StampOptions } from "./types.js";

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:[-+].+)?$/;

const VALID_AUTONOMY = new Set(["assistive", "supervised", "autonomous"]);
const VALID_MEMORY = new Set(["none", "session", "persistent"]);
const VALID_SIDE_EFFECTS = new Set(["read", "mutating", "external", "destructive"]);

/**
 * Build a minimal-valid AgentCard v0.1 from a StampOptions struct.
 *
 * Validates:
 *   - agent.id is kebab-case (≥ 2 chars)
 *   - agent.version is semver-shaped
 *   - max_context_tokens is a positive integer
 *   - autonomy_level / memory_persistence are valid enum values
 *   - every tool's side_effects is valid
 *   - **autonomous → incident_response_uri is required** (spec allOf clause)
 *
 * Pure: no I/O, no network. The caller passes everything in; this just
 * shapes it into a spec-conforming card and surfaces a clear error on
 * any constraint violation.
 */
export function stamp(opts: StampOptions): AgentCard {
  if (!ID_PATTERN.test(opts.id) || opts.id.length < 2) {
    throw new Error(`agent.id "${opts.id}" must be kebab-case (at least 2 chars)`);
  }
  if (!SEMVER_PATTERN.test(opts.version)) {
    throw new Error(`agent.version "${opts.version}" must be semver-shaped`);
  }
  if (!Number.isInteger(opts.max_context_tokens) || opts.max_context_tokens <= 0) {
    throw new Error(`max_context_tokens must be a positive integer, got ${opts.max_context_tokens}`);
  }
  if (!opts.name) throw new Error("agent.name is required");
  if (!opts.provider) throw new Error("agent.provider is required");
  if (!opts.description) throw new Error("agent.description is required");
  if (!opts.primary_purpose) throw new Error("capabilities.primary_purpose is required");
  if (!Array.isArray(opts.models_used) || opts.models_used.length === 0) {
    throw new Error("capabilities.models_used must list at least one model");
  }
  if (!Array.isArray(opts.tools)) throw new Error("capabilities.tools must be an array");

  const autonomy = opts.autonomy_level ?? "assistive";
  const memory = opts.memory_persistence ?? "none";
  if (!VALID_AUTONOMY.has(autonomy)) {
    throw new Error(`autonomy_level "${autonomy}" must be one of: assistive, supervised, autonomous`);
  }
  if (!VALID_MEMORY.has(memory)) {
    throw new Error(`memory_persistence "${memory}" must be one of: none, session, persistent`);
  }
  for (const t of opts.tools) {
    if (!t.name) throw new Error("every tool must have a non-empty name");
    if (!VALID_SIDE_EFFECTS.has(t.side_effects)) {
      throw new Error(`tool "${t.name}" side_effects "${t.side_effects}" must be one of: read, mutating, external, destructive`);
    }
  }

  // The spec's allOf clause: autonomous → incident_response_uri required.
  if (autonomy === "autonomous" && !opts.incident_response_uri) {
    throw new Error(
      "autonomy_level=autonomous requires safety_posture.incident_response_uri (per agent-cards-spec v0.1 allOf clause)"
    );
  }

  const card: AgentCard = {
    agent_card_version: "0.1",
    agent: {
      id: opts.id,
      name: opts.name,
      version: opts.version,
      provider: opts.provider,
      description: opts.description
    },
    capabilities: {
      primary_purpose: opts.primary_purpose,
      models_used: opts.models_used,
      tools: opts.tools,
      max_context_tokens: opts.max_context_tokens,
      memory_persistence: memory,
      autonomy_level: autonomy
    },
    deployment: {},
    safety_posture: {}
  };
  if (opts.homepage) card.agent.homepage = opts.homepage;
  if (opts.prompts_used && opts.prompts_used.length > 0) card.capabilities.prompts_used = opts.prompts_used;
  if (opts.refusal_taxonomy && opts.refusal_taxonomy.length > 0) card.refusal_taxonomy = opts.refusal_taxonomy;
  if (opts.evaluations && opts.evaluations.length > 0) card.evaluations = opts.evaluations;
  if (opts.environment) card.deployment.environment = opts.environment;
  if (opts.status) card.deployment.status = opts.status;
  if (opts.incident_response_uri) card.safety_posture.incident_response_uri = opts.incident_response_uri;

  return card;
}
