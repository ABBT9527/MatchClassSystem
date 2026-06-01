# 智能组队系统 - 数据管理指南

## 数据存储架构

系统采用 **本地存储 + 云端同步** 的双层架构：

```
┌─────────────────────────────────────────────────────────┐
│                      用户浏览器                          │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │  localStorage   │    │        GitHub Gist          │ │
│  │  - currentUser  │◄──►│  team-matching-data.json    │ │
│  │  - appData      │    │  (加密存储，私有访问)        │ │
│  │  - gist_config  │    │                             │ │
│  │  - lastSyncTime │    │                             │ │
│  └─────────────────┘    └─────────────────────────────┘ │
│           ▲                      ▲                      │
│           │                      │                      │
│           └──────────────────────┘                      │
│              系统设置页面操作                            │
└─────────────────────────────────────────────────────────┘
```

## 数据结构说明

### 1. 学生数据 (students)

```javascript
{
  id: 1,                          // 唯一标识
  name: '张三',                    // 姓名
  studentId: '2024001',           // 学号
  major: '计算机科学与技术',        // 专业
  grade: '大二',                  // 年级
  skills: ['前端开发', 'UI设计'],  // 技能标签
  personality: 'creative',        // 性格类型
  goals: ['完成课程项目'],         // 学习目标
  avatar: '',                     // 头像URL
  bio: '个人简介',                 // 自我介绍
  availableTime: '周一至周五晚上', // 空闲时间
  score: 85,                      // 综合评分
}
```

### 2. 课堂数据 (classrooms)

```javascript
{
  id: 1,
  name: 'Web前端开发实训',
  teacher: '刘教授',
  description: '课程描述',
  maxTeamSize: 4,                 // 最大组队人数
  students: [1, 2, 6, 8],         // 参与学生ID列表
  startDate: '2026-03-01',
  endDate: '2026-06-30',
  status: 'active',               // active/completed
}
```

### 3. 邀请数据 (invitations)

```javascript
{
  id: 1,
  from: 1,                        // 发送者ID
  to: 2,                          // 接收者ID
  classroomId: 1,                 // 所属课堂
  message: '邀请留言',
  status: 'pending',              // pending/accepted/rejected
  createdAt: '2026-05-15 10:30',
}
```

### 4. 评价数据 (evaluations)

```javascript
{
  id: 1,
  from: 1,                        // 评价者ID
  to: 2,                          // 被评价者ID
  classroomId: 1,
  teamwork: 5,                    // 团队协作 (1-5)
  communication: 4,               // 沟通能力 (1-5)
  technical: 5,                   // 技术水平 (1-5)
  responsibility: 5,              // 责任心 (1-5)
  comment: '评价内容',
  createdAt: '2026-05-10',
}
```

### 5. 队伍数据 (teams)

```javascript
{
  id: 1,
  name: '前端之星队',
  classroomId: 1,
  members: [1, 2, 6, 8],          // 成员ID列表
  leader: 1,                      // 队长ID
  createdAt: '2026-05-01',
}
```

## 读取和修改数据的方法

### 方法一：通过系统界面（推荐）

#### 查看所有学生
1. 登录系统
2. 进入 **信息库** 页面
3. 查看所有学生信息

#### 修改学生信息
1. 进入 **个人信息** 页面
2. 编辑并保存自己的信息
3. 或使用 **系统设置** 页面同步云端数据

#### 查看统计数据
1. 进入 **系统设置** 页面
2. 查看数据统计卡片：
   - 学生总数
   - 课堂数量
   - 邀请记录
   - 评价记录

### 方法二：通过浏览器开发者工具

#### 读取本地数据
```javascript
// 查看当前登录用户
JSON.parse(localStorage.getItem('currentUser'))

// 查看所有应用数据
JSON.parse(localStorage.getItem('appData'))

// 查看云端配置
JSON.parse(localStorage.getItem('gist_config'))
```

#### 修改本地数据
```javascript
// 修改学生数据（示例：修改第一个学生的姓名）
const appData = JSON.parse(localStorage.getItem('appData'))
appData.students[0].name = '新姓名'
localStorage.setItem('appData', JSON.stringify(appData))

// 刷新页面生效
location.reload()
```

