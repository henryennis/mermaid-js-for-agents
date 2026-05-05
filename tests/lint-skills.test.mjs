import { describe, expect, it } from "vitest";
import { lintSkills, parseFrontmatter } from "../scripts/lint-skills.mjs";

const SAMPLE = `---
name: sample-skill
description: Use when testing frontmatter parsing.
---

<objective>Test</objective>
`;

describe("skill lint", () => {
  it("parses Agent Skills frontmatter", () => {
    const { fields, body } = parseFrontmatter(SAMPLE, "sample-skill/SKILL.md");
    expect(fields.get("name")).toBe("sample-skill");
    expect(fields.get("description")).toContain("testing");
    expect(body).toContain("<objective>");
  });

  it("validates the repository skill and tile", () => {
    const result = lintSkills();
    expect(result.skillFiles.length).toBeGreaterThanOrEqual(1);
    expect(result.errors).toEqual([]);
  });
});
