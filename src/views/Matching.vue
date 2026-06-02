<template>
  <div class="matching-page">
    <el-row :gutter="20">
      <!-- 左侧：匹配推荐 -->
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><Search /></el-icon> 智能匹配推荐</span>
              <el-button type="primary" size="small" @click="refreshMatches">
                <el-icon><Refresh /></el-icon> 重新匹配
              </el-button>
            </div>
          </template>

          <div v-if="matchResults.length > 0">
            <el-card
              v-for="result in matchResults"
              :key="result.student.id"
              shadow="never"
              class="match-card"
            >
              <div class="match-header">
                <div class="student-info">
                  <el-avatar :size="50" :src="result.student.avatar || '/default-avatar.png'" />
                  <div class="info-text">
                    <h4>{{ result.student.name }}</h4>
                    <p>{{ result.student.major }} · {{ result.student.grade }}</p>
                  </div>
                </div>
                <div class="match-score">
                  <el-progress
                    type="circle"
                    :percentage="result.score.total"
                    :stroke-width="8"
                    :width="60"
                    :color="getScoreColor(result.score.total)"
                  />
                  <span class="score-label">匹配度</span>
                </div>
              </div>

              <div class="match-detail">
                <div class="detail-row">
                  <span class="detail-label">技能互补</span>
                  <el-progress :percentage="result.score.skill" :stroke-width="8" :color="'#667eea'" :show-text="true" style="flex:1" />
                </div>
                <div class="detail-row">
                  <span class="detail-label">性格兼容</span>
                  <el-progress :percentage="result.score.personality" :stroke-width="8" :color="'#764ba2'" :show-text="true" style="flex:1" />
                </div>
                <div class="detail-row">
                  <span class="detail-label">目标一致</span>
                  <el-progress :percentage="result.score.goal" :stroke-width="8" :color="'#f093fb'" :show-text="true" style="flex:1" />
                </div>
                <div class="detail-row">
                  <span class="detail-label">评分相似</span>
                  <el-progress :percentage="result.score.scoreSimilarity || 50" :stroke-width="8" :color="'#4facfe'" :show-text="true" style="flex:1" />
                </div>
              </div>

              <div class="match-actions">
                <el-button type="primary" @click="inviteStudent(result.student)">
                  <el-icon><Message /></el-icon> 发送邀请
                </el-button>
                <el-button @click="viewProfile(result.student)">
                  <el-icon><User /></el-icon> 查看详情
                </el-button>
              </div>
            </el-card>
          </div>

          <el-empty v-else description="暂无匹配推荐" :image-size="120" />
        </el-card>
      </el-col>

      <!-- 右侧：筛选条件 -->
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><Filter /></el-icon> 筛选条件</span>
            </div>
          </template>

          <el-form label-position="top">
            <el-form-item label="目标课堂">
              <el-select v-model="filter.classroomId" placeholder="选择课堂" clearable style="width: 100%">
                <el-option
                  v-for="classroom in store.classrooms"
                  :key="classroom.id"
                  :label="classroom.name"
                  :value="classroom.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="期望技能">
              <el-select
                v-model="filter.skills"
                multiple
                placeholder="选择期望技能"
                style="width: 100%"
              >
                <el-option
                  v-for="skill in skillOptions"
                  :key="skill"
                  :label="skill"
                  :value="skill"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="性格偏好">
              <el-select v-model="filter.personality" placeholder="选择性格" clearable style="width: 100%">
                <el-option
                  v-for="p in personalityOptions"
                  :key="p.value"
                  :label="p.label"
                  :value="p.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" style="width: 100%" @click="applyFilter">
                <el-icon><Search /></el-icon> 应用筛选
              </el-button>
              <el-button style="width: 100%; margin-top: 10px; margin-left: 0" @click="resetFilter">
                <el-icon><RefreshLeft /></el-icon> 重置条件
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>


      </el-col>
    </el-row>

    <!-- 发送邀请对话框 -->
    <el-dialog v-model="inviteDialogVisible" title="发送组队邀请" width="400px">
      <el-form :model="inviteForm" label-width="80px">
        <el-form-item label="邀请对象">
          <span>{{ inviteTarget?.name }}</span>
        </el-form-item>
        <el-form-item label="目标课堂">
          <el-select v-model="inviteForm.classroomId" placeholder="选择课堂" style="width: 100%">
            <el-option
              v-for="classroom in store.classrooms"
              :key="classroom.id"
              :label="classroom.name"
              :value="classroom.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="邀请留言">
          <el-input
            v-model="inviteForm.message"
            type="textarea"
            :rows="3"
            placeholder="写点什么..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inviteDialogVisible = false" :disabled="inviteSending">取消</el-button>
        <el-button type="primary" @click="confirmInvite" :loading="inviteSending">发送邀请</el-button>
      </template>
    </el-dialog>

    <!-- 学生详情对话框 -->
    <el-dialog v-model="profileDialogVisible" title="学生详情" width="500px">
      <div v-if="selectedStudent" class="profile-detail">
        <div class="profile-header">
          <el-avatar :size="80" :src="selectedStudent.avatar || '/default-avatar.png'" />
          <div class="profile-info">
            <h3>{{ selectedStudent.name }}</h3>
            <p>{{ selectedStudent.major }} · {{ selectedStudent.grade }}</p>
            <el-tag v-if="selectedStudent.personality" type="info">
              {{ getPersonalityLabel(selectedStudent.personality) }}
            </el-tag>
          </div>
        </div>

        <el-divider />

        <div class="profile-section">
          <h4>个人简介</h4>
          <p>{{ selectedStudent.bio || '暂无简介' }}</p>
        </div>

        <div class="profile-section">
          <h4>技能标签</h4>
          <el-tag v-for="skill in selectedStudent.skills" :key="skill" class="skill-tag">
            {{ skill }}
          </el-tag>
          <span v-if="!selectedStudent.skills?.length" style="color: #999">暂无技能标签</span>
        </div>

        <div class="profile-section">
          <h4>学习目标</h4>
          <el-tag v-for="goal in selectedStudent.goals" :key="goal" type="success" class="goal-tag">
            {{ goal }}
          </el-tag>
          <span v-if="!selectedStudent.goals?.length" style="color: #999">暂无学习目标</span>
        </div>

        <div class="profile-section">
          <h4>空闲时间</h4>
          <p>{{ selectedStudent.availableTime || '未填写' }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAppStore } from '../store'
