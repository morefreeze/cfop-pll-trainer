# 使用 Vercel 部署

本文档为 `cfop-pll-trainer` 项目适配 Vercel 部署的简易指南。

## 1. 远端 Git 仓库配置与首次推送

首先，在你的 GitHub 或 GitLab 账号下创建一个新的**空**仓库（不要勾选任何“初始化”选项，如 `README`、`.gitignore` 等）。

然后，在本地 `cfop-pll-trainer` 项目根目录下，依次执行以下命令，将代码推送到远端仓库：

```bash
# 替换为你的远端仓库地址
git remote add origin https://github.com/your-username/your-repo-name.git

# 将当前分支重命名为 main（推荐，符合主流实践）
git branch -M main

# 推送 main 分支到远端 origin
git push -u origin main
```

## 2. 在 Vercel 中导入项目

1.  登录 Vercel，点击 “Add New...” → “Project”。
2.  从 Git 仓库列表中找到并选择你刚刚创建的仓库，点击 “Import”。
3.  在 “Configure Project” 页面，Vercel 可能会自动识别出框架，但为确保无误，请检查并按以下方式配置：
    *   **Framework Preset**: 选择 `Vite`。如果无法识别，选择 `Other`。
    *   **Build and Output Settings**:
        *   **Build Command**: `pnpm run build` (如果 pnpm 不是默认包管理器，可以展开此项并填入 `pnpm i && pnpm run build`)
        *   **Output Directory**: `dist`
        *   **Install Command**: `pnpm install`
    *   **Node.js Version**: 选择 `18.x` 或更高版本。
4.  点击 “Deploy” 按钮，等待部署完成。

## 3. 环境变量

当前项目暂无必须的环境变量。未来如果需要添加（例如 API 地址、统计 Key 等），可以在 Vercel 项目的 “Settings” → “Environment Variables” 中添加。

## 4. 常见问题 (FAQ)

### Q1: 页面刷新后 404 (Not Found)

**原因**: 这是一个单页面应用 (SPA)，Vercel 默认可能无法正确处理前端路由。当刷新非根路径（如 `/library`）时，Vercel 会尝试寻找服务器上的同名文件，但该文件不存在。

**解决方案**: 项目根目录下的 `vercel.json` 文件已配置 `rewrites` 规则，将所有未匹配的请求重定向到 `index.html`。这能保证 Vercel 正确处理 SPA 的路由。如果你在部署时遇到此问题，请确认 `vercel.json` 文件已提交到 Git 仓库。

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Q2: 3D 魔方无法显示或加载缓慢

**原因**: 3D 魔方组件 (`cubing/twisty`) 的脚本是从 `https://cdn.cubing.net/` 加载的。在某些网络环境下，访问此 CDN 可能较慢或被阻断。

**解决方案**:
*   请确保你的网络环境可以正常访问 `cubing.net`。
*   Vercel 的全球 CDN 会缓存静态资源，通常首次加载后访问速度会加快。

如果问题持续存在，未来可以考虑将该脚本 self-host（自托管），但这会增加维护成本。

## 5. 后续开发与部署命令清单

在本地完成代码修改后，你可以使用以下命令将变更推送到远端，并触发 Vercel 自动重新部署：

```bash
# 1. 检查文件状态，确认修改内容
git status

# 2. 将所有修改的文件添加到暂存区
git add .

# 3. 提交变更，并附上清晰的提交信息
# 示例：git commit -m "feat: add new feature"
git commit -m "你的提交信息"

# 4. 推送到远端 main 分支
git push origin main
```

推送成功后，Vercel 会自动拉取最新代码并开始新一轮的部署。你可以在 Vercel 的项目仪表盘中查看部署进度。
