#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".git", ".tessl", "coverage", "dist"]);
const REQUIRED_XML_TAGS = ["objective", "quick_start", "success_criteria"];
const NAME_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export function parseFrontmatter(text, file) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    throw new Error(`${file}: missing YAML frontmatter`);
  }

  const fields = new Map();
  let currentKey = null;
  for (const rawLine of match[1].split(/\r?\n/)) {
    if (!rawLine.trim()) continue;
    if (rawLine.startsWith(" ") && currentKey) {
      const previous = fields.get(currentKey);
      fields.set(currentKey, `${previous}${previous ? " " : ""}${rawLine.trim()}`);
      continue;
    }
    const field = rawLine.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!field) continue;
    currentKey = field[1];
    let value = field[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    fields.set(currentKey, value);
  }

  return { fields, body: text.slice(match[0].length) };
}

function findSkillFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "SKILL.md") continue;
      findSkillFiles(absolute, out);
    } else if (entry.isFile() && entry.name === "SKILL.md") {
      out.push(absolute);
    }
  }
  return out;
}

function validateSkill(file) {
  const rel = path.relative(ROOT, file);
  const text = readFileSync(file, "utf8");
  const { fields, body } = parseFrontmatter(text, rel);
  const errors = [];
  const name = fields.get("name");
  const description = fields.get("description");

  if (!name) errors.push("frontmatter.name is required");
  if (name && !NAME_RE.test(name)) {
    errors.push("frontmatter.name must be lowercase letters, numbers, and single hyphens");
  }
  if (name && name !== path.basename(path.dirname(file))) {
    errors.push(
      `frontmatter.name must match parent directory (${path.basename(path.dirname(file))})`
    );
  }
  if (!description) errors.push("frontmatter.description is required");
  if (description && description.length > 1024) {
    errors.push("frontmatter.description must be at most 1024 characters");
  }

  if (rel.startsWith("skills/")) {
    for (const tag of REQUIRED_XML_TAGS) {
      if (!body.includes(`<${tag}>`) || !body.includes(`</${tag}>`)) {
        errors.push(`body must include <${tag}>...</${tag}>`);
      }
    }
  }

  return errors.map((error) => `${rel}: ${error}`);
}

function validateTile() {
  const file = path.join(ROOT, "tile.json");
  if (!existsSync(file)) return ["tile.json: missing Tessl tile manifest"];
  const tile = JSON.parse(readFileSync(file, "utf8"));
  const errors = [];
  for (const field of ["name", "version", "summary"]) {
    if (!tile[field]) errors.push(`tile.json: ${field} is required`);
  }
  if (!tile.docs && !tile.steering && !tile.skills) {
    errors.push("tile.json: one of docs, steering, or skills is required");
  }
  if (tile.docs && !existsSync(path.join(ROOT, tile.docs))) {
    errors.push(`tile.json: docs path does not exist (${tile.docs})`);
  }
  for (const [name, config] of Object.entries(tile.skills ?? {})) {
    if (!config.path) {
      errors.push(`tile.json: skills.${name}.path is required`);
    } else if (!existsSync(path.join(ROOT, config.path))) {
      errors.push(`tile.json: skills.${name}.path does not exist (${config.path})`);
    }
  }
  for (const [name, config] of Object.entries(tile.steering ?? {})) {
    if (!config.rules) {
      errors.push(`tile.json: steering.${name}.rules is required`);
    } else if (!existsSync(path.join(ROOT, config.rules))) {
      errors.push(`tile.json: steering.${name}.rules does not exist (${config.rules})`);
    }
  }
  return errors;
}

export function lintSkills(root = ROOT) {
  const skillFiles = findSkillFiles(root);
  const errors = skillFiles.flatMap(validateSkill).concat(validateTile());
  return { skillFiles, errors };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { skillFiles, errors } = lintSkills();
  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log(
    `Skill lint passed (${skillFiles.length} SKILL.md file${skillFiles.length === 1 ? "" : "s"}).`
  );
}
