import { describe, expect, it } from "vitest";
import {
  validatePackedFiles,
  validateRepoManifests
} from "../scripts/validate-harness-manifests.mjs";

describe("harness manifest validation", () => {
  it("accepts current repository manifests", () => {
    expect(validateRepoManifests()).toEqual([]);
  });

  it("detects missing packed files", () => {
    const errors = validatePackedFiles(
      ["package/README.md", "package/tile.json"],
      ["README.md", "tile.json", "skills/mermaid-diagrams/SKILL.md"]
    );
    expect(errors).toEqual(["npm package is missing skills/mermaid-diagrams/SKILL.md"]);
  });
});
