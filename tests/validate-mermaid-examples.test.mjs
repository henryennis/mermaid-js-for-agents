import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectMermaidExamples,
  collectMermaidFromText,
  parseWithMermaid,
  staticValidate
} from "../scripts/validate-mermaid-examples.mjs";

describe("Mermaid example validation", () => {
  it("finds Mermaid examples in package docs and skills", () => {
    const examples = collectMermaidExamples();
    expect(examples.length).toBeGreaterThan(0);
    expect(examples.some((example) => example.file === "README.md")).toBe(true);
  });

  it("collects fenced and raw stdin examples", () => {
    expect(
      collectMermaidFromText("```mermaid\nflowchart TD\n  A --> B\n```", { file: "doc.md" })
    ).toHaveLength(1);
    expect(collectMermaidExamples({ stdinText: "sequenceDiagram\n  A->>B: Hi" })[0]).toMatchObject({
      file: "<stdin>",
      line: 1
    });
  });

  it("collects Mermaid from explicit files", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "mermaid-validation-"));
    writeFileSync(path.join(dir, "diagram.mmd"), "flowchart TD\n  A --> B\n");
    writeFileSync(path.join(dir, "doc.md"), "```mermaid\nsequenceDiagram\n  A->>B: Hi\n```\n");

    expect(collectMermaidExamples({ root: dir, files: ["diagram.mmd", "doc.md"] })).toHaveLength(2);
  });

  it("statically accepts known starters and rejects unknown starters", () => {
    expect(staticValidate({ code: "flowchart TD\nA-->B" })).toBeNull();
    expect(staticValidate({ code: "notMermaid\nA-->B" })).toMatch(/unknown Mermaid starter/);
  });

  it("parser-validates valid and invalid diagrams when mermaid is installed", async () => {
    const missingParser = await parseWithMermaid([
      { file: "valid.mmd", line: 1, code: "flowchart TD\nA-->B" }
    ]);
    if (missingParser[0]?.includes("mermaid package is not installed")) {
      expect(missingParser[0]).toMatch(/mermaid package is not installed/);
      return;
    }

    await expect(
      parseWithMermaid([{ file: "valid.mmd", line: 1, code: "flowchart TD\nA-->B" }])
    ).resolves.toEqual([]);
    const errors = await parseWithMermaid([
      { file: "invalid.mmd", line: 1, code: "sequenceDiagram\nA->>B Missing colon" }
    ]);
    expect(errors[0]).toMatch(/invalid\.mmd:1: Mermaid parser rejected block/);
  });
});
