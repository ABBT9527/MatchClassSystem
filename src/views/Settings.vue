<template>
  <div class="settings-page">
    <!-- 普通用户视图 -->
    <template v-if="!isAdmin">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span><el-icon><DataAnalysis /></el-icon> 数据统计</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic title="学生总数" :value="store.students.length" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="课堂数量" :value="store.classrooms.length" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="邀请记录" :value="store.invitations.length" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="评价记录" :value="store.evaluations.length" />
          </el-col>
        </el-row>
      </el-card>

      <el-card shadow="hover" style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span><el-icon><Refresh /></el-icon> 数据同步</span>
            <span class="sync-time" v-if="store.lastSyncTime">上次同步: {{ store.lastSyncTime }}</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-button type="primary" @click="pullFromCloud" :loading="store.isCloudSyncing" style="width: 100%">
              <el-icon><Download /></el-icon> 手动拉取云端数据
            </el-button>
          </el-col>
        </el-row>
        <div style="margin-top: 12px; color: #999; font-size: 12px;">
          <el-icon><InfoFilled /></el-icon> 系统每 60 秒自动拉取云端最新数据
        </div>
      </el-card>

      <!-- 管理员入口 -->
      <el-card shadow="hover" style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span><el-icon><Lock /></el-icon> 管理员模式</span>
          </div>
        </template>
        <el-form @submit.prevent="enterAdmin" style="max-width: 400px">
          <el-form-item>
            <el-input
              v-model="adminPassword"
              type="password"
              placeholder="请输入管理员密码"
              show-password
              @keyup.enter="enterAdmin"
            >
              <template #append>
                <el-button @click="enterAdmin" :loading="verifying">进入</el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-form>
      </el-card>
    </template>

    <!-- 管理员视图 -->
    <template v-else>
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span><el-icon><UserFilled /></el-icon> 管理员控制台</span>
            <el-button type="danger" size="small" @click="exitAdmin">退出管理</el-button>
          </div>
        </template>

        <el-descriptions :column="1" border style="margin-bottom: 20px">
          <el-descriptions-item label="云端存储">
            <el-tag type="success">Supabase</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="自动同步">
            <el-tag type="success">已启用（每 60 秒）</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 数据统计 -->
      <el-card shadow="hover" style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span><el-icon><DataAnalysis /></el-icon> 数据统计</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic title="学生总数" :value="store.students.length" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="课堂数量" :value="store.classrooms.length" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="邀请记录" :value="store.invitations.length" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="评价记录" :value="store.evaluations.length" />
          </el-col>
        </el-row>
      </el-card>

      <!-- 数据同步 -->
      <el-card shadow="hover" style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span><el-icon><Refresh /></el-icon> 数据同步</span>
            <span class="sync-time" v-if="store.lastSyncTime">上次同步: {{ store.lastSyncTime }}</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-button type="primary" @click="pullFromCloud" :loading="store.isCloudSyncing" style="width: 100%">
              <el-icon><Download /></el-icon> 手动拉取云端数据
            </el-button>
          </el-col>
        </el-row>
      </el-card>
    </template>

    <div class="footer-info">
      <span>赛博炼丹真君同修会</span>
      <span>v0.1.8</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAppStore } from '../store'
import { ElMessage } from 'element-plus'

const store = useAppStore()

const isAdmin = ref(false)
const adminPassword = ref('')
const verifying = ref(false)

onMounted(() => {
  isAdmin.value = store.isAdminVerified()
})

function enterAdmin() {
  if (!adminPassword.value) {
    ElMessage.warning('请输入管理员密码')
    return
  }
  verifying.value = true
  setTimeout(() => {
    if (store.verifyAdmin(adminPassword.value)) {
      isAdmin.value = true
      ElMessage.success('已进入管理员模式')
    } else {
      ElMessage.error('管理员密码错误')
    }
    verifying.value = false
  }, 300)
}

function exitAdmin() {
  store.clearAdminSession()
  isAdmin.value = false
  adminPassword.value = ''
  ElMessage.info('已退出管理员模式')
}

async function pullFromCloud() {
  const result = await store.syncFromCloud()
  ElMessage[result.success ? 'success' : 'error'](result.message)
}
</script>

<style scoped>
.settings-page { max-width: 900px; }
.card-header { display: flex; align-items: center; justify-content: space-between; font-weight: 600; }
.card-header .el-icon { margin-right: 6px; vertical-align: middle; }
.sync-time { font-size: 12px; color: #999; font-weight: normal; }
.footer-info { display: flex; justify-content: center; gap: 12px; margin-top: 30px; padding-bottom: 20px; color: #c0c4cc; font-size: 12px; }
</style>
