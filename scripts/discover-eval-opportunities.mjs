#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import prettier from "prettier";

const ROOT = process.cwd();
const UPSTREAM_FILE = "data/mermaid-upstream.json";
const COVERAGE_FILE = "skills/mermaid-diagrams/references/coverage-matrix.md";
const EVALS_DIR = "evals";
const OPPORTUNITIES_FILE = "data/eval-opportunities.json";
const BACKLOG_FILE = "docs/eval-backlog.md";

const PRIORITY_RANK = new Map([
  ["P0", 0],
  ["P1", 1],
  ["P2", 2],
  ["P3", 3]
]);

function readJson(relativePath, root = ROOT) {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8"));
}

function writeIfChanged(file, content) {
  try {
    if (readFileSync(file, "utf8") === content) return false;
  } catch {
    // File does not exist yet.
  }
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
  return true;
}

function slug(value) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const DISPLAY_NAMES = {
  c4: "C4",
  er: "ER",
  git: "Git graph",
  treeView: "TreeView",
  xychart: "XY chart"
};

function title(value) {
  return (
    DISPLAY_NAMES[value] ??
    value
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function normalizeCell(cell) {
  return cell
    .replace(/`/g, "")
    .replace(/<br\s*\/?>/gi, ", ")
    .trim();
}

export function parseCoverageMatrix(markdown) {
  const rows = [];

  for (const line of markdown.split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) continue;

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => normalizeCell(cell));

    if (cells.length < 5) continue;
    if (cells[0] === "Upstream source dir") continue;
    if (cells[0].replace(/-/g, "").trim() === "") continue;

    rows.push({
      diagramType: cells[0],
      starters: cells[1],
      status: cells[2].toLowerCase(),
      rendererPortability: cells[3],
      notes: cells[4]
    });
  }

  return rows;
}

function loadEvalScenarios(root = ROOT) {
  const evalsRoot = path.join(root, EVALS_DIR);
  return readdirSync(evalsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const id = entry.name;
      const criteriaPath = path.join(evalsRoot, id, "criteria.json");
      const criteria = readJson(path.relative(root, criteriaPath), root);
      return {
        id,
        metadata: criteria.metadata ?? {},
        hasMetadata: Boolean(criteria.metadata)
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function summarizeEvalCoverage(scenarios) {
  const byDiagram = new Map();

  for (const scenario of scenarios) {
    const diagramTypes = scenario.metadata.diagramTypes ?? [];
    const modes = scenario.metadata.modes ?? [];
    const riskAreas = scenario.metadata.riskAreas ?? [];

    for (const diagramType of diagramTypes) {
      const key = diagramType;
      const summary = byDiagram.get(key) ?? {
        diagramType: key,
        scenarios: new Set(),
        modes: new Set(),
        riskAreas: new Set()
      };
      summary.scenarios.add(scenario.id);
      for (const mode of modes) summary.modes.add(mode);
      for (const riskArea of riskAreas) summary.riskAreas.add(riskArea);
      byDiagram.set(key, summary);
    }
  }

  return byDiagram;
}

const RELEASE_HIGHLIGHT_PATTERNS = {
  architecture: [/\barchitecture diagrams?\b/i],
  sequence: [/\bsequence diagrams?\b/i],
  state: [/\bstate diagrams?\b/i],
  timeline: [/\btimeline\b/i],
  treeView: [/\btree\s*view\b/i, /\btreeview\b/i],
  wardley: [/\bwardley\b/i]
};

function highlightEvidenceFor(diagramType, highlights = []) {
  const haystack = highlights.join("\n");
  const patterns = RELEASE_HIGHLIGHT_PATTERNS[diagramType] ?? [];
  return patterns.some((pattern) => pattern.test(haystack))
    ? [`release-highlight:${slug(diagramType)}`]
    : [];
}

function addOpportunity(opportunities, opportunity) {
  opportunities.push({
    id: opportunity.id,
    priority: opportunity.priority,
    diagramTypes: opportunity.diagramTypes,
    modes: opportunity.modes,
    gap: opportunity.gap,
    evidence: [...new Set(opportunity.evidence)],
    next: opportunity.next
  });
}

function hasMode(summary, mode) {
  return Boolean(summary?.modes.has(mode));
}

function hasAnyMode(summary, modes) {
  return modes.some((mode) => hasMode(summary, mode));
}

export function buildEvalOpportunities({ upstream, coverageRows, evalScenarios }) {
  const coverageByDiagram = new Map(coverageRows.map((row) => [row.diagramType, row]));
  const evalCoverage = summarizeEvalCoverage(evalScenarios);
  const releaseHighlights = upstream.releaseEvidence?.releaseHighlights ?? [];
  const opportunities = [];

  const upstreamDiagrams = (upstream.releaseEvidence?.diagramDirectories ?? [])
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  for (const diagramType of upstreamDiagrams) {
    const row = coverageByDiagram.get(diagramType);
    const summary = evalCoverage.get(diagramType);
    const releaseEvidence = highlightEvidenceFor(diagramType, releaseHighlights);

    if (!row) {
      addOpportunity(opportunities, {
        id: `${slug(diagramType)}-coverage-matrix-missing`,
        priority: "P0",
        diagramTypes: [diagramType],
        modes: ["caveat"],
        gap: `Upstream Mermaid has a ${title(diagramType)} diagram source directory, but the local coverage matrix has no explicit status.`,
        evidence: [`upstream:${diagramType}`, "coverage:missing", ...releaseEvidence],
        next: `Add ${diagramType} to the coverage matrix with a conservative status before adding create/repair evals.`
      });
      continue;
    }

    if (row.status === "supported") {
      if (!hasMode(summary, "create")) {
        addOpportunity(opportunities, {
          id: `${slug(diagramType)}-create-coverage`,
          priority: "P1",
          diagramTypes: [diagramType],
          modes: ["create"],
          gap: `Supported Mermaid ${title(diagramType)} diagrams have no create eval coverage.`,
          evidence: [
            `upstream:${diagramType}`,
            "coverage:supported",
            `evals:no-${slug(diagramType)}-create`,
            ...releaseEvidence
          ],
          next: `Add one create scenario that asks for a ${title(diagramType)} diagram in its natural use case and checks semantic essentials.`
        });
      }

      if (!hasMode(summary, "repair")) {
        addOpportunity(opportunities, {
          id: `${slug(diagramType)}-repair-coverage`,
          priority: "P1",
          diagramTypes: [diagramType],
          modes: ["repair"],
          gap: `Supported Mermaid ${title(diagramType)} diagrams have no repair eval coverage.`,
          evidence: [
            `upstream:${diagramType}`,
            "coverage:supported",
            `evals:no-${slug(diagramType)}-repair`,
            ...releaseEvidence
          ],
          next: `Add one repair scenario with a realistic ${title(diagramType)} syntax mistake and criteria that preserve user intent.`
        });
      }
      continue;
    }

    if (row.status === "beta") {
      if (!hasAnyMode(summary, ["caveat", "safety"])) {
        addOpportunity(opportunities, {
          id: `${slug(diagramType)}-beta-caveat-coverage`,
          priority: "P2",
          diagramTypes: [diagramType],
          modes: ["caveat"],
          gap: `Beta Mermaid ${title(diagramType)} syntax lacks eval coverage for renderer caveats or stable fallbacks.`,
          evidence: [
            `upstream:${diagramType}`,
            "coverage:beta",
            `evals:no-${slug(diagramType)}-caveat`,
            ...releaseEvidence
          ],
          next: `Add one caveat or fallback scenario for ${title(diagramType)} that makes renderer support explicit before using beta syntax.`
        });
      }
      continue;
    }

    if (row.status === "needs research") {
      addOpportunity(opportunities, {
        id: `${slug(diagramType)}-syntax-research`,
        priority: "P2",
        diagramTypes: [diagramType],
        modes: ["caveat"],
        gap: `Upstream Mermaid has ${title(diagramType)} source, but local guidance still says needs research.`,
        evidence: [`upstream:${diagramType}`, "coverage:needs-research", ...releaseEvidence],
        next: `Research parser-verified ${title(diagramType)} starter syntax, then add guidance or an eval only if the skill should support it.`
      });
    }
  }

  return opportunities.sort((a, b) => {
    const priority = PRIORITY_RANK.get(a.priority) - PRIORITY_RANK.get(b.priority);
    return priority || a.id.localeCompare(b.id);
  });
}

function buildManifest({ upstream, evalScenarios, opportunities }) {
  const metadataCount = evalScenarios.filter((scenario) => scenario.hasMetadata).length;
  return {
    schemaVersion: 1,
    generatedFrom: {
      upstreamSnapshotKey: upstream.snapshotKey,
      upstreamRelease: upstream.releaseEvidence?.release?.tag_name,
      diagramDirectories: upstream.releaseEvidence?.diagramDirectories?.length ?? 0,
      evalScenarios: evalScenarios.length,
      evalScenariosWithMetadata: metadataCount
    },
    opportunities
  };
}

function countByPriority(opportunities) {
  return opportunities.reduce((counts, opportunity) => {
    counts[opportunity.priority] = (counts[opportunity.priority] ?? 0) + 1;
    return counts;
  }, {});
}

export function formatEvalBacklog(manifest) {
  const counts = countByPriority(manifest.opportunities);
  const prioritySections = ["P0", "P1", "P2", "P3"]
    .map((priority) => ({
      priority,
      opportunities: manifest.opportunities.filter(
        (opportunity) => opportunity.priority === priority
      )
    }))
    .filter((section) => section.opportunities.length > 0);

  const body = prioritySections
    .map((section) => {
      const entries = section.opportunities
        .map(
          (opportunity) => `### ${opportunity.id}

- **Gap:** ${opportunity.gap}
- **Diagram type(s):** ${opportunity.diagramTypes.join(", ")}
- **Mode(s):** ${opportunity.modes.join(", ")}
- **Evidence:** ${opportunity.evidence.join(", ")}
- **Next:** ${opportunity.next}`
        )
        .join("\n\n");
      return `## ${section.priority}\n\n${entries}`;
    })
    .join("\n\n");

  return `# Eval opportunity backlog

This file is generated by \`scripts/discover-eval-opportunities.mjs\`. Do not edit it by hand;
add eval metadata, update coverage guidance, or refresh upstream evidence instead.

## Snapshot

- Upstream snapshot: ${manifest.generatedFrom.upstreamSnapshotKey}
- Tracked Mermaid release: ${manifest.generatedFrom.upstreamRelease}
- Diagram source directories: ${manifest.generatedFrom.diagramDirectories}
- Eval scenarios: ${manifest.generatedFrom.evalScenarios}
- Eval scenarios with metadata: ${manifest.generatedFrom.evalScenariosWithMetadata}
- Opportunities: ${manifest.opportunities.length}
- Counts by priority: ${["P0", "P1", "P2", "P3"]
    .map((priority) => `${priority} ${counts[priority] ?? 0}`)
    .join(", ")}

${body || "No eval opportunities found."}
`;
}

async function build(root = ROOT) {
  const upstream = readJson(UPSTREAM_FILE, root);
  const coverageRows = parseCoverageMatrix(readFileSync(path.join(root, COVERAGE_FILE), "utf8"));
  const evalScenarios = loadEvalScenarios(root);
  const opportunities = buildEvalOpportunities({ upstream, coverageRows, evalScenarios });
  const manifest = buildManifest({ upstream, evalScenarios, opportunities });
  const jsonConfig = (await prettier.resolveConfig(path.join(root, OPPORTUNITIES_FILE))) ?? {};
  const markdownConfig = (await prettier.resolveConfig(path.join(root, BACKLOG_FILE))) ?? {};
  const json = await prettier.format(JSON.stringify(manifest), {
    ...jsonConfig,
    parser: "json"
  });
  const markdown = await prettier.format(formatEvalBacklog(manifest), {
    ...markdownConfig,
    parser: "markdown"
  });
  return { json, markdown, manifest };
}

async function main() {
  const check = process.argv.includes("--check");
  const { json, markdown, manifest } = await build();
  const outputs = [
    { file: path.join(ROOT, OPPORTUNITIES_FILE), content: json },
    { file: path.join(ROOT, BACKLOG_FILE), content: markdown }
  ];

  if (check) {
    const stale = outputs.filter(
      (output) => !existsSync(output.file) || readFileSync(output.file, "utf8") !== output.content
    );
    if (stale.length > 0) {
      console.error(
        `Eval opportunity outputs are stale. Run npm run discover:evals.\n${stale
          .map((output) => `- ${path.relative(ROOT, output.file)}`)
          .join("\n")}`
      );
      process.exit(1);
    }
    console.log(
      `Eval opportunity discovery check passed (${manifest.opportunities.length} items).`
    );
    return;
  }

  const wrote = outputs.map((output) => writeIfChanged(output.file, output.content));
  console.log(
    `Eval opportunities discovered: ${manifest.opportunities.length}; ${wrote.some(Boolean) ? "files updated" : "no changes"}.`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