import { findBestMatches } from '../utils/matching'
import { skillOptions, personalityOptions } from '../data/mockData'
import { ElMessage } from 'element-plus'

const store = useAppStore()

// 筛选条件
const filter = reactive({
  classroomId: null,
  skills: [],
  personality: '',
})

// 匹配结果
const matchResults = ref([])

// 邀请对话框
const inviteDialogVisible = ref(false)
const inviteSending = ref(false)
const inviteTarget = ref(null)
const inviteForm = reactive({
  classroomId: null,
  message: '',
})

// 详情对话框
const profileDialogVisible = ref(false)
const selectedStudent = ref(null)

// 初始化
onMounted(() => {
  refreshMatches()
})

// 刷新匹配推荐
function refreshMatches() {
  if (!store.currentUser) return

  const otherStudents = store.students.filter(s => s.id !== store.currentUser.id)
  const results = findBestMatches(store.currentUser, otherStudents, 20)

  // 应用筛选（改为加权放大而非强制筛选）
  matchResults.value = results.map(result => {
    const student = result.student
    let bonusScore = 0
    let hasFilter = false

    // 课堂筛选：同课堂加分，非同课堂不扣分
    if (filter.classroomId) {
      hasFilter = true
      const classroom = store.classrooms.find(c => c.id === filter.classroomId)
      if (classroom && classroom.students.includes(student.id)) {
        bonusScore += 15 // 同课堂加分
      }
    }

    // 技能筛选：有期望技能加分
    if (filter.skills.length > 0) {
      hasFilter = true
      const matchedSkills = filter.skills.filter(skill => student.skills?.includes(skill))
      bonusScore += matchedSkills.length * 8 // 每个匹配技能加8分
    }

    // 性格筛选：匹配性格加分
    if (filter.personality) {
      hasFilter = true
      if (student.personality === filter.personality) {
        bonusScore += 12 // 性格匹配加分
      }
    }

    // 应用加分（最高不超过100）
    if (hasFilter) {
      result.score.total = Math.min(100, result.score.total + bonusScore)
    }

    return result
  }).sort((a, b) => b.score.total - a.score.total).slice(0, 5) // 重新排序并取前5
}

// 应用筛选
function applyFilter() {
  refreshMatches()
  ElMessage.success('筛选已应用')
}

// 重置筛选
function resetFilter() {
  filter.classroomId = null
  filter.skills = []
  filter.personality = ''
  refreshMatches()
  ElMessage.success('筛选已重置')
}



// 邀请学生
function inviteStudent(student) {
  inviteTarget.value = student
  inviteForm.classroomId = filter.classroomId || (store.classrooms[0]?.id)
  inviteForm.message = ''
  inviteDialogVisible.value = true
}

// 确认发送邀请
async function confirmInvite() {
  if (inviteSending.value) return

  if (!inviteForm.classroomId) {
    ElMessage.warning('请选择目标课堂')
    return
  }

  inviteSending.value = true
  try {
    const result = await store.sendInvitation(inviteTarget.value.id, inviteForm.classroomId, inviteForm.message)
    if (result.success) {
      ElMessage.success(result.message)
      inviteDialogVisible.value = false
    } else {
      ElMessage.error(result.message || '发送失败')
    }
  } catch (error) {
    ElMessage.error('发送邀请时发生错误')
    console.error('发送邀请错误:', error)
  } finally {
    inviteSending.value = false
  }
}

// 查看详情
function viewProfile(student) {
  selectedStudent.value = student
  profileDialogVisible.value = true
}

// 获取性格标签
function getPersonalityLabel(value) {
  const p = personalityOptions.find(p => p.value === value)
  return p?.label || value
}

// 获取分数颜色
function getScoreColor(score) {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}
</script>

<style scoped>
.matching-page {
  padding: 20px;
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

.match-card {
  margin-bottom: 15px;
}

.match-card:last-child {
  margin-bottom: 0;
}

.match-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.info-text h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
}

.info-text p {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.match-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.score-label {
  font-size: 12px;
  color: #999;
}

.match-detail {
  margin: 15px 0;
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  width: 70px;
  font-size: 13px;
  color: #666;
}

.match-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.profile-detail {
  padding: 10px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.profile-info h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
}

.profile-info p {
  margin: 0 0 8px 0;
  color: #666;
}

.profile-section {
  margin-bottom: 20px;
}

.profile-section:last-child {
  margin-bottom: 0;
}

.profile-section h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #333;
}

.skill-tag,
.goal-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}
</style>
