# 部署清单 - MatchClassSystem

## 仓库信息
- **用户名**: ABBT9527
- **仓库名**: MatchClassSystem
- **访问地址**: `https://ABBT9527.github.io/MatchClassSystem/`

## 部署步骤

### 1. 清理现有仓库（如果需要）
```bash
# 在浏览器中访问
https://github.com/ABBT9527/MatchClassSystem

# 删除所有文件（Settings -> Danger Zone -> Delete this repository）
# 或保留仓库，直接推送新代码覆盖
```

### 2. 初始化并推送代码
```bash
# 进入项目目录
cd d:\MCS\smart-team-matching

# 初始化 git（如果还没初始化）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit - Smart Team Matching System"

# 添加远程仓库
git remote add origin https://github.com/ABBT9527/MatchClassSystem.git

# 推送代码
git branch -M main
git push -u origin main --force
```

### 3. 启用 GitHub Pages
1. 访问 `https://github.com/ABBT9527/MatchClassSystem/settings/pages`
2. 在 **Source** 下选择 **GitHub Actions**
3. 等待自动部署完成（约 2-3 分钟）

### 4. 验证部署
访问 `https://ABBT9527.github.io/MatchClassSystem/`

## 配置云端存储（可选但推荐）

### 获取 GitHub Token
1. 访问 `https://github.com/settings/tokens`
2. 点击 **Generate new token (classic)**
3. 勾选 **gist** 权限
4. 生成并复制 Token

### 在系统中配置
1. 部署完成后，访问网站
2. 使用任意学号登录
3. 进入 **系统设置** 页面
4. 粘贴 GitHub Token
5. 点击 **保存配置**
6. 系统会自动创建 Gist 并存储数据

## 文件说明

| 文件 | 用途 |
|------|------|
| `src/main.js` | 应用入口，已配置自动初始化 |
| `src/store/index.js` | 状态管理，集成云端同步 |
| `src/utils/gistService.js` | GitHub Gist API 服务 |
| `src/views/Settings.vue` | 系统设置页面 |
| `vite.config.js` | Vite 配置，base 路径已设为 `/MatchClassSystem/` |
| `.github/workflows/deploy.yml` | GitHub Actions 自动部署配置 |

## 快速修改数据的方法

### 方法1：通过浏览器控制台（最简单）
```javascript
// 查看所有学生
const data = JSON.parse(localStorage.getItem('appData'))
console.log(data.students)

// 修改学生姓名
data.students[0].name = '新名字'
localStorage.setItem('appData', JSON.stringify(data))
location.reload()
```

### 方法2：通过系统界面
- 进入 **信息库** 页面查看所有学生
- 进入 **个人信息** 页面修改自己的信息
- 进入 **系统设置** 页面同步数据

### 方法3：通过 GitHub Gist
1. 访问 `https://gist.github.com/ABBT9527`
2. 找到系统创建的 Gist
3. 直接编辑 JSON 数据
4. 在系统设置页面点击 **从云端拉取**

## 注意事项

1. **首次访问可能需要等待** GitHub Actions 完成构建（2-3分钟）
2. **数据存储在浏览器本地**，清除浏览器数据会丢失未同步的数据
3. **配置云端存储后**，数据会自动备份到 GitHub Gist
4. **Token 安全**：不要分享你的 GitHub Token

## 故障排除

### 页面空白或 404
- 检查 GitHub Actions 是否成功运行
- 确认 `vite.config.js` 中的 `base` 路径正确

### 数据不保存
- 检查浏览器是否禁用了 localStorage
- 尝试配置云端存储

### 无法同步到云端
- 检查 Token 是否有 gist 权限
- 检查网络连接
- 查看浏览器控制台错误信息
