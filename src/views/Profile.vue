<template>
  <div class="profile-page">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span><el-icon><EditPen /></el-icon> 编辑个人信息</span>
          <el-tag type="success">完善信息可提高匹配精度</el-tag>
        </div>
      </template>
      <el-form :model="form" label-width="100px" style="max-width: 700px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名">
              <el-input :value="store.currentUser?.name" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学号">
              <el-input :value="store.currentUser?.studentId" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="专业">
              <el-input :value="store.currentUser?.major" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年级">
              <el-input :value="store.currentUser?.grade" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="个人简介">
          <el-input v-model="form.bio" type="textarea" :rows="3" placeholder="介绍一下自己吧..." />
        </el-form-item>
        <el-form-item label="空闲时间">
          <el-input v-model="form.availableTime" placeholder="例如：周一至周五晚上、周末全天" />
        </el-form-item>
        <el-form-item label="技能标签">
          <el-checkbox-group v-model="form.skills">
            <el-checkbox v-for="skill in skillOptions" :key="skill" :label="skill" :value="skill" />
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="性格类型">
          <el-radio-group v-model="form.personality">
            <el-radio v-for="p in personalityOptions" :key="p.value" :value="p.value">
              {{ p.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="学习目标">
          <el-checkbox-group v-model="form.goals">
            <el-checkbox v-for="goal in goalOptions" :key="goal" :label="goal" :value="goal" />
          </el-checkbox-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveProfile" :loading="saving">
            <el-icon><Check /></el-icon> 保存信息
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 我的评价 -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span><el-icon><Star /></el-icon> 我收到的评价</span>
        </div>
      </template>
      <div v-if="receivedEvals.length > 0">
        <el-timeline>
          <el-timeline-item
            v-for="item in receivedEvals"
            :key="item.id"
            :timestamp="item.createdAt"
            placement="top"
          >
            <el-card shadow="never" class="eval-card">
              <div class="eval-header">
                <span class="eval-from">{{ getStudentName(item.from) }} 对我的评价</span>
                <el-rate :model-value="getAvgRating(item)" disabled show-score />
              </div>
              <div class="eval-scores">
                <el-tag size="small" type="primary">协作 {{ item.teamwork }}/5</el-tag>
                <el-tag size="small" type="success">沟通 {{ item.communication }}/5</el-tag>
                <el-tag size="small" type="warning">技术 {{ item.technical }}/5</el-tag>
                <el-tag size="small" type="danger">责任 {{ item.responsibility }}/5</el-tag>
              </div>
              <p class="eval-comment">{{ item.comment }}</p>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
      <el-empty v-else description="暂无评价" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAppStore } from '../store'
import { skillOptions, personalityOptions, goalOptions } from '../data/mockData'
import { ElMessage } from 'element-plus'

const store = useAppStore()
const saving = ref(false)

const form = reactive({
  bio: '',
  availableTime: '',
  skills: [],
  personality: '',
  goals: [],
})

onMounted(() => {
  if (store.currentUser) {
    form.bio = store.currentUser.bio || ''
    form.availableTime = store.currentUser.availableTime || ''
    form.skills = [...(store.currentUser.skills || [])]
    form.personality = store.currentUser.personality || ''
    form.goals = [...(store.currentUser.goals || [])]
  }
})

const receivedEvals = computed(() => {
  return store.myEvaluations.filter(e => e.to === store.currentUser?.id)
})

function getStudentName(id) {
  const s = store.students.find(s => s.id === id)
  return s ? s.name : '未知'
}

function getAvgRating(evalItem) {
  return ((evalItem.teamwork + evalItem.communication + evalItem.technical + evalItem.responsibility) / 4).toFixed(1)
}

async function saveProfile() {
  saving.value = true
  try {
    const result = await store.updateProfile({
      bio: form.bio,
      availableTime: form.availableTime,
      skills: form.skills,
      personality: form.personality,
      goals: form.goals,
    })
    if (result && result.success) {
      ElMessage.success(result.message)
    } else if (result) {
      ElMessage.warning(result.message)
    } else {
      ElMessage.success('个人信息已保存')
    }
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message)
  } finally {
    saving.value = false
  }
}

function resetForm() {
  if (store.currentUser) {
    form.bio = store.currentUser.bio || ''
    form.availableTime = store.currentUser.availableTime || ''
    form.skills = [...(store.currentUser.skills || [])]
    form.personality = store.currentUser.personality || ''
    form.goals = [...(store.currentUser.goals || [])]
  }
}
</script>

<style scoped>
.profile-page {
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

.eval-card {
  margin-bottom: 8px;
}

.eval-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.eval-from {
  font-weight: 600;
  color: #333;
}

.eval-scores {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.eval-comment {
  color: #666;
  font-size: 14px;
  margin: 0;
}
</style>
