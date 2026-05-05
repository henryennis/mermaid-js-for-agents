import { describe, expect, it } from "vitest";
import { lintAgenticWorkflows } from "../scripts/lint-agentic-workflows.mjs";

describe("GitHub workflow lint", () => {
  it("validates checked-in workflow sources", () => {
    const result = lintAgenticWorkflows();
    expect(result.checked).toBeGreaterThanOrEqual(1);
    expect(result.errors).toEqual([]);
  });
});
