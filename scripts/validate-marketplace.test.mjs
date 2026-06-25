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

test("accepts Codex plugin version segments", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.version = "local_build+5";
    writeJson(manifestPath, manifest);

    const result = validateRepository(root);

    assert.equal(result.ok, true);
  });
});

test("accepts plugin versions with surrounding whitespace", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.version = " 1.2.3-beta+7 ";
    writeJson(manifestPath, manifest);

    const result = validateRepository(root);

    assert.equal(result.ok, true);
  });
});

test("accepts optional manifest fields being omitted", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    delete manifest.version;
    delete manifest.description;
    delete manifest.author;
    delete manifest.license;
    delete manifest.interface;
    writeJson(manifestPath, manifest);

    const result = validateRepository(root);

    assert.equal(result.ok, true);
  });
});

test("accepts omitted manifest names that match the plugin directory", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    delete manifest.name;
    writeJson(manifestPath, manifest);

    const result = validateRepository(root);

    assert.equal(result.ok, true);
  });
});

test("validates the default skills root when manifest skills is omitted", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    delete manifest.skills;
    writeJson(manifestPath, manifest);

    const result = validateRepository(root);

    assert.equal(result.ok, true);
    assert.equal(result.skillCount, 1);
  });
});

test("validates the default skills root when manifest skills is empty", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.skills = [];
    writeJson(manifestPath, manifest);

    const result = validateRepository(root);

    assert.equal(result.ok, true);
    assert.equal(result.skillCount, 1);
  });
});

test("rejects invalid default skills when manifest skills is omitted", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    delete manifest.skills;
    writeJson(manifestPath, manifest);
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

test("accepts empty marketplace plugin lists", () => {
  withFixture((root) => {
    const marketplacePath = join(root, ".agents/plugins/marketplace.json");
    const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
    marketplace.plugins = [];
    writeJson(marketplacePath, marketplace);

    const result = validateRepository(root);

    assert.equal(result.ok, true);
    assert.equal(result.pluginCount, 0);
  });
});

test("reports schema errors for null marketplace files", () => {
  withFixture((root) => {
    writeJson(join(root, ".agents/plugins/marketplace.json"), null);

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /marketplace\.json\/ must be object/);
  });
});

test("accepts unknown manifest fields for Codex compatibility", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.unexpected = true;
    writeJson(manifestPath, manifest);

    const result = validateRepository(root);

    assert.equal(result.ok, true);
  });
});

test("reports schema errors for null plugin manifests", () => {
  withFixture((root) => {
    writeJson(join(root, "plugins/demo-plugin/.codex-plugin/plugin.json"), null);

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /plugin\.json\/ must be object/);
  });
});

test("reports nested schema locations for invalid manifest fields", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.interface.displayName = 42;
    writeJson(manifestPath, manifest);

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /plugin\.json\/interface\/displayName/);
  });
});

test("accepts local source shorthand strings", () => {
  withFixture((root) => {
    const marketplacePath = join(root, ".agents/plugins/marketplace.json");
    const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
    marketplace.plugins[0].source = "./plugins/demo-plugin";
    writeJson(marketplacePath, marketplace);

    const result = validateRepository(root);

    assert.equal(result.ok, true);
  });
});

test("accepts local source paths with normalized dot components", () => {
  withFixture((root) => {
    const marketplacePath = join(root, ".agents/plugins/marketplace.json");
    const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
    marketplace.plugins[0].source.path = "./plugins/demo-plugin/.";
    writeJson(marketplacePath, marketplace);

    const result = validateRepository(root);

    assert.equal(result.ok, true);
  });
});

test("rejects root-equivalent local marketplace source paths", () => {
  withFixture((root) => {
    const marketplacePath = join(root, ".agents/plugins/marketplace.json");
    const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
    marketplace.plugins[0].source.path = "././plugins/demo-plugin";
    writeJson(marketplacePath, marketplace);

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /marketplace\.json\/plugins\/0\/source/);
  });
});