### 方法三：通过 GitHub Gist 直接编辑

#### 步骤：
1. 访问 [GitHub Gist](https://gist.github.com/)
2. 找到系统创建的 Gist（描述为"智能组队系统数据存储"）
3. 点击 `team-matching-data.json` 文件
4. 点击右上角 **Edit** 按钮
5. 修改 JSON 数据
6. 点击 **Update secret gist**
7. 在系统设置页面点击 **从云端拉取**

#### Gist 数据格式示例：
```json
{
  "students": [...],
  "classrooms": [...],
  "invitations": [...],
  "evaluations": [...],
  "teams": [...],
  "updatedAt": "2026-06-01T12:00:00.000Z"
}
```

### 方法四：通过代码批量操作

在浏览器控制台执行：

```javascript
// 获取 store 实例
const store = __VUE_DEVTOOLS_GLOBAL_HOOK__.stores.find(s => s.storeId === 'app')

// 查看所有学生
console.table(store.students)

// 添加新学生
store.students.push({
  id: store.students.length + 1,
  name: '新学生',
  studentId: '2024999',
  major: '计算机科学',
  grade: '大二',
  skills: ['前端开发'],
  personality: 'learner',
  goals: ['完成课程项目'],
  score: 80
})

// 保存到本地
store.saveToLocal()

// 同步到云端
await store.syncToCloud()
```

## 数据备份与恢复

### 备份数据

#### 方式1：导出本地数据
```javascript
// 在浏览器控制台执行
const data = localStorage.getItem('appData')
const blob = new Blob([data], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'team-matching-backup-' + new Date().toISOString().split('T')[0] + '.json'
a.click()
```

#### 方式2：通过 Gist 备份
云端数据已经自动存储在 GitHub Gist 中，可随时访问：
`https://gist.github.com/你的用户名/GistID`

### 恢复数据

#### 方式1：导入本地备份
```javascript
// 选择备份文件后，在控制台执行
const backupData = `粘贴备份文件内容`
localStorage.setItem('appData', backupData)
location.reload()
```

#### 方式2：从 Gist 恢复
1. 进入 **系统设置** 页面
2. 点击 **从云端拉取** 按钮
3. 数据将自动恢复到本地

## 常见问题

### Q1: 数据丢失了怎么办？

**检查步骤：**
1. 检查是否配置了云端存储（系统设置页面）
2. 尝试从云端拉取数据
3. 检查浏览器是否清除了 localStorage
4. 查看 GitHub Gist 是否还存在

### Q2: 如何清空所有数据？

```javascript
// 在浏览器控制台执行
localStorage.removeItem('appData')
localStorage.removeItem('currentUser')
localStorage.removeItem('gist_config')
location.reload()
```

### Q3: 如何迁移数据到新设备？

1. 在原设备上配置好云端存储
2. 点击 **推送到云端**
3. 在新设备上登录系统
4. 配置相同的 GitHub Token 和 Gist ID
5. 点击 **从云端拉取**

### Q4: 如何修改其他学生的数据？

**注意：** 系统设计上只允许修改自己的信息。如需修改其他学生数据：

1. **通过 Gist 编辑**（推荐）
   - 直接修改 Gist 中的 JSON 数据
   - 所有设备同步后会生效

2. **通过管理员模式**（需要修改代码）
   ```javascript
   // 在 store/index.js 中添加管理员功能
   function updateStudent(studentId, data) {
     const idx = students.value.findIndex(s => s.studentId === studentId)
     if (idx !== -1) {
       students.value[idx] = { ...students.value[idx], ...data }
       saveToLocal()
     }
   }
   ```

## 安全提示

1. **GitHub Token 安全**
   - Token 存储在浏览器本地，不要分享给他人
   - 如 Token 泄露，立即在 GitHub 上删除并重新生成
   - 公共电脑上使用后清除浏览器数据

2. **数据隐私**
   - Gist 设置为私有（secret），只有知道链接的人能访问
   - 敏感信息（如密码）建议加密存储

3. **定期备份**
   - 建议定期导出本地数据备份
   - 重要操作前先推送数据到云端
