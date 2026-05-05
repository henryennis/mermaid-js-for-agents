#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const WORKFLOW_DIR = path.join(ROOT, ".github", "workflows");

function parseFrontmatter(text, file) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) throw new Error(`${file}: missing YAML frontmatter`);
  return { frontmatter: match[1], body: text.slice(match[0].length) };
}

function lintAgenticWorkflow(file) {
  const rel = path.relative(ROOT, file);
  const text = readFileSync(file, "utf8");
  const errors = [];
  const { frontmatter, body } = parseFrontmatter(text, rel);

  for (const field of ["on:", "description:", "tools:", "network:"]) {
    if (!frontmatter.includes(field)) errors.push(`${rel}: frontmatter missing ${field}`);
  }
  if (!body.trim()) errors.push(`${rel}: markdown instructions are empty`);
  if (/bash:\s*\[\s*["']:\*/.test(frontmatter)) {
    errors.push(`${rel}: unrestricted bash tools are not allowed in this project`);
  }
  if (frontmatter.includes("safe-outputs:") && !body.includes("## Output contract")) {
    errors.push(`${rel}: workflows with safe-outputs must document an ## Output contract`);
  }

  return errors;
}

function lintActionsWorkflow(file) {
  const rel = path.relative(ROOT, file);
  const text = readFileSync(file, "utf8");
  const errors = [];
  if (!/^name:/m.test(text)) errors.push(`${rel}: missing workflow name`);
  if (!/^permissions:/m.test(text)) errors.push(`${rel}: missing explicit permissions block`);
  if (/pull_request_target:/m.test(text)) {
    errors.push(`${rel}: pull_request_target is not allowed without a documented threat model`);
  }
  return errors;
}

export function lintAgenticWorkflows() {
  if (!existsSync(WORKFLOW_DIR)) return { checked: 0, errors: [] };
  const files = readdirSync(WORKFLOW_DIR)
    .filter((name) => /\.(md|ya?ml)$/.test(name))
    .map((name) => path.join(WORKFLOW_DIR, name));
  const errors = [];
  for (const file of files) {
    if (file.endsWith(".md")) errors.push(...lintAgenticWorkflow(file));
    if (/\.ya?ml$/.test(file)) errors.push(...lintActionsWorkflow(file));
  }
  return { checked: files.length, errors };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { checked, errors } = lintAgenticWorkflows();
  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log(`Workflow lint passed (${checked} workflow source file${checked === 1 ? "" : "s"}).`);
}
