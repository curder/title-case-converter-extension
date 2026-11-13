# AGENTS.md

本文件面向在本仓库工作的开发者与 AI Agent，约定贡献流程与交付标准；框架与构建细节见 `CLAUDE.md`。

## 贡献流程

```
Issue（记录需求/复现） → 分支 → 小步提交 → PR（关联 Issue）→ CI 通过 → Squash 合并 → 删除分支
版本发布单独走 bump + tag
```

1. **先建 Issue**
   - 功能、行为变更、容易复现的 bug：先开 Issue，写清「现状 / 期望 / 验收标准」。
   - 错别字、依赖升级等琐碎改动可直接提 PR。
   - 在 commit 或 PR 描述中用 `Closes #<编号>` 关联，合并后自动关闭。
2. **从 `master` 拉分支**
   - 分支名与 commit 前缀对齐：`feat/xxx`、`fix/xxx`、`docs/xxx`、`chore/xxx`。
   - 一个 PR 只做一件事，控制在可一次 review 完的规模。
3. **提交**
   - 使用英文 Conventional Commits，且只写一行 subject，不写多行 body。
   - 示例：`feat(content): toggle back to original text on second trigger`。
   - 不提交 `dist/`、不混入无关格式化或依赖变更。
4. **开 PR**
   - 标题与主 commit 一致；按 PR 模板填写变更内容、未包含项与验证方式。
   - 行为变更需说明验证结果；涉及界面/交互的改动附截图或复现步骤。
   - 作者需先自读 diff，确认没有调试日志、无关文件或生成的产物。
5. **合并**
   - 仅使用 **Squash merge**，保证 `master` 上每个 commit 都是一个完整变更。
   - 合并后删除远端分支，并执行 `git remote prune origin`。
   - 不在功能 PR 中顺手修改版本号。
6. **发布**
   - 单独提交 `chore: bump version to X.Y.Z`。
   - 推送 `vX.Y.Z` tag，由 `.github/workflows/release.yml` 构建、签名并创建 Release。

## 合并前检查

- `npm run build` 通过（Chrome + Firefox 均能产出）。
- CI 的 `build` 检查通过。
- PR 描述中的验证步骤可复现。

## Agent 约定

- 按上述流程执行：从 `master` 拉分支、关联 Issue、走 PR 与 CI，不直接向 `master` 推送。
- 行为变更优先用项目现有构建/验证命令确认，不新增临时脚本或测试框架。
- 提交信息遵循本文件与 `CLAUDE.md` 的约定：英文、单行、Conventional Commits。