test("accepts supported git marketplace source urls", () => {
  withFixture((root) => {
    const marketplacePath = join(root, ".agents/plugins/marketplace.json");
    const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
    marketplace.plugins = [
      {
        name: "https-plugin",
        source: {
          source: "url",
          url: "https://github.com/example/plugin"
        }
      },
      {
        name: "ssh-plugin",
        source: {
          source: "url",
          url: "git@github.com:example/plugin.git"
        }
      },
      {
        name: "shorthand-plugin",
        source: {
          source: "git-subdir",
          url: "example/marketplace",
          path: "./plugins/./shorthand-plugin"
        }
      },
      {
        name: "relative-plugin",
        source: {
          source: "url",
          url: "./remotes/plugin.git"
        }
      }
    ];
    writeJson(marketplacePath, marketplace);

    const result = validateRepository(root);

    assert.equal(result.ok, true);
    assert.equal(result.pluginCount, 4);
    assert.equal(result.skillCount, 0);
  });
});

test("rejects unsupported git marketplace source urls", () => {
  for (const url of ["not a url", "example/.git"]) {
    withFixture((root) => {
      const marketplacePath = join(root, ".agents/plugins/marketplace.json");
      const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
      marketplace.plugins[0].source = {
        source: "url",
        url
      };
      writeJson(marketplacePath, marketplace);

      const result = validateRepository(root);

      assert.equal(result.ok, false);
      assert.match(result.errors.join("\n"), /marketplace\.json\/plugins\/0\/source/);
    });
  }
});

test("rejects empty git marketplace source urls", () => {
  withFixture((root) => {
    const marketplacePath = join(root, ".agents/plugins/marketplace.json");
    const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
    marketplace.plugins[0].source = {
      source: "url",
      url: "   "
    };
    writeJson(marketplacePath, marketplace);

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /marketplace\.json\/plugins\/0\/source/);
  });
});

test("rejects non-normal git subdirectory paths", () => {
  for (const path of [".", "././plugins/example", " /plugins/example", " C:/plugins/example"]) {
    withFixture((root) => {
      const marketplacePath = join(root, ".agents/plugins/marketplace.json");
      const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
      marketplace.plugins[0].source = {
        source: "git-subdir",
        url: "example/marketplace",
        path
      };
      writeJson(marketplacePath, marketplace);

      const result = validateRepository(root);

      assert.equal(result.ok, false);
      assert.match(result.errors.join("\n"), /marketplace\.json\/plugins\/0\/source/);
    });
  }
});

test("accepts multiple skill roots", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.skills = ["./skills/", "./more-skills/"];
    writeJson(manifestPath, manifest);
    mkdirSync(join(root, "plugins/demo-plugin/more-skills/other-skill"), { recursive: true });
    writeFileSync(
      join(root, "plugins/demo-plugin/more-skills/other-skill/SKILL.md"),
      `---
name: other-skill
description: Other skill.
---

Run the other workflow.
`
    );

    const result = validateRepository(root);

    assert.equal(result.ok, true);
    assert.equal(result.skillCount, 2);
  });
});

test("reports missing skills under their configured skill root", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.skills = ["./skills/", "./more-skills/"];
    writeJson(manifestPath, manifest);
    mkdirSync(join(root, "plugins/demo-plugin/more-skills/other-skill"), { recursive: true });

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /\.\/more-skills\/other-skill\/SKILL\.md/);
  });
});

test("ignores hidden directories under skill roots", () => {
  withFixture((root) => {
    mkdirSync(join(root, "plugins/demo-plugin/skills/.template"), { recursive: true });

    const result = validateRepository(root);

    assert.equal(result.ok, true);
    assert.equal(result.skillCount, 1);
  });
});

