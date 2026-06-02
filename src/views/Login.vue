<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="gradient-text">智能组队系统</h1>
        <p class="subtitle">Smart Team Matching System</p>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="0">
        <el-form-item prop="studentId">
          <el-input
            v-model="form.studentId"
            placeholder="请输入学号"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width: 100%" @click="handleLogin" :loading="loading">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-footer">
        <span>还没有账号？</span>
        <router-link to="/register" class="link">去注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../store'
import { ElMessage } from 'element-plus'

const router = useRouter()
const store = useAppStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  studentId: '',
  password: '',
})

const rules = {
  studentId: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

// 确保数据已初始化（从云端拉取）
onMounted(async () => {
  loading.value = true
  try {
    await store.initialize()
  } finally {
    loading.value = false
  }
})

const handleLogin = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    // 登录前先拉取最新数据
    await store.syncFromCloud(true)
    const result = store.login(form.studentId, form.password)
    if (result.success) {
      // 登录成功后启动定时同步
      store.startAutoSync(60000)
      ElMessage.success(result.message)
      router.push('/dashboard')
    } else {
      ElMessage.error(result.message)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  width: 420px;
  padding: 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.subtitle {
  color: #999;
  font-size: 14px;
}

.login-footer {
  text-align: center;
  margin-top: 16px;
  color: #666;
  font-size: 14px;
}

.link {
  color: #667eea;
  text-decoration: none;
  margin-left: 4px;
}

.link:hover {
  text-decoration: underline;
}

.demo-hint {
  margin-top: 20px;
  text-align: center;
}

.demo-hint p {
  color: #999;
  font-size: 12px;
}
</style>
