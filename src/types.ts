// Build + validate a minimal A2A AgentCard per agent-cards-spec v0.1.
// Reference: https://github.com/mizcausevic-dev/agent-cards-spec

export type AutonomyLevel = "assistive" | "supervised" | "autonomous";
export type MemoryPersistence = "none" | "session" | "persistent";
export type SideEffectClass = "read" | "mutating" | "external" | "destructive";
export type RefusalBehavior =
  | "refuse_silently"
  | "refuse_and_explain"
  | "escalate_to_human"
  | "redirect_to_alternative";

export interface ToolDeclaration {
  name: string;
  side_effects: SideEffectClass;
  mcp_tool_card_uri?: string;
}

export interface RefusalEntry {
  category: string;
  behavior: RefusalBehavior;
  example_prompts?: string[];
}

export interface ModelDeclaration {
  model: string;
  role?: string;
}

export interface AgentCard {
  agent_card_version: string;
  agent: {
    id: string;
    name: string;
    version: string;
    provider: string;
    description: string;
    homepage?: string;
  };
  capabilities: {
    primary_purpose: string;
    models_used: ModelDeclaration[];
    tools: ToolDeclaration[];
    max_context_tokens: number;
    memory_persistence: MemoryPersistence;
    autonomy_level: AutonomyLevel;
    prompts_used?: string[];
  };
  refusal_taxonomy?: RefusalEntry[];
  evaluations?: Array<{ suite: string; result_uri: string; ran_at: string; passed?: boolean }>;
  deployment: { environment?: string; status?: string; [key: string]: unknown };
  safety_posture: { incident_response_uri?: string; [key: string]: unknown };
}

export interface StampOptions {
  /** agent.id — kebab-case slug. */
  id: string;
  /** agent.name — human-readable. */
  name: string;
  /** agent.version — semver. */
  version: string;
  /** agent.provider. */
  provider: string;
  /** agent.description. */
  description: string;
  /** agent.homepage (optional). */
  homepage?: string;
  /** capabilities.primary_purpose. */
  primary_purpose: string;
  /** capabilities.models_used. */
  models_used: ModelDeclaration[];
  /** capabilities.tools. */
  tools: ToolDeclaration[];
  /** capabilities.max_context_tokens. */
  max_context_tokens: number;
  /** capabilities.memory_persistence — defaults to "none". */
  memory_persistence?: MemoryPersistence;
  /** capabilities.autonomy_level — defaults to "assistive". */
  autonomy_level?: AutonomyLevel;
  /** capabilities.prompts_used. */
  prompts_used?: string[];
  /** refusal_taxonomy. */
  refusal_taxonomy?: RefusalEntry[];
  /** evaluations. */
  evaluations?: Array<{ suite: string; result_uri: string; ran_at: string; passed?: boolean }>;
  /** deployment.environment (e.g., production, staging). */
  environment?: string;
  /** deployment.status (e.g., active, draft). */
  status?: string;
  /** safety_posture.incident_response_uri — REQUIRED when autonomy_level === "autonomous". */
  incident_response_uri?: string;
}