test("rejects symlinked skill directories", () => {
  withFixture((root) => {
    const outsideRoot = mkdtempSync(join(tmpdir(), "codex-marketplace-skill-outside-"));
    try {
      mkdirSync(join(outsideRoot, "linked-skill"), { recursive: true });
      writeFileSync(
        join(outsideRoot, "linked-skill/SKILL.md"),
        `---
name: linked-skill
description: Linked skill.
---

Run the linked workflow.
`
      );
      symlinkSync(
        join(outsideRoot, "linked-skill"),
        join(root, "plugins/demo-plugin/skills/linked-skill"),
        "dir"
      );

      const result = validateRepository(root);

      assert.equal(result.ok, false);
      assert.match(result.errors.join("\n"), /skill directory symlink is not allowed/);
    } finally {
      rmSync(outsideRoot, { recursive: true, force: true });
    }
  });
});

test("rejects symlinked skill files", () => {
  withFixture((root) => {
    const outsideRoot = mkdtempSync(join(tmpdir(), "codex-marketplace-skill-file-outside-"));
    try {
      const outsideSkill = join(outsideRoot, "SKILL.md");
      writeFileSync(
        outsideSkill,
        `---
name: demo-skill
description: Linked skill file.
---

Run the linked workflow.
`
      );
      const skillPath = join(root, "plugins/demo-plugin/skills/demo-skill/SKILL.md");
      rmSync(skillPath, { force: true });
      symlinkSync(outsideSkill, skillPath);

      const result = validateRepository(root);

      assert.equal(result.ok, false);
      assert.equal(result.skillCount, 0);
      assert.match(result.errors.join("\n"), /SKILL\.md symlink is not allowed/);
    } finally {
      rmSync(outsideRoot, { recursive: true, force: true });
    }
  });
});

test("accepts default prompt strings and dark logos", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.interface.defaultPrompt = "Run the demo skill.";
    manifest.interface.logoDark = "./assets/logo-dark.svg";
    writeJson(manifestPath, manifest);

    const result = validateRepository(root);

    assert.equal(result.ok, true);
  });
});

test("accepts default prompts that normalize under the Codex length limit", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.interface.defaultPrompt = `${"A".repeat(64)}${" ".repeat(100)}${"B".repeat(63)}`;
    writeJson(manifestPath, manifest);

    const result = validateRepository(root);

    assert.equal(result.ok, true);
  });
});

test("rejects default prompts that exceed the normalized Codex length limit", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.interface.defaultPrompt = "x".repeat(129);
    writeJson(manifestPath, manifest);

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /defaultPrompt.*128 characters after whitespace/);
  });
});

test("rejects snake_case plugin default prompts ignored by Codex", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.interface.default_prompt = "Run the demo skill.";
    delete manifest.interface.defaultPrompt;
    writeJson(manifestPath, manifest);

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /plugin\.json\/interface\/default_prompt/);
  });
});

test("rejects whitespace-only default prompts ignored by Codex", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.interface.defaultPrompt = "   ";
    writeJson(manifestPath, manifest);

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /plugin\.json\/interface\/defaultPrompt/);
  });
});

test("accepts empty hook arrays ignored by Codex", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.hooks = [];
    writeJson(manifestPath, manifest);

    const result = validateRepository(root);

    assert.equal(result.ok, true);
  });
});

test("accepts inline hook declarations", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.hooks = {
      hooks: {
        PreToolUse: [
          {
            matcher: "^Bash$",
            hooks: [
              {
                type: "command",
                command: "python3 scripts/check.py",
                timeout: 10,
                statusMessage: "checking"
              }
            ]
          }
        ]
      }
    };
    writeJson(manifestPath, manifest);

    const result = validateRepository(root);

    assert.equal(result.ok, true);
  });
});

