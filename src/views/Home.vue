<template>
  <div class="home-page">
    <!-- 欢迎区域 -->
    <el-card class="welcome-card" shadow="hover">
      <div class="welcome-content">
        <div class="welcome-text">
          <h2>欢迎回来，{{ store.currentUser?.name }}！</h2>
          <p class="welcome-desc">{{ welcomeMessage }}</p>
          <div class="welcome-actions">
            <el-button type="primary" size="large" @click="$router.push('/dashboard/matching')">
              <el-icon><Connection /></el-icon> 开始智能匹配
            </el-button>
            <el-button size="large" @click="$router.push('/dashboard/profile')">
              <el-icon><EditPen /></el-icon> 完善个人信息
            </el-button>
          </div>
        </div>
        <div class="welcome-illustration">
          <el-icon :size="80" class="illustration-icon"><UserFilled /></el-icon>
        </div>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="6" v-for="stat in stats" :key="stat.label">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <el-icon :size="32" :class="['stat-icon', stat.color]">
              <component :is="stat.icon" />
            </el-icon>
            <div class="stat-info">
              <span class="stat-value">{{ stat.value }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷入口 -->
    <el-row :gutter="20" class="quick-row">
      <el-col :span="8" v-for="action in quickActions" :key="action.title">
        <el-card class="quick-card" shadow="hover" @click="$router.push(action.path)">
          <el-icon :size="36" :class="['quick-icon', action.color]">
            <component :is="action.icon" />
          </el-icon>
          <h4>{{ action.title }}</h4>
          <p>{{ action.desc }}</p>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近动态 -->
    <el-card class="activity-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span><el-icon><Bell /></el-icon> 最近动态</span>
        </div>
      </template>
      <el-timeline>
        <el-timeline-item
          v-for="(activity, index) in recentActivities"
          :key="index"
          :timestamp="activity.time"
          placement="top"
          :type="activity.type"
        >
          <p>{{ activity.content }}</p>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../store'

const store = useAppStore()

const welcomeMessage = computed(() => {
  const skills = store.currentUser?.skills?.length || 0
  if (skills === 0) return '完善你的个人信息，让系统为你推荐最合适的队友吧！'
  if (skills < 3) return '继续添加更多技能标签，可以获得更精准的匹配结果。'
  return '你的信息已完善，快去寻找最佳队友吧！'
})

const stats = computed(() => [
  {
    label: '我的课堂',
    value: store.classrooms.filter(c => c.students.includes(store.currentUser?.id)).length,
    icon: 'School',
    color: 'icon-blue',
  },
  {
    label: '我的队伍',
    value: store.teams.filter(t => t.members.includes(store.currentUser?.id)).length,
    icon: 'UserFilled',
    color: 'icon-purple',
  },
  {
    label: '待处理邀请',
    value: store.myInvitations.filter(i => i.status === 'pending' && i.to === store.currentUser?.id).length,
    icon: 'Message',
    color: 'icon-orange',
  },
  {
    label: '我的评价',
    value: store.myEvaluations.length,
    icon: 'Star',
    color: 'icon-green',
  },
])

const quickActions = [
  { title: '智能匹配', desc: '基于技能、性格、目标为你推荐最佳队友', icon: 'Connection', color: 'icon-blue', path: '/dashboard/matching' },
  { title: '课堂管理', desc: '查看和加入课堂，管理你的课程', icon: 'School', color: 'icon-purple', path: '/dashboard/classroom' },
  { title: '邀请中心', desc: '发送和接收组队邀请', icon: 'Message', color: 'icon-orange', path: '/dashboard/invitation' },
]

// 从 store 获取最近动态
const recentActivities = computed(() => store.recentActivities)
</script>

<style scoped>
.home-page {
  max-width: 1200px;
}

.welcome-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.welcome-card :deep(.el-card__body) {
  padding: 30px;
}

.welcome-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.welcome-text h2 {
  color: white;
  font-size: 24px;
  margin-bottom: 8px;
}

.welcome-desc {
  color: rgba(255, 255, 255, 0.85);
  font-size: 15px;
  margin-bottom: 20px;
}

.welcome-actions .el-button--default {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
}

.welcome-actions .el-button--default:hover {
  background: rgba(255, 255, 255, 0.3);
}

.welcome-illustration {
  opacity: 0.3;
}

.illustration-icon {
  color: white;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  cursor: default;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  padding: 10px;
  border-radius: 12px;
}

.icon-blue {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.icon-purple {
  color: #764ba2;
  background: rgba(118, 75, 162, 0.1);
}

.icon-orange {
  color: #e6a23c;
  background: rgba(230, 162, 60, 0.1);
}

.icon-green {
  color: #67c23a;
  background: rgba(103, 194, 58, 0.1);
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.stat-label {
  display: block;
  font-size: 13px;
  color: #999;
  margin-top: 2px;
}

.quick-row {
  margin-bottom: 20px;
}

.quick-card {
  cursor: pointer;
  text-align: center;
  padding: 10px;
}

.quick-card h4 {
  margin: 12px 0 6px;
  font-size: 16px;
  color: #333;
}

.quick-card p {
  color: #999;
  font-size: 13px;
  margin: 0;
}

.quick-icon {
  margin-top: 8px;
}

.activity-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  font-weight: 600;
}

.card-header .el-icon {
  margin-right: 6px;
  vertical-align: middle;
}
</style>
