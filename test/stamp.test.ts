import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { stamp } from "../src/stamp.js";
import type { StampOptions } from "../src/types.js";

const here = fileURLToPath(new URL(".", import.meta.url));

function load(name: string): StampOptions {
  return JSON.parse(readFileSync(`${here}/../fixtures/${name}`, "utf8")) as StampOptions;
}

describe("stamp", () => {
  it("builds a card from the research-assistant fixture", () => {
    const card = stamp(load("research-assistant.json"));
    expect(card.agent_card_version).toBe("0.1");
    expect(card.agent.id).toBe("research-assistant");
    expect(card.agent.version).toBe("1.1.0");
    expect(card.agent.homepage).toBe("https://example.com/research-assistant");
    expect(card.capabilities.autonomy_level).toBe("supervised");
    expect(card.capabilities.memory_persistence).toBe("session");
    expect(card.capabilities.tools).toHaveLength(2);
    expect(card.capabilities.prompts_used).toHaveLength(1);
    expect(card.refusal_taxonomy).toHaveLength(1);
    expect(card.evaluations).toHaveLength(1);
    expect(card.deployment.environment).toBe("production");
    expect(card.deployment.status).toBe("active");
  });

  it("builds an autonomous card when IRU is supplied", () => {
    const card = stamp(load("autonomous-agent.json"));
    expect(card.capabilities.autonomy_level).toBe("autonomous");
    expect(card.safety_posture.incident_response_uri).toBe("https://example.com/incidents/deploy-orchestrator");
  });

  it("rejects autonomous without IRU (allOf clause)", () => {
    const opts = load("autonomous-agent.json");
    delete opts.incident_response_uri;
    expect(() => stamp(opts)).toThrow(/incident_response_uri/);
  });

  it("rejects an invalid id (non-kebab-case)", () => {
    const opts = load("research-assistant.json");
    opts.id = "Research_Assistant!";
    expect(() => stamp(opts)).toThrow(/kebab-case/);
  });

  it("rejects single-character id (< 2 chars)", () => {
    const opts = load("research-assistant.json");
    opts.id = "x";
    expect(() => stamp(opts)).toThrow(/at least 2 chars/);
  });

  it("rejects an invalid version (not semver-shaped)", () => {
    const opts = load("research-assistant.json");
    opts.version = "1.0";
    expect(() => stamp(opts)).toThrow(/semver-shaped/);
  });

  it("rejects max_context_tokens that is not a positive integer", () => {
    const opts = load("research-assistant.json");
    opts.max_context_tokens = 0;
    expect(() => stamp(opts)).toThrow(/positive integer/);
    opts.max_context_tokens = 1.5;
    expect(() => stamp(opts)).toThrow(/positive integer/);
  });

  it("rejects invalid enum values", () => {
    const opts = load("research-assistant.json");
    (opts as unknown as { autonomy_level: string }).autonomy_level = "swarm";
    expect(() => stamp(opts)).toThrow(/autonomy_level/);
  });

  it("rejects invalid memory_persistence", () => {
    const opts = load("research-assistant.json");
    (opts as unknown as { memory_persistence: string }).memory_persistence = "permanent";
    expect(() => stamp(opts)).toThrow(/memory_persistence/);
  });

  it("rejects tool with unknown side_effects", () => {
    const opts = load("research-assistant.json");
    opts.tools = [{ name: "x", side_effects: "weird" as unknown as "read" }];
    expect(() => stamp(opts)).toThrow(/side_effects/);
  });

  it("rejects tool with no name", () => {
    const opts = load("research-assistant.json");
    opts.tools = [{ name: "", side_effects: "read" }];
    expect(() => stamp(opts)).toThrow(/non-empty name/);
  });

  it("requires name / provider / description / primary_purpose / models_used", () => {
    const base = load("research-assistant.json");
    expect(() => stamp({ ...base, name: "" })).toThrow(/agent.name/);
    expect(() => stamp({ ...base, provider: "" })).toThrow(/agent.provider/);
    expect(() => stamp({ ...base, description: "" })).toThrow(/agent.description/);
    expect(() => stamp({ ...base, primary_purpose: "" })).toThrow(/primary_purpose/);
    expect(() => stamp({ ...base, models_used: [] })).toThrow(/models_used/);
    expect(() => stamp({ ...base, tools: undefined as unknown as [] })).toThrow(/tools must be an array/);
  });

  it("defaults autonomy_level and memory_persistence", () => {
    const card = stamp({
      id: "minimal-agent",
      name: "Minimal",
      version: "0.1.0",
      provider: "kg",
      description: "Minimal viable agent",
      primary_purpose: "test",
      models_used: [{ model: "claude" }],
      tools: [],
      max_context_tokens: 4000
    });
    expect(card.capabilities.autonomy_level).toBe("assistive");
    expect(card.capabilities.memory_persistence).toBe("none");
    expect(card.refusal_taxonomy).toBeUndefined();
    expect(card.evaluations).toBeUndefined();
    expect(card.agent.homepage).toBeUndefined();
  });

  it("supports semver pre-release and build-metadata", () => {
    const card = stamp({ ...load("research-assistant.json"), version: "2.0.0-beta.1+abc" });
    expect(card.agent.version).toBe("2.0.0-beta.1+abc");
  });

  it("emits a card that matches v0.1 envelope shape", () => {
    const card = stamp(load("research-assistant.json"));
    expect(card.agent_card_version).toBe("0.1");
    expect(card.agent).toBeDefined();
    expect(card.capabilities).toBeDefined();
    expect(card.deployment).toBeDefined();
    expect(card.safety_posture).toBeDefined();
  });

  it("omits prompts_used when input array is empty", () => {
    const opts = load("research-assistant.json");
    opts.prompts_used = [];
    const card = stamp(opts);
    expect(card.capabilities.prompts_used).toBeUndefined();
  });
});
