<template>
  <div class="matching-page">
    <!-- 当前用户信息 -->
    <el-card class="user-info-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span><el-icon><User /></el-icon> 我的信息</span>
          <el-tag type="info">{{ store.currentUser?.major }}</el-tag>
        </div>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="姓名">{{ store.currentUser?.name }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ store.currentUser?.studentId }}</el-descriptions-item>
        <el-descriptions-item label="年级">{{ store.currentUser?.grade }}</el-descriptions-item>
        <el-descriptions-item label="技能" :span="2">
          <el-tag v-for="skill in store.currentUser?.skills" :key="skill" size="small" class="tag" type="primary">
            {{ skill }}
          </el-tag>
          <span v-if="!store.currentUser?.skills?.length" class="text-muted">未设置</span>
        </el-descriptions-item>
        <el-descriptions-item label="性格">
          {{ personalityLabel }}
        </el-descriptions-item>
        <el-descriptions-item label="目标" :span="3">
          <el-tag v-for="goal in store.currentUser?.goals" :key="goal" size="small" class="tag" type="success">
            {{ goal }}
          </el-tag>
          <span v-if="!store.currentUser?.goals?.length" class="text-muted">未设置</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 匹配设置 -->
    <el-card class="match-settings" shadow="hover">
      <template #header>
        <div class="card-header">
          <span><el-icon><Setting /></el-icon> 匹配设置</span>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="目标课堂">
            <el-select v-model="selectedClassroom" placeholder="请选择课堂" style="width: 100%">
              <el-option
                v-for="c in store.classrooms"
                :key="c.id"
                :label="c.name"
                :value="c.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="推荐人数">
            <el-input-number v-model="topN" :min="1" :max="10" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label=" ">
            <el-button type="primary" size="large" @click="startMatching" :loading="matching" style="width: 100%">
              <el-icon><Search /></el-icon> 开始匹配
            </el-button>
          </el-form-item>
        </el-col>
      </el-row>
      <el-divider />
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="自动组队人数">
            <el-input-number v-model="teamSize" :min="2" :max="6" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label=" ">
            <el-button type="success" size="large" @click="startAutoTeam" :loading="autoTeaming" style="width: 100%">
              <el-icon><UserFilled /></el-icon> 一键自动组队
            </el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-card>

    <!-- 匹配结果 -->
    <div v-if="matchResults.length > 0" class="match-results">
      <h3 class="section-title">
        <el-icon><Trophy /></el-icon> 最佳队友推荐
      </h3>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :lg="8" v-for="result in matchResults" :key="result.student.id">
          <el-card class="match-card" shadow="hover">
            <div class="match-card-header">
              <el-avatar :size="50" class="match-avatar">
                {{ result.student.name.charAt(0) }}
              </el-avatar>
              <div class="match-info">
                <h4>{{ result.student.name }}</h4>
                <p class="text-muted">{{ result.student.major }} · {{ result.student.grade }}</p>
              </div>
              <div class="match-score">
                <el-progress
                  type="circle"
                  :percentage="result.score.total"
                  :width="60"
                  :stroke-width="6"
                  :color="getScoreColor(result.score.total)"
                />
              </div>
            </div>
            <el-divider />
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
            <el-divider />
            <div class="match-skills">
              <span class="text-muted" style="font-size: 12px">技能：</span>
              <el-tag v-for="skill in result.student.skills" :key="skill" size="small" class="tag" type="primary" effect="plain">
                {{ skill }}
              </el-tag>
            </div>
            <div class="match-actions">
              <el-button type="primary" size="small" @click="sendInvite(result.student)">
                <el-icon><Message /></el-icon> 发送邀请
              </el-button>
              <el-button size="small" @click="viewProfile(result.student)">
                <el-icon><View /></el-icon> 查看详情
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 自动组队结果 -->
    <div v-if="autoTeamResults.length > 0" class="auto-team-results">
      <h3 class="section-title">
        <el-icon><UserFilled /></el-icon> 自动组队结果
      </h3>
      <el-row :gutter="20">
        <el-col :span="12" v-for="(team, index) in autoTeamResults" :key="index">
          <el-card class="team-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>队伍 {{ index + 1 }}</span>
                <el-tag type="warning">平均适配度: {{ team.avgScore }}%</el-tag>
              </div>
            </template>
            <div class="team-members">
              <div v-for="member in team.members" :key="member.id" class="team-member">
                <el-avatar :size="36" class="member-avatar">
                  {{ member.name.charAt(0) }}
                </el-avatar>
                <div class="member-info">
                  <span class="member-name">{{ member.name }}</span>
                  <span class="text-muted">{{ member.major }}</span>
                </div>
                <div class="member-skills">
                  <el-tag v-for="skill in member.skills" :key="skill" size="small" type="primary" effect="plain">
                    {{ skill }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 提示信息 -->
    <el-empty v-if="!matchResults.length && !autoTeamResults.length && !matching" description="请设置匹配条件后点击开始匹配" />

    <!-- 邀请对话框 -->
    <el-dialog v-model="inviteDialogVisible" title="发送组队邀请" width="500px">
      <el-form :model="inviteForm" label-width="80px">
        <el-form-item label="目标同学">
          <el-input :value="inviteTarget?.name" disabled />
        </el-form-item>
        <el-form-item label="目标课堂">
          <el-select v-model="inviteForm.classroomId" placeholder="请选择课堂" style="width: 100%">
            <el-option
              v-for="c in store.classrooms"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="邀请留言">
          <el-input v-model="inviteForm.message" type="textarea" :rows="3" placeholder="写一段邀请留言吧..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inviteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmInvite">发送邀请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../store'
import { findBestMatches, autoTeamFormation } from '../utils/matching'
import { personalityOptions } from '../data/mockData'
import { ElMessage } from 'element-plus'

const store = useAppStore()

const selectedClassroom = ref(null)
const topN = ref(5)
const teamSize = ref(4)
const matching = ref(false)
const autoTeaming = ref(false)
const matchResults = ref([])
const autoTeamResults = ref([])

const inviteDialogVisible = ref(false)
const inviteTarget = ref(null)
const inviteForm = ref({
  classroomId: null,
  message: '',
})

const personalityLabel = computed(() => {
  const opt = personalityOptions.find(p => p.value === store.currentUser?.personality)
  return opt ? opt.label : '未设置'
})

function getScoreColor(score) {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

function startMatching() {
  if (!store.currentUser?.skills?.length) {
    ElMessage.warning('请先在个人信息页面完善技能信息')
    return
  }
  matching.value = true
  setTimeout(() => {
    matchResults.value = findBestMatches(store.currentUser, store.students, topN.value)
    autoTeamResults.value = []
    matching.value = false
    ElMessage.success('匹配完成！')
  }, 1000)
}

function startAutoTeam() {
  autoTeaming.value = true
  setTimeout(() => {
    autoTeamResults.value = autoTeamFormation(store.students, teamSize.value)
    matchResults.value = []
    autoTeaming.value = false
    ElMessage.success('自动组队完成！')
  }, 1500)
}

function sendInvite(student) {
  inviteTarget.value = student
  inviteForm.value = {
    classroomId: selectedClassroom.value,
    message: `你好！我觉得我们的技能很互补，一起组队吧！`,
  }
  inviteDialogVisible.value = true
}

function confirmInvite() {
  if (!inviteForm.value.classroomId) {
    ElMessage.warning('请选择目标课堂')
    return
  }
  const result = store.sendInvitation(inviteTarget.value.id, inviteForm.value.classroomId, inviteForm.value.message)
  if (result.success) {
    ElMessage.success(result.message)
    inviteDialogVisible.value = false
  }
}

function viewProfile(student) {
  ElMessage.info(`查看 ${student.name} 的详细信息`)
}
</script>

<style scoped>
.matching-page {
  max-width: 1200px;
}

.user-info-card,
.match-settings {
  margin-bottom: 20px;
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

.tag {
  margin: 2px 4px;
}

.text-muted {
  color: #999;
  font-size: 13px;
}

.section-title {
  margin: 24px 0 16px;
  font-size: 18px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.match-card {
  margin-bottom: 20px;
}

.match-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.match-avatar {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.match-info {
  flex: 1;
}

.match-info h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.match-score {
  flex-shrink: 0;
}

.match-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-label {
  width: 70px;
  font-size: 13px;
  color: #666;
  text-align: right;
}

.match-skills {
  margin-bottom: 12px;
}

.match-actions {
  display: flex;
  gap: 8px;
}

.team-card {
  margin-bottom: 20px;
}

.team-member {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.team-member:last-child {
  border-bottom: none;
}

.member-avatar {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-weight: 600;
}

.member-info {
  width: 100px;
}

.member-name {
  display: block;
  font-size: 14px;
  color: #333;
}

.member-skills {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.member-skills .el-tag {
  font-size: 11px;
}
</style>
