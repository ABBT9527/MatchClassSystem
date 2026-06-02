<template>
  <div class="settings-page">
    <!-- 云端存储状态 -->
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span><el-icon><Cloudy /></el-icon> 云端数据存储</span>
          <el-tag :type="isConfigured ? 'success' : 'warning'">
            {{ isConfigured ? '已连接' : '未配置 Gist ID' }}
          </el-tag>
        </div>
      </template>
      
      <el-descriptions :column="1" border style="margin-bottom: 20px">
        <el-descriptions-item label="Gist ID">
          <code v-if="gistId">{{ gistId }}</code>
          <span v-else style="color: #999">未配置（请修改 gistService.js 中的 BUILTIN_GIST_ID）</span>
        </el-descriptions-item>
        <el-descriptions-item label="读取权限">
          <el-tag type="success" v-if="isConfigured">公开只读</el-tag>
          <el-tag type="danger" v-else>不可用</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="写入权限">
          <el-tag :type="hasWrite ? 'success' : 'warning'">
            {{ hasWrite ? '已配置 Token' : '未配置（无法注册/修改数据）' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <el-alert
        v-if="!isConfigured"
        title="请先配置 Gist ID"
        type="error"
        :closable="false"
        show-icon
        style="margin-bottom: 20px"
      >
        <template #default>
          <p>修改 <code>src/utils/gistService.js</code> 中的 <code>BUILTIN_GIST_ID</code> 为您的 Gist ID</p>
        </template>
      </el-alert>
    </el-card>

    <!-- 管理员 Token 配置 -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span><el-icon><Key /></el-icon> 管理员 Token（写入权限）</span>
        </div>
      </template>
      
      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 20px"
      >
        <template #default>
          <p>配置管理员 Token 后，可以注册新用户、修改数据并同步到云端</p>
        </template>
      </el-alert>

      <el-form :model="tokenForm" label-width="120px" style="max-width: 500px">
        <el-form-item label="GitHub Token">
          <el-input
            v-model="tokenForm.token"
            type="password"
            placeholder="ghp_xxxx... (需要 gist 权限)"
            show-password
          />
          <div class="form-hint">
            <el-link type="primary" @click="showTokenHelp = true">如何获取 Token？</el-link>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveToken" :loading="saving">
            <el-icon><Check /></el-icon> 保存 Token
          </el-button>
          <el-button @click="testToken" :loading="testing" :disabled="!tokenForm.token">
            <el-icon><Connection /></el-icon> 测试
          </el-button>
          <el-button type="danger" @click="clearToken" v-if="hasWrite">
            <el-icon><Delete /></el-icon> 清除
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据同步操作 -->
    <el-card shadow="hover" style="margin-top: 20px" v-if="isConfigured">
      <template #header>
        <div class="card-header">
          <span><el-icon><Refresh /></el-icon> 数据同步</span>
          <span class="sync-time" v-if="store.lastSyncTime">
            上次同步: {{ store.lastSyncTime }}
          </span>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-button type="primary" @click="pullFromCloud" :loading="store.isCloudSyncing" style="width: 100%">
            <el-icon><Download /></el-icon> 从云端拉取
          </el-button>
        </el-col>
        <el-col :span="12">
          <el-button type="success" @click="pushToCloud" :loading="store.isCloudSyncing" :disabled="!hasWrite" style="width: 100%">
            <el-icon><Upload /></el-icon> 推送到云端
          </el-button>
        </el-col>
      </el-row>
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

    <!-- Token 帮助对话框 -->
    <el-dialog v-model="showTokenHelp" title="如何获取 GitHub Token" width="600px">
      <el-steps :active="1" direction="vertical">
        <el-step title="访问 GitHub 设置">
          <template #description>
            <p>前往 <el-link type="primary" href="https://github.com/settings/tokens" target="_blank">GitHub Token 设置页面</el-link></p>
          </template>
        </el-step>
        <el-step title="生成新 Token">
          <template #description>
            <p>点击 "Generate new token (classic)"</p>
          </template>
        </el-step>
        <el-step title="设置权限">
          <template #description>
            <p>勾选 <strong>gist</strong> 权限（创建和管理 Gist）</p>
          </template>
        </el-step>
        <el-step title="复制 Token">
          <template #description>
            <p>点击生成后，复制以 <code>ghp_</code> 开头的 Token</p>
          </template>
        </el-step>
      </el-steps>
      <template #footer>
        <el-button type="primary" @click="showTokenHelp = false">我知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAppStore } from '../store'
import { validateToken, getBuiltinGistId, hasBuiltinGistId } from '../utils/gistService'
import { ElMessage, ElMessageBox } from 'element-plus'

const store = useAppStore()

const tokenForm = reactive({ token: '' })
const saving = ref(false)
const testing = ref(false)
const showTokenHelp = ref(false)

const gistId = ref('')
const isConfigured = ref(false)
const hasWrite = ref(false)

onMounted(() => {
  gistId.value = getBuiltinGistId()
  isConfigured.value = hasBuiltinGistId()
  hasWrite.value = store.hasWritePermission()
  tokenForm.token = store.getAdminToken() || ''
})

async function saveToken() {
  if (!tokenForm.token) {
    ElMessage.warning('请输入 GitHub Token')
    return
  }

  saving.value = true
  try {
    const result = await validateToken(tokenForm.token)
    if (result.success) {
      store.saveAdminToken(tokenForm.token)
      hasWrite.value = true
      ElMessage.success(`Token 已保存，验证用户: ${result.username}`)
    } else {
      ElMessage.error(result.message)
    }
  } finally {
    saving.value = false
  }
}

async function testToken() {
  testing.value = true
  try {
    const result = await validateToken(tokenForm.token)
    if (result.success) {
      ElMessage.success(`Token 有效，用户: ${result.username}`)
    } else {
      ElMessage.error(result.message)
    }
  } finally {
    testing.value = false
  }
}

function clearToken() {
  ElMessageBox.confirm('确定要清除管理员 Token 吗？清除后将无法注册新用户或修改数据。', '提示', {
    type: 'warning'
  }).then(() => {
    store.saveAdminToken('')
    tokenForm.token = ''
    hasWrite.value = false
    ElMessage.success('Token 已清除')
  }).catch(() => {})
}

async function pullFromCloud() {
  const result = await store.syncFromCloud()
  if (result.success) {
    ElMessage.success(result.message)
  } else {
    ElMessage.error(result.message)
  }
}

async function pushToCloud() {
  const result = await store.syncToCloud()
  if (result.success) {
    ElMessage.success(result.message)
  } else {
    ElMessage.error(result.message)
  }
}
</script>

<style scoped>
.settings-page {
  max-width: 900px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.card-header .el-icon {
  margin-right: 6px;
  vertical-align: middle;
}

.form-hint {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.sync-time {
  font-size: 12px;
  color: #999;
  font-weight: normal;
}

code {
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
}
</style>
