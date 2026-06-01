<template>
  <el-container class="dashboard-container">
    <!-- 侧边栏 -->
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <h2 class="gradient-text">智能组队</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="transparent"
        text-color="#333"
        active-text-color="#667eea"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/dashboard/home">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/matching">
          <el-icon><Connection /></el-icon>
          <span>智能匹配</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/profile">
          <el-icon><User /></el-icon>
          <span>个人信息</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/classroom">
          <el-icon><School /></el-icon>
          <span>课堂管理</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/invitation">
          <el-icon><Message /></el-icon>
          <span>邀请中心</span>
          <el-badge v-if="pendingCount > 0" :value="pendingCount" class="nav-badge" />
        </el-menu-item>
        <el-menu-item index="/dashboard/evaluation">
          <el-icon><Star /></el-icon>
          <span>评价系统</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/database">
          <el-icon><Files /></el-icon>
          <span>信息库</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/settings">
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>
      <div class="sidebar-footer">
        <el-button type="danger" text @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          退出登录
        </el-button>
      </div>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <h3>{{ pageTitle }}</h3>
        </div>
        <div class="header-right">
          <el-avatar :size="36" class="user-avatar">
            {{ store.currentUser?.name?.charAt(0) || 'U' }}
          </el-avatar>
          <span class="user-name">{{ store.currentUser?.name }}</span>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../store'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const store = useAppStore()

const activeMenu = computed(() => route.path)

const pageTitle = computed(() => {
  const titles = {
    '/dashboard/home': '首页',
    '/dashboard/matching': '智能匹配',
    '/dashboard/profile': '个人信息',
    '/dashboard/classroom': '课堂管理',
    '/dashboard/invitation': '邀请中心',
    '/dashboard/evaluation': '评价系统',
    '/dashboard/database': '信息库',
    '/dashboard/settings': '系统设置',
  }
  return titles[route.path] || '首页'
})

const pendingCount = computed(() => {
  return store.myInvitations.filter(i => i.status === 'pending' && i.to === store.currentUser?.id).length
})

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    store.logout()
    router.push('/login')
    ElMessage.success('已退出登录')
  }).catch(() => {})
}

const handleMenuSelect = (index) => {
  router.push(index)
}
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.sidebar {
  background: white;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

.logo h2 {
  font-size: 20px;
}

.el-menu {
  border-right: none;
  padding: 10px 0;
}

.el-menu-item {
  margin: 2px 8px;
  border-radius: 8px;
}

.el-menu-item.is-active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)) !important;
}

.nav-badge {
  margin-left: 8px;
}

.sidebar-footer {
  margin-top: auto;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}

.header {
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: 60px;
}

.header h3 {
  font-size: 18px;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-weight: 600;
}

.user-name {
  font-size: 14px;
  color: #666;
}

.main-content {
  padding: 24px;
  background: #f5f7fa;
}
</style>
