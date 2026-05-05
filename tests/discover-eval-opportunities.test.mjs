import { describe, expect, it } from "vitest";
import {
  buildEvalOpportunities,
  formatEvalBacklog,
  parseCoverageMatrix,
  summarizeEvalCoverage
} from "../scripts/discover-eval-opportunities.mjs";

const coverageMarkdown = `# Coverage

| Upstream source dir | Starter(s) | Status | Renderer portability | Notes |
| --- | --- | --- | --- | --- |
| block | \`block-beta\` | beta | Limited | Requires caveat. |
| class | \`classDiagram\` | supported | Broad | Good for code shape. |
| flowchart | \`flowchart\` | supported | Broad | Default choice. |
| mystery | unknown | needs research | Unknown | Research first. |
`;

const upstream = {
  snapshotKey: "abc123",
  releaseEvidence: {
    release: { tag_name: "mermaid@11.14.0" },
    releaseHighlights: ["- Add new TreeView diagram"],
    diagramDirectories: [
      { name: "block" },
      { name: "class" },
      { name: "flowchart" },
      { name: "mystery" },
      { name: "treeView" }
    ]
  }
};

const evalScenarios = [
  {
    id: "flowchart-readme",
    hasMetadata: true,
    metadata: {
      diagramTypes: ["flowchart"],
      modes: ["create"],
      riskAreas: ["syntax"]
    }
  },
  {
    id: "block-renderer-caveat",
    hasMetadata: true,
    metadata: {
      diagramTypes: ["block"],
      modes: ["caveat"],
      riskAreas: ["beta syntax", "renderer support"]
    }
  }
];

describe("discover-eval-opportunities", () => {
  it("parses the coverage matrix table", () => {
    expect(parseCoverageMatrix(coverageMarkdown)).toEqual([
      {
        diagramType: "block",
        starters: "block-beta",
        status: "beta",
        rendererPortability: "Limited",
        notes: "Requires caveat."
      },
      {
        diagramType: "class",
        starters: "classDiagram",
        status: "supported",
        rendererPortability: "Broad",
        notes: "Good for code shape."
      },
      {
        diagramType: "flowchart",
        starters: "flowchart",
        status: "supported",
        rendererPortability: "Broad",
        notes: "Default choice."
      },
      {
        diagramType: "mystery",
        starters: "unknown",
        status: "needs research",
        rendererPortability: "Unknown",
        notes: "Research first."
      }
    ]);
  });

  it("summarizes eval metadata by diagram type", () => {
    const coverage = summarizeEvalCoverage(evalScenarios);

    expect([...coverage.get("flowchart").modes]).toEqual(["create"]);
    expect([...coverage.get("block").riskAreas]).toEqual(["beta syntax", "renderer support"]);
  });

  it("builds deterministic opportunities from upstream, coverage, and eval metadata", () => {
    const opportunities = buildEvalOpportunities({
      upstream,
      coverageRows: parseCoverageMatrix(coverageMarkdown),
      evalScenarios
    });

    expect(opportunities.map((opportunity) => opportunity.id)).toEqual([
      "tree-view-coverage-matrix-missing",
      "class-create-coverage",
      "class-repair-coverage",
      "flowchart-repair-coverage",
      "mystery-syntax-research"
    ]);
    expect(opportunities[0]).toMatchObject({
      priority: "P0",
      diagramTypes: ["treeView"],
      evidence: ["upstream:treeView", "coverage:missing", "release-highlight:tree-view"]
    });
  });

  it("formats a readable backlog", () => {
    const opportunities = buildEvalOpportunities({
      upstream,
      coverageRows: parseCoverageMatrix(coverageMarkdown),
      evalScenarios
    });
    const backlog = formatEvalBacklog({
      schemaVersion: 1,
      generatedFrom: {
        upstreamSnapshotKey: "abc123",
        upstreamRelease: "mermaid@11.14.0",
        diagramDirectories: 5,
        evalScenarios: 2,
        evalScenariosWithMetadata: 2
      },
      opportunities
    });

    expect(backlog).toContain("# Eval opportunity backlog");
    expect(backlog).toContain("Counts by priority: P0 1, P1 3, P2 1, P3 0");
    expect(backlog).toContain("### class-create-coverage");
  });
});
