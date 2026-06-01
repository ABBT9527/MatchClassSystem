# 智能组队系统 - 部署指南

## 项目概述

这是一个大学生课堂智能组队系统，支持：
- 学生注册与登录
- 智能匹配队友
- 课堂管理
- 组队邀请
- 同伴评价
- 云端数据同步（GitHub Gist）

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 部署到 GitHub Pages

### 步骤 1：创建 GitHub 仓库

1. 在 GitHub 上创建新仓库（如 `MatchClassSystem`）
2. 将代码推送到仓库：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/MatchClassSystem.git
git push -u origin main
```

### 步骤 2：配置 Vite 基础路径

修改 `vite.config.js` 中的 `base` 配置：

```javascript
export default defineConfig({
  plugins: [vue()],
  base: '/你的仓库名/'  // 例如 '/MatchClassSystem/'
})
```

### 步骤 3：启用 GitHub Pages

1. 进入仓库的 **Settings** > **Pages**
2. 在 **Source** 下选择 **GitHub Actions**
3. 推送代码后，GitHub Actions 会自动构建和部署

### 步骤 4：访问应用

部署完成后，访问地址为：
```
https://你的用户名.github.io/仓库名/
```

## 配置云端数据存储

系统支持使用 GitHub Gist 存储学生数据，实现多设备数据同步。

### 获取 GitHub Token

1. 访问 [GitHub Token 设置](https://github.com/settings/tokens)
2. 点击 **Generate new token (classic)**
3. 勾选 **gist** 权限
4. 生成并复制 Token（以 `ghp_` 开头）

### 在系统中配置

1. 登录系统后，进入 **系统设置** 页面
2. 输入 GitHub Token
3. 点击 **保存配置**（系统会自动创建 Gist）
4. 使用 **数据同步** 功能上传/下载数据

## 项目结构

```
├── src/
│   ├── main.js          # 应用入口
│   ├── App.vue          # 根组件
│   ├── router/          # 路由配置
│   ├── store/           # Pinia 状态管理
│   ├── views/           # 页面组件
│   │   ├── Login.vue    # 登录页
│   │   ├── Register.vue # 注册页
│   │   ├── Dashboard.vue# 主布局
│   │   ├── Home.vue     # 首页
│   │   ├── Matching.vue # 智能匹配
│   │   ├── Profile.vue  # 个人信息
│   │   ├── Classroom.vue# 课堂管理
│   │   ├── Invitation.vue# 邀请中心
│   │   ├── Evaluation.vue# 评价系统
│   │   ├── Database.vue # 信息库
│   │   └── Settings.vue # 系统设置
│   ├── utils/           # 工具函数
│   │   ├── matching.js  # 匹配算法
│   │   └── gistService.js# 云端存储服务
│   └── data/            # 模拟数据
├── .github/workflows/   # GitHub Actions 配置
├── vite.config.js       # Vite 配置
└── package.json         # 项目配置
```

## 技术栈

- **前端框架**: Vue 3 + Vite
- **UI 组件**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **云端存储**: GitHub Gist API

## 注意事项

1. **数据安全**: GitHub Token 存储在浏览器 localStorage 中，请勿在公共电脑上保存
2. **数据备份**: 建议定期使用"推送到云端"功能备份数据
3. **首次部署**: 需要修改 `vite.config.js` 中的 `base` 路径为你的仓库名

## 更新日志

### v1.0.0
- ✅ 修复路由配置错误
- ✅ 修复注册跳转问题
- ✅ 修复评分 NAN 问题
- ✅ 集成 GitHub Gist 云端存储
- ✅ 添加系统设置页面
- ✅ 优化数据持久化逻辑
