import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  writeFileSync
} from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { installLocal, parseArgs } from "../scripts/install-local.mjs";

function tempProject() {
  return mkdtempSync(path.join(tmpdir(), "mermaid-skill-install-"));
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

describe("install-local", () => {
  it("requires an explicit target", () => {
    expect(() => installLocal({ targetDir: null })).toThrow(/Missing required --target/);
  });

  it("parses supported CLI arguments", () => {
    expect(parseArgs(["--target", ".", "--force"])).toEqual({
      force: true,
      help: false,
      target: "."
    });
    expect(parseArgs(["--target=."])).toEqual({ force: false, help: false, target: "." });
  });

  it("installs idempotent owned skill links and merges Pi settings", () => {
    const target = tempProject();
    mkdirSync(path.join(target, ".pi"), { recursive: true });
    writeFileSync(
      path.join(target, ".pi", "settings.json"),
      `${JSON.stringify({ model: "test", skills: ["./existing-skills"] }, null, 2)}\n`
    );

    installLocal({ targetDir: target });
    installLocal({ targetDir: target });

    for (const link of [
      path.join(target, ".agents", "skills", "mermaid-diagrams"),
      path.join(target, ".claude", "skills", "mermaid-diagrams")
    ]) {
      expect(lstatSync(link).isSymbolicLink()).toBe(true);
      expect(realpathSync(link)).toBe(
        realpathSync(path.join(process.cwd(), "skills", "mermaid-diagrams"))
      );
    }

    const settings = readJson(path.join(target, ".pi", "settings.json"));
    expect(settings.model).toBe("test");
    expect(settings.skills).toContain("./existing-skills");
    expect(settings.skills).toContain(path.relative(target, path.join(process.cwd(), "skills")));
  });

  it("refuses to replace user-owned files without force", async () => {
    const target = tempProject();
    const conflictingPath = path.join(target, ".agents", "skills", "mermaid-diagrams");
    await mkdir(path.dirname(conflictingPath), { recursive: true });
    await writeFile(conflictingPath, "user data");

    expect(() => installLocal({ targetDir: target })).toThrow(/Refusing to replace existing path/);
    expect(readFileSync(conflictingPath, "utf8")).toBe("user data");
  });

  it("backs up user-owned files with force", async () => {
    const target = tempProject();
    const conflictingPath = path.join(target, ".agents", "skills", "mermaid-diagrams");
    await mkdir(path.dirname(conflictingPath), { recursive: true });
    await writeFile(conflictingPath, "user data");

    installLocal({ targetDir: target, force: true });

    expect(lstatSync(conflictingPath).isSymbolicLink()).toBe(true);
    expect(
      existsSync(path.join(target, ".agents", "skills")) &&
        readdirSync(path.join(target, ".agents", "skills")).some((entry) =>
          entry.startsWith("mermaid-diagrams.backup-")
        )
    ).toBe(true);
  });

  it("refuses invalid Pi settings unless forced", async () => {
    const target = tempProject();
    await mkdir(path.join(target, ".pi"), { recursive: true });
    await writeFile(path.join(target, ".pi", "settings.json"), "not json");

    expect(() => installLocal({ targetDir: target })).toThrow(/invalid JSON/);
    expect(existsSync(path.join(target, ".agents", "skills", "mermaid-diagrams"))).toBe(false);
    expect(existsSync(path.join(target, ".claude", "skills", "mermaid-diagrams"))).toBe(false);

    installLocal({ targetDir: target, force: true });
    expect(readJson(path.join(target, ".pi", "settings.json")).skills.length).toBeGreaterThan(0);
  });

  it("refuses non-object Pi settings unless forced", async () => {
    const target = tempProject();
    await mkdir(path.join(target, ".pi"), { recursive: true });
    await writeFile(path.join(target, ".pi", "settings.json"), "[]");

    expect(() => installLocal({ targetDir: target })).toThrow(/JSON object/);
    expect(existsSync(path.join(target, ".agents", "skills", "mermaid-diagrams"))).toBe(false);

    installLocal({ targetDir: target, force: true });
    expect(Array.isArray(readJson(path.join(target, ".pi", "settings.json")).skills)).toBe(true);
  });
});
