#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const SEARCH_DIRS = ["README.md", "docs", "skills", "rules"];
const MAX_EXAMPLE_BYTES = 50_000;
const PARSE_TIMEOUT_MS = 5_000;
const STARTERS = [
  /^flowchart\s+/i,
  /^graph\s+/i,
  /^sequenceDiagram\b/i,
  /^classDiagram\b/i,
  /^erDiagram\b/i,
  /^stateDiagram(?:-v2)?\b/i,
  /^gantt\b/i,
  /^gitGraph\b/i,
  /^journey\b/i,
  /^requirementDiagram\b/i,
  /^pie\b/i,
  /^mindmap\b/i,
  /^timeline\b/i,
  /^quadrantChart\b/i,
  /^C4(?:Context|Container|Component|Dynamic|Deployment)\b/,
  /^architecture-beta\b/i,
  /^block-beta\b/i,
  /^kanban\b/i,
  /^packet-beta\b/i,
  /^sankey-beta\b/i,
  /^xychart-beta\b/i,
  /^treemap-beta\b/i,
  /^treeView-beta\b/i,
  /^radar-beta\b/i,
  /^zenuml\b/i,
  /^wardley-beta\b/i
];

function listFiles(target, out = [], root = ROOT) {
  const absolute = path.join(root, target);
  if (!existsSync(absolute)) return out;
  const statTarget = readdirSafe(absolute);
  if (statTarget === null) {
    if (/\.(md|mmd)$/.test(target)) out.push(absolute);
    return out;
  }
  for (const entry of statTarget) {
    if (["node_modules", ".git", ".tessl", "coverage", "dist"].includes(entry.name)) continue;
    const child = path.join(target, entry.name);
    if (entry.isDirectory()) listFiles(child, out, root);
    if (entry.isFile() && /\.(md|mmd)$/.test(entry.name)) out.push(path.join(root, child));
  }
  return out;
}

function readdirSafe(absolute) {
  try {
    return readdirSync(absolute, { withFileTypes: true });
  } catch {
    return null;
  }
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function stripMermaidConfig(code) {
  const trimmed = code.trim();
  if (!trimmed.startsWith("---")) return trimmed;
  const match = trimmed.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  return match ? match[1].trim() : trimmed;
}

export function collectMermaidFromText(text, { file = "<text>", rawWhenNoFence = false } = {}) {
  const examples = [];
  const fence = /```mermaid\s*\r?\n([\s\S]*?)\r?\n```/g;
  let match;
  while ((match = fence.exec(text))) {
    examples.push({ file, code: match[1], line: lineNumberAt(text, match.index) });
  }
  if (examples.length === 0 && rawWhenNoFence && text.trim()) {
    examples.push({ file, code: text, line: 1 });
  }
  return examples;
}

export function collectMermaidExamples({ root = ROOT, files = [], stdinText = null } = {}) {
  const examples = [];

  if (stdinText !== null) {
    examples.push(...collectMermaidFromText(stdinText, { file: "<stdin>", rawWhenNoFence: true }));
  }

  for (const inputFile of files) {
    const absolute = path.resolve(root, inputFile);
    const text = readFileSync(absolute, "utf8");
    const rel = path.relative(root, absolute) || inputFile;
    if (absolute.endsWith(".mmd")) {
      examples.push({ file: rel, code: text, line: 1 });
    } else {
      examples.push(...collectMermaidFromText(text, { file: rel, rawWhenNoFence: false }));
    }
  }

  if (stdinText === null && files.length === 0) {
    const packageFiles = SEARCH_DIRS.flatMap((target) => listFiles(target, [], root));
    for (const file of packageFiles) {
      const text = readFileSync(file, "utf8");
      const rel = path.relative(root, file);
      if (file.endsWith(".mmd")) {
        examples.push({ file: rel, code: text, line: 1 });
      } else {
        examples.push(...collectMermaidFromText(text, { file: rel, rawWhenNoFence: false }));
      }
    }
  }

  return examples;
}

export function staticValidate(example) {
  const code = stripMermaidConfig(example.code);
  const firstLine = code
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("%%"));
  if (!firstLine) return "empty Mermaid block";
  if (!STARTERS.some((starter) => starter.test(firstLine))) {
    return `unknown Mermaid starter: ${firstLine}`;
  }
  return null;
}

function mermaidErrorMessage(error) {
  return error?.str || error?.message || String(error);
}

async function ensureDomForMermaid() {
  if (globalThis.window?.document) return;
  const { JSDOM } = await import("jsdom");
  const { window } = new JSDOM("<!doctype html><html><body></body></html>");
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.Element = window.Element;
  globalThis.SVGElement = window.SVGElement;
}

export async function parseWithMermaid(examples) {
  let mermaidModule;
  try {
    await ensureDomForMermaid();
    mermaidModule = await import("mermaid");
  } catch {
    return [
      "Mermaid parser validation requested with --parse, but mermaid/jsdom parser dependencies are not installed. Run npm install or use validate:mermaid:static."
    ];
  }
  const mermaid = mermaidModule.default;
  const errors = [];
  for (const example of examples) {
    try {
      if (Buffer.byteLength(example.code, "utf8") > MAX_EXAMPLE_BYTES) {
        throw new Error(`Mermaid block exceeds ${MAX_EXAMPLE_BYTES} byte parser-validation limit`);
      }
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
      await Promise.race([
        mermaid.parse(example.code),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`parse timeout after ${PARSE_TIMEOUT_MS}ms`)),
            PARSE_TIMEOUT_MS
          )
        )
      ]);
    } catch (error) {
      errors.push(
        `${example.file}:${example.line}: Mermaid parser rejected block: ${mermaidErrorMessage(error)}`
      );
    }
  }
  return errors;
}

function parseArgs(argv) {
  const options = { parse: false, stdin: false, files: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--parse") options.parse = true;
    else if (arg === "--stdin") options.stdin = true;
    else if (arg === "--file") {
      if (!argv[index + 1]) throw new Error("--file requires a path");
      options.files.push(argv[index + 1]);
      index += 1;
    } else if (arg.startsWith("--file=")) {
      options.files.push(arg.slice("--file=".length));
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs(process.argv.slice(2));
  const stdinText = options.stdin ? readFileSync(0, "utf8") : null;
  const examples = collectMermaidExamples({ files: options.files, stdinText });
  const errors = [];

  for (const example of examples) {
    const error = staticValidate(example);
    if (error) errors.push(`${example.file}:${example.line}: ${error}`);
  }

  if (options.parse && errors.length === 0) {
    errors.push(...(await parseWithMermaid(examples)));
  }

  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log(
    `Mermaid example validation passed (${examples.length} example${examples.length === 1 ? "" : "s"}${options.parse ? ", parser enabled" : ", static"}).`
  );
}
