export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [0],
    "scope-enum": [
      2,
      "always",
      [
        "skill",
        "tessl",
        "pi",
        "claude",
        "codex",
        "mermaid",
        "docs",
        "ci",
        "release",
        "deps",
        "agentic",
        "tests",
        "scripts",
        "security",
        "workflows",
        "package",
        "marketplace",
        "evals",
        "harness"
      ]
    ]
  }
};