test("rejects root-level hook events ignored by Codex", () => {
  withFixture((root) => {
    const manifestPath = join(root, "plugins/demo-plugin/.codex-plugin/plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.hooks = {
      SessionStart: [
        {
          hooks: [
            {
              type: "command",
              command: "python3 scripts/session-start.py"
            }
          ]
        }
      ]
    };
    writeJson(manifestPath, manifest);

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /plugin\.json\/hooks/);
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

test("accepts skills with CRLF frontmatter", () => {
  withFixture((root) => {
    writeFileSync(
      join(root, "plugins/demo-plugin/skills/demo-skill/SKILL.md"),
      "---\r\nname: demo-skill\r\ndescription: Demo skill.\r\n---\r\n\r\nRun the demo workflow.\r\n"
    );

    const result = validateRepository(root);

    assert.equal(result.ok, true);
    assert.equal(result.skillCount, 1);
  });
});

test("accepts quoted skill frontmatter names", () => {
  withFixture((root) => {
    writeFileSync(
      join(root, "plugins/demo-plugin/skills/demo-skill/SKILL.md"),
      `---
name: "demo-skill"
description: Demo skill.
---

Run the demo workflow.
`
    );

    const result = validateRepository(root);

    assert.equal(result.ok, true);
    assert.equal(result.skillCount, 1);
  });
});

test("accepts skill frontmatter names with YAML line comments", () => {
  withFixture((root) => {
    writeFileSync(
      join(root, "plugins/demo-plugin/skills/demo-skill/SKILL.md"),
      `---
name: demo-skill # directory name
description: Demo skill.
---

Run the demo workflow.
`
    );

    const result = validateRepository(root);

    assert.equal(result.ok, true);
    assert.equal(result.skillCount, 1);
  });
});

test("accepts block scalar skill descriptions", () => {
  withFixture((root) => {
    writeFileSync(
      join(root, "plugins/demo-plugin/skills/demo-skill/SKILL.md"),
      `---
name: demo-skill
description: |-

  Demo skill.
---

Run the demo workflow.
`
    );

    const result = validateRepository(root);

    assert.equal(result.ok, true);
    assert.equal(result.skillCount, 1);
  });
});

test("accepts unquoted skill descriptions containing colon-space", () => {
  withFixture((root) => {
    writeFileSync(
      join(root, "plugins/demo-plugin/skills/demo-skill/SKILL.md"),
      `---
name: demo-skill
description: AWS deployment patterns: ECS Fargate, Lambda, and S3
---

Run the demo workflow.
`
    );

    const result = validateRepository(root);

    assert.equal(result.ok, true);
    assert.equal(result.skillCount, 1);
  });
});

test("rejects comment-only skill descriptions", () => {
  withFixture((root) => {
    writeFileSync(
      join(root, "plugins/demo-plugin/skills/demo-skill/SKILL.md"),
      `---
name: demo-skill
description: # missing description
---

Run the demo workflow.
`
    );

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.equal(result.skillCount, 0);
    assert.match(result.errors.join("\n"), /description is required/);
  });
});

test("rejects empty quoted skill descriptions", () => {
  withFixture((root) => {
    writeFileSync(
      join(root, "plugins/demo-plugin/skills/demo-skill/SKILL.md"),
      `---
name: demo-skill
description: ""
---

Run the demo workflow.
`
    );

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.equal(result.skillCount, 0);
    assert.match(result.errors.join("\n"), /description is required/);
  });
});

test("rejects non-string YAML skill descriptions", () => {
  withFixture((root) => {
    writeFileSync(
      join(root, "plugins/demo-plugin/skills/demo-skill/SKILL.md"),
      `---
name: demo-skill
description: []
---

Run the demo workflow.
`
    );

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.equal(result.skillCount, 0);
    assert.match(result.errors.join("\n"), /description is required/);
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

test("accepts skill agents openai metadata", () => {
  withFixture((root) => {
    const agentsDir = join(root, "plugins/demo-plugin/skills/demo-skill/agents");
    mkdirSync(agentsDir, { recursive: true });
    writeFileSync(
      join(agentsDir, "openai.yaml"),
      `interface:
  display_name: "Demo Skill"
  short_description: "Demo skill metadata for tests."
  default_prompt: "Use $demo-skill to run the demo workflow."
`
    );

    const result = validateRepository(root);

    assert.equal(result.ok, true);
    assert.equal(result.skillCount, 1);
  });
});

test("accepts skill agents dependency metadata without interface fields", () => {
  withFixture((root) => {
    const agentsDir = join(root, "plugins/demo-plugin/skills/demo-skill/agents");
    mkdirSync(agentsDir, { recursive: true });
    writeFileSync(
      join(agentsDir, "openai.yaml"),
      `dependencies:
  tools: []
`
    );

    const result = validateRepository(root);

    assert.equal(result.ok, true);
    assert.equal(result.skillCount, 1);
  });
});

test("rejects invalid skill agents openai metadata YAML", () => {
  withFixture((root) => {
    const agentsDir = join(root, "plugins/demo-plugin/skills/demo-skill/agents");
    mkdirSync(agentsDir, { recursive: true });
    writeFileSync(join(agentsDir, "openai.yaml"), "interface:\n  default_prompt: [\n");

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.equal(result.skillCount, 0);
    assert.match(result.errors.join("\n"), /agents\/openai\.yaml is not valid YAML/);
  });
});

test("rejects symlinked skill agents openai metadata", () => {
  withFixture((root) => {
    const outsideRoot = mkdtempSync(join(tmpdir(), "codex-marketplace-agents-outside-"));
    try {
      const agentsDir = join(root, "plugins/demo-plugin/skills/demo-skill/agents");
      mkdirSync(agentsDir, { recursive: true });
      const outsideMetadata = join(outsideRoot, "openai.yaml");
      writeFileSync(
        outsideMetadata,
        `interface:
  display_name: "Demo Skill"
  short_description: "Demo skill metadata for tests."
  default_prompt: "Use $demo-skill to run the demo workflow."
`
      );
      symlinkSync(outsideMetadata, join(agentsDir, "openai.yaml"));

      const result = validateRepository(root);

      assert.equal(result.ok, false);
      assert.equal(result.skillCount, 0);
      assert.match(result.errors.join("\n"), /agents\/openai\.yaml symlink is not allowed/);
    } finally {
      rmSync(outsideRoot, { recursive: true, force: true });
    }
  });
});

test("rejects broken symlinked skill agents openai metadata", () => {
  withFixture((root) => {
    const agentsDir = join(root, "plugins/demo-plugin/skills/demo-skill/agents");
    mkdirSync(agentsDir, { recursive: true });
    symlinkSync(join(root, "missing-openai.yaml"), join(agentsDir, "openai.yaml"));

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.equal(result.skillCount, 0);
    assert.match(result.errors.join("\n"), /agents\/openai\.yaml symlink is not allowed/);
  });
});

test("rejects skill agents interface fields at the top level", () => {
  withFixture((root) => {
    const agentsDir = join(root, "plugins/demo-plugin/skills/demo-skill/agents");
    mkdirSync(agentsDir, { recursive: true });
    writeFileSync(
      join(agentsDir, "openai.yaml"),
      `display_name: "Demo Skill"
short_description: "Demo skill metadata for tests."
default_prompt: "Use $demo-skill to run the demo workflow."
`
    );

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.equal(result.skillCount, 0);
    assert.match(result.errors.join("\n"), /display_name must be nested under interface/);
  });
});

test("rejects skill agents default prompts without the skill reference", () => {
  withFixture((root) => {
    const agentsDir = join(root, "plugins/demo-plugin/skills/demo-skill/agents");
    mkdirSync(agentsDir, { recursive: true });
    writeFileSync(
      join(agentsDir, "openai.yaml"),
      `interface:
  display_name: "Demo Skill"
  short_description: "Demo skill metadata for tests."
  default_prompt: "Run the demo workflow."
`
    );

    const result = validateRepository(root);

    assert.equal(result.ok, false);
    assert.equal(result.skillCount, 0);
    assert.match(result.errors.join("\n"), /default_prompt must mention \$demo-skill/);
  });
});
