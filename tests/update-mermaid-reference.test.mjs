import { describe, expect, it } from "vitest";
import {
  buildSnapshot,
  selectLatestStableMermaidRelease
} from "../scripts/update-mermaid-reference.mjs";

const releases = [
  {
    tag_name: "parser@1.0.0",
    draft: false,
    prerelease: false,
    published_at: "2026-05-01T00:00:00Z"
  },
  {
    tag_name: "mermaid@11.15.0-rc.1",
    draft: false,
    prerelease: true,
    published_at: "2026-05-02T00:00:00Z"
  },
  {
    tag_name: "mermaid@11.14.0",
    name: "mermaid@11.14.0",
    draft: false,
    prerelease: false,
    published_at: "2026-04-01T00:00:00Z"
  },
  {
    tag_name: "mermaid@11.13.0",
    draft: false,
    prerelease: false,
    published_at: "2026-03-01T00:00:00Z"
  }
];

describe("update-mermaid-reference", () => {
  it("selects the latest stable Mermaid package release", () => {
    expect(selectLatestStableMermaidRelease(releases).tag_name).toBe("mermaid@11.14.0");
  });

  it("builds immutable release evidence without develop refs", () => {
    const snapshot = buildSnapshot({
      release: {
        ...releases[2],
        target_commitish: "develop",
        html_url: "https://github.com/mermaid-js/mermaid/releases/tag/mermaid%4011.14.0",
        body: "- Add TreeView diagram"
      },
      releaseCommitSha: "abc123",
      docsContents: [
        { type: "dir", name: "syntax", path: "packages/mermaid/src/docs/syntax", sha: "docsha" }
      ],
      diagramContents: [
        {
          type: "dir",
          name: "flowchart",
          path: "packages/mermaid/src/diagrams/flowchart",
          sha: "flowsha"
        },
        {
          type: "dir",
          name: "common",
          path: "packages/mermaid/src/diagrams/common",
          sha: "skipsha"
        }
      ]
    });

    expect(snapshot.releaseEvidence.source).toBe("immutable-release-ref");
    expect(snapshot.releaseEvidence.release.commit_sha).toBe("abc123");
    expect(snapshot.releaseEvidence.docsDirectories[0].html_url).toContain("/tree/abc123/");
    expect(snapshot.releaseEvidence.diagramDirectories.map((entry) => entry.name)).toEqual([
      "flowchart"
    ]);
    expect(JSON.stringify(snapshot)).not.toContain("ref=develop");
    expect(snapshot.snapshotKey).toMatch(/^[a-f0-9]{64}$/);
  });
});
