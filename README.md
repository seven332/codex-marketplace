# Codex Marketplace

面向 Codex plugin 的仓库内 marketplace 脚手架。

## 目录结构

```text
.
├── .agents/plugins/marketplace.json
├── plugins/
│   ├── code-quality/
│   │   ├── .codex-plugin/plugin.json
│   │   ├── references/repository-work-files.md
│   │   └── skills/code-quality/SKILL.md
│   ├── issue-to-merge/
│   │   ├── .codex-plugin/plugin.json
│   │   ├── references/repository-work-files.md
│   │   └── skills/
│   └── research-to-plan/
│       ├── .codex-plugin/plugin.json
│       ├── references/repository-work-files.md
│       └── skills/
├── schemas/
│   ├── marketplace.schema.json
│   └── plugin.schema.json
└── scripts/
    ├── validate-marketplace.mjs
    └── validate-marketplace.test.mjs
```

每个 `repository-work-files.md` 都是由该可独立安装的 plugin 中各 skill 共享的内部契约。
它随 plugin 一起打包，只有当引用它的 skill 需要创建或读取工作流自有的文件时才会被加载。

## 本地使用

在本仓库根目录执行：

```bash
codex plugin marketplace add .
codex plugin marketplace list
```

然后重启 Codex，打开 plugin 目录，选择 `Codex Marketplace`，并安装
`Code Quality`、`Issue to Merge` 或 `Research to Plan`。

开发时，编辑 `plugins/<plugin-name>/` 下的文件，然后重新安装 plugin，或在 Codex 中刷新
marketplace。

会生成调研、评审报告、草稿或命令载荷的 skill 把它们保存在当前仓库被忽略的 `codex-work/`
目录下，而不会把新产物写入操作系统的临时目录。可恢复的产物保存在 `research/` 或
`reviews/` 中；可供评审的草稿保存在 `drafts/` 中；短生命周期的 GitHub 命令载荷使用
`tmp/`，用后即删。

## 添加 Plugin

1. 创建 `plugins/<plugin-name>/.codex-plugin/plugin.json`。
2. 把 skill 放在 `plugins/<plugin-name>/skills/` 下。
3. 在 `.agents/plugins/marketplace.json` 中添加对应的条目。
4. 运行完整校验套件：

```bash
npm test
```

如果想快速做 schema 和仓库结构检查而不跑回归测试，运行：

```bash
npm run validate
```

Marketplace 条目和 plugin 清单会对照 `schemas/` 中项目自有的 JSON Schema 进行检查。
这些 schema 不是官方 Codex schema；它们从当前 `openai/codex` 的 marketplace 和 plugin
清单解析器派生而来，保存在本仓库中供 CI 使用。校验器为本地 plugin 源添加了仓库内的安全
检查，包括路径包含检查、符号链接逃逸防护、清单名称匹配和 skill 文件检查。本地
marketplace 条目的 plugin 路径应保持相对于仓库根目录，且位于本仓库内部。Pull request
会在 GitHub Actions 中运行相同的校验。

## Plugin 列表

- `code-quality` - 通用评审与清理工作流，从各仓库自身的质量和测试文档出发。
- `research-to-plan` - 在实现之前，为复杂软件任务提供结构化的调研、方案探索和规划阶段。
- `issue-to-merge` - GitHub issue 和 pull request 工作流，覆盖规划前的问题界定挑战、
  规划、规划后的方案挑战、按 PR 粒度拆分与父交付跟踪、实现、提交、人工与自动化评审反馈、
  CI 检查、显式 merge、branch 更新以及 issue 维护。
