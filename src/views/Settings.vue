<template>
  <div class="settings-page">
    <!-- 云端存储配置 -->
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span><el-icon><Cloudy /></el-icon> 云端数据存储</span>
          <el-tag :type="isConfigured ? 'success' : 'info'">
            {{ isConfigured ? '已配置' : '未配置' }}
          </el-tag>
        </div>
      </template>
      
      <el-alert
        v-if="!isConfigured"
        title="配置云端存储后，学生数据将同步到 GitHub Gist，实现多设备数据共享"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 20px"
      />

      <el-form :model="gistForm" label-width="140px" style="max-width: 600px">
        <el-form-item label="GitHub Token">
          <el-input
            v-model="gistForm.token"
            type="password"
            placeholder="ghp_xxxx... (需要 gist 权限)"
            show-password
          />
          <div class="form-hint">
            <el-link type="primary" @click="showTokenHelp = true">如何获取 Token？</el-link>
          </div>
        </el-form-item>
        <el-form-item label="Gist ID">
          <el-input
            v-model="gistForm.gistId"
            placeholder="留空则自动创建新 Gist"
          />
          <div class="form-hint">可选：填入已有 Gist ID 以使用现有数据</div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveConfig" :loading="saving">
            <el-icon><Check /></el-icon> 保存配置
          </el-button>
          <el-button @click="testConnection" :loading="testing" :disabled="!gistForm.token">
            <el-icon><Connection /></el-icon> 测试连接
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
          <el-button type="success" @click="pushToCloud" :loading="store.isCloudSyncing" style="width: 100%">
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
import { validateToken, createGist, isGistConfigured } from '../utils/gistService'
import { ElMessage } from 'element-plus'

const store = useAppStore()

const gistForm = reactive({
  token: '',
  gistId: '',
})

const saving = ref(false)
const testing = ref(false)
const showTokenHelp = ref(false)
const isConfigured = ref(false)

onMounted(() => {
  const config = store.getGistConfig()
  gistForm.token = config.token || ''
  gistForm.gistId = config.gistId || ''
  isConfigured.value = isGistConfigured()
})

async function saveConfig() {
  if (!gistForm.token) {
    ElMessage.warning('请输入 GitHub Token')
    return
  }

  saving.value = true
  try {
    // 验证 Token
    const validateResult = await validateToken(gistForm.token)
    if (!validateResult.success) {
      ElMessage.error(validateResult.message)
      return
    }

    // 如果没有 Gist ID，创建新的
    if (!gistForm.gistId) {
      const createResult = await createGist(gistForm.token, {
        students: store.students,
        classrooms: store.classrooms,
        invitations: store.invitations,
        evaluations: store.evaluations,
        teams: store.teams,
        createdAt: new Date().toISOString()
      })
      if (!createResult.success) {
        ElMessage.error(createResult.message)
        return
      }
      gistForm.gistId = createResult.gistId
      ElMessage.success(`Gist 已创建，ID: ${createResult.gistId}`)
    }

    // 保存配置
    store.saveGistConfig(gistForm.token, gistForm.gistId)
    isConfigured.value = true
    ElMessage.success('配置保存成功')
  } finally {
    saving.value = false
  }
}

async function testConnection() {
  testing.value = true
  try {
    const result = await validateToken(gistForm.token)
    if (result.success) {
      ElMessage.success(`连接成功！用户: ${result.username}`)
    } else {
      ElMessage.error(result.message)
    }
  } finally {
    testing.value = false
  }
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
</style>
