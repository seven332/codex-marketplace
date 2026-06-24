import assert from "node:assert/strict";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { validateRepository } from "./validate-marketplace.mjs";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), "codex-marketplace-test-"));
  cpSync(join(repoRoot, "schemas"), join(root, "schemas"), { recursive: true });

  writeJson(join(root, ".agents/plugins/marketplace.json"), {
    name: "test-marketplace",
    plugins: [
      {
        name: "demo-plugin",
        source: {
          source: "local",
          path: "./plugins/demo-plugin"
        },
        policy: {
          installation: "AVAILABLE",
          authentication: "ON_INSTALL"
        },
        category: "Developer Tools"
      }
    ]
  });

  writeJson(join(root, "plugins/demo-plugin/.codex-plugin/plugin.json"), {
    name: "demo-plugin",
    version: "1.0.0",
    description: "Demo plugin.",
    author: {
      name: "Tests"
    },
    license: "MIT",
    skills: "./skills/",
    interface: {
      displayName: "Demo Plugin",
      shortDescription: "Demo plugin.",
      longDescription: "Demo plugin for validator tests.",
      developerName: "Tests",
      category: "Developer Tools",
      capabilities: ["Testing"],
      defaultPrompt: ["Run the demo skill."],
      brandColor: "#2563EB",
      screenshots: []
    }
  });

  mkdirSync(join(root, "plugins/demo-plugin/skills/demo-skill"), { recursive: true });
  writeFileSync(
    join(root, "plugins/demo-plugin/skills/demo-skill/SKILL.md"),
    `---
name: demo-skill
description: Demo skill.
---

Run the demo workflow.
`
  );

  return root;
}

function withFixture(fn) {
  const root = createFixture();
  try {
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("validates a marketplace with a plugin and skill", () => {
  withFixture((root) => {
    const result = validateRepository(root);

    assert.equal(result.ok, true);
    assert.deepEqual(result.errors, []);
    assert.equal(result.pluginCount, 1);
    assert.equal(result.skillCount, 1);
  });
});

test("accepts semantic versions with prerelease and build metadata", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.version = "1.0.0-beta.1+build.5";
    writeJson(manifestPath, manifest);

    const result = validateRepository(root);

    assert.equal(result.ok, true);
  });
});

test("rejects empty marketplace plugin lists", () => {
  withFixture((root) => {
    const marketplacePath = join(root, ".agents/plugins/marketplace.json");
    const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
    marketplace.plugins = [];
    writeJson(marketplacePath, marketplace);

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /must NOT have fewer than 1 items/);
  });
});

test("reports nested schema locations for missing manifest fields", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    delete manifest.interface.displayName;
    writeJson(manifestPath, manifest);

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /plugin\.json\/interface\/displayName/);
  });
});

test("rejects duplicate marketplace plugin names", () => {
  withFixture((root) => {
    const marketplacePath = join(root, ".agents/plugins/marketplace.json");
    const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
    marketplace.plugins.push({ ...marketplace.plugins[0] });
    writeJson(marketplacePath, marketplace);

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /duplicate plugin entry: demo-plugin/);
  });
});

test("rejects plugin manifests whose names do not match marketplace entries", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.name = "other-plugin";
    writeJson(manifestPath, manifest);

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /manifest name must match marketplace entry name/);
  });
});

test("rejects marketplace paths outside the repository", () => {
  withFixture((root) => {
    const marketplacePath = join(root, ".agents/plugins/marketplace.json");
    const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
    marketplace.plugins[0].source.path = "./../outside";
    writeJson(marketplacePath, marketplace);

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /source\.path/);
  });
});

test("rejects plugin symlinks that resolve outside the repository", () => {
  withFixture((root) => {
    const outsideRoot = mkdtempSync(join(tmpdir(), "codex-marketplace-outside-"));
    try {
      cpSync(join(root, "plugins/demo-plugin"), join(outsideRoot, "demo-plugin"), { recursive: true });
      rmSync(join(root, "plugins/demo-plugin"), { recursive: true, force: true });
      symlinkSync(join(outsideRoot, "demo-plugin"), join(root, "plugins/demo-plugin"), "dir");

      const result = validateRepository(root);

      assert.equal(result.ok, false);
      assert.match(result.errors.join("\n"), /must not resolve outside the repository/);
    } finally {
      rmSync(outsideRoot, { recursive: true, force: true });
    }
  });
});

test("rejects skills with empty bodies", () => {
  withFixture((root) => {
    writeFileSync(
      join(root, "plugins/demo-plugin/skills/demo-skill/SKILL.md"),
      `---
name: demo-skill
description: Demo skill.
---
`
    );

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.equal(result.skillCount, 0);
    assert.match(result.errors.join("\n"), /body is required/);
  });
});

test("rejects skill frontmatter names that do not match the directory", () => {
  withFixture((root) => {
    writeFileSync(
      join(root, "plugins/demo-plugin/skills/demo-skill/SKILL.md"),
      `---
name: other-skill
description: Demo skill.
---

Run the demo workflow.
`
    );

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.equal(result.skillCount, 0);
    assert.match(result.errors.join("\n"), /frontmatter name must match directory/);
  });
});
