<template>
  <div class="evaluation-page">
    <div class="page-header">
      <h3>评价系统</h3>
    </div>

    <el-tabs v-model="activeTab">
      <!-- 提交评价 -->
      <el-tab-pane label="提交评价" name="submit">
        <el-card shadow="hover">
          <el-form :model="evalForm" label-width="100px" style="max-width: 600px">
            <el-form-item label="评价同学">
              <el-select v-model="evalForm.to" placeholder="请选择同学" style="width: 100%" filterable>
                <el-option
                  v-for="s in availableStudents"
                  :key="s.id"
                  :label="`${s.name} (${s.studentId})`"
                  :value="s.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="所属课堂">
              <el-select v-model="evalForm.classroomId" placeholder="请选择课堂" style="width: 100%">
                <el-option
                  v-for="c in store.classrooms"
                  :key="c.id"
                  :label="c.name"
                  :value="c.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="团队协作">
              <el-rate v-model="evalForm.teamwork" show-text :texts="rateTexts" />
            </el-form-item>
            <el-form-item label="沟通能力">
              <el-rate v-model="evalForm.communication" show-text :texts="rateTexts" />
            </el-form-item>
            <el-form-item label="技术水平">
              <el-rate v-model="evalForm.technical" show-text :texts="rateTexts" />
            </el-form-item>
            <el-form-item label="责任心">
              <el-rate v-model="evalForm.responsibility" show-text :texts="rateTexts" />
            </el-form-item>
            <el-form-item label="文字评价">
              <el-input v-model="evalForm.comment" type="textarea" :rows="3" placeholder="请输入评价内容..." />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitEval" :loading="submitting">
                <el-icon><Check /></el-icon> 提交评价
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 我的评价 -->
      <el-tab-pane label="我的评价" name="list">
        <div v-if="myEvalsList.length > 0">
          <el-card v-for="item in myEvalsList" :key="item.id" shadow="hover" class="eval-card">
            <div class="eval-header">
              <div>
                <span v-if="item.from === store.currentUser?.id" class="eval-direction">
                  我 → {{ getStudentName(item.to) }}
                </span>
                <span v-else class="eval-direction">
                  {{ getStudentName(item.from) }} → 我
                </span>
                <span class="text-muted" style="margin-left: 12px">{{ item.createdAt }}</span>
              </div>
              <el-tag size="small">{{ getClassroomName(item.classroomId) }}</el-tag>
            </div>
            <div class="eval-scores">
              <div class="score-item">
                <span>团队协作</span>
                <el-rate :model-value="item.teamwork" disabled />
              </div>
              <div class="score-item">
                <span>沟通能力</span>
                <el-rate :model-value="item.communication" disabled />
              </div>
              <div class="score-item">
                <span>技术水平</span>
                <el-rate :model-value="item.technical" disabled />
              </div>
              <div class="score-item">
                <span>责任心</span>
                <el-rate :model-value="item.responsibility" disabled />
              </div>
            </div>
            <p class="eval-comment" v-if="item.comment">{{ item.comment }}</p>
          </el-card>
        </div>
        <el-empty v-else description="暂无评价记录" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAppStore } from '../store'
import { ElMessage } from 'element-plus'

const store = useAppStore()
const activeTab = ref('submit')
const submitting = ref(false)

const rateTexts = ['很差', '较差', '一般', '较好', '很好']

const evalForm = reactive({
  to: null,
  classroomId: null,
  teamwork: 5,
  communication: 5,
  technical: 5,
  responsibility: 5,
  comment: '',
})

const availableStudents = computed(() => {
  return store.students.filter(s => s.id !== store.currentUser?.id)
})

const myEvalsList = computed(() => {
  return [...store.myEvaluations].sort((a, b) => b.id - a.id)
})

function getStudentName(id) {
  const s = store.students.find(s => s.id === id)
  return s ? s.name : '未知'
}

function getClassroomName(id) {
  const c = store.classrooms.find(c => c.id === id)
  return c ? c.name : '未知课堂'
}

function submitEval() {
  if (!evalForm.to) {
    ElMessage.warning('请选择评价同学')
    return
  }
  if (!evalForm.classroomId) {
    ElMessage.warning('请选择所属课堂')
    return
  }
  submitting.value = true
  setTimeout(() => {
    const result = store.submitEvaluation({
      to: evalForm.to,
      classroomId: evalForm.classroomId,
      teamwork: evalForm.teamwork,
      communication: evalForm.communication,
      technical: evalForm.technical,
      responsibility: evalForm.responsibility,
      comment: evalForm.comment,
    })
    submitting.value = false
    if (result.success) {
      ElMessage.success(result.message)
      evalForm.to = null
      evalForm.classroomId = null
      evalForm.comment = ''
      evalForm.teamwork = 5
      evalForm.communication = 5
      evalForm.technical = 5
      evalForm.responsibility = 5
    }
  }, 500)
}
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-header h3 {
  font-size: 20px;
  color: #333;
}

.eval-card {
  margin-bottom: 16px;
}

.eval-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.eval-direction {
  font-weight: 600;
  color: #333;
  font-size: 15px;
}

.text-muted {
  color: #999;
  font-size: 12px;
}

.eval-scores {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.score-item span {
  width: 70px;
  font-size: 13px;
  color: #666;
}

.eval-comment {
  color: #555;
  font-size: 14px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
  margin: 0;
}
</style>
