<template>
  <div class="invitation-page">
    <div class="page-header">
      <h3>邀请中心</h3>
      <el-button type="primary" @click="showSendDialog">
        <el-icon><Plus /></el-icon> 发送新邀请
      </el-button>
    </div>

    <el-tabs v-model="activeTab">
      <!-- 收到的邀请 -->
      <el-tab-pane label="收到的邀请" name="received">
        <div v-if="receivedInvitations.length > 0">
          <el-card v-for="inv in receivedInvitations" :key="inv.id" shadow="hover" class="invitation-card">
            <div class="inv-header">
              <div class="inv-from">
                <el-avatar :size="40" class="inv-avatar">
                  {{ getStudentName(inv.from).charAt(0) }}
                </el-avatar>
                <div>
                  <h4>{{ getStudentName(inv.from) }}</h4>
                  <span class="text-muted">{{ inv.createdAt }}</span>
                </div>
              </div>
              <div class="inv-status">
                <el-tag v-if="inv.status === 'pending'" type="warning">待处理</el-tag>
                <el-tag v-else-if="inv.status === 'accepted'" type="success">已接受</el-tag>
                <el-tag v-else type="danger">已拒绝</el-tag>
              </div>
            </div>
            <div class="inv-body">
              <p><strong>目标课堂：</strong>{{ getClassroomName(inv.classroomId) }}</p>
              <p><strong>邀请留言：</strong>{{ inv.message }}</p>
            </div>
            <div v-if="inv.status === 'pending'" class="inv-actions">
              <el-button type="success" @click="handleInvitation(inv.id, true)">
                <el-icon><Check /></el-icon> 接受邀请
              </el-button>
              <el-button type="danger" @click="handleInvitation(inv.id, false)">
                <el-icon><Close /></el-icon> 拒绝邀请
              </el-button>
            </div>
          </el-card>
        </div>
        <el-empty v-else description="暂无收到的邀请" />
      </el-tab-pane>

      <!-- 发出的邀请 -->
      <el-tab-pane label="发出的邀请" name="sent">
        <div v-if="sentInvitations.length > 0">
          <el-card v-for="inv in sentInvitations" :key="inv.id" shadow="hover" class="invitation-card">
            <div class="inv-header">
              <div class="inv-from">
                <el-avatar :size="40" class="inv-avatar">
                  {{ getStudentName(inv.to).charAt(0) }}
                </el-avatar>
                <div>
                  <h4>{{ getStudentName(inv.to) }}</h4>
                  <span class="text-muted">{{ inv.createdAt }}</span>
                </div>
              </div>
              <div class="inv-status">
                <el-tag v-if="inv.status === 'pending'" type="warning">等待回复</el-tag>
                <el-tag v-else-if="inv.status === 'accepted'" type="success">已被接受</el-tag>
                <el-tag v-else type="danger">已被拒绝</el-tag>
              </div>
            </div>
            <div class="inv-body">
              <p><strong>目标课堂：</strong>{{ getClassroomName(inv.classroomId) }}</p>
              <p><strong>邀请留言：</strong>{{ inv.message }}</p>
            </div>
          </el-card>
        </div>
        <el-empty v-else description="暂无发出的邀请" />
      </el-tab-pane>
    </el-tabs>

    <!-- 发送邀请对话框 -->
    <el-dialog v-model="sendDialogVisible" title="发送组队邀请" width="500px">
      <el-form :model="sendForm" label-width="80px">
        <el-form-item label="邀请对象">
          <el-select v-model="sendForm.toId" placeholder="请选择同学" style="width: 100%" filterable>
            <el-option
              v-for="s in availableStudents"
              :key="s.id"
              :label="`${s.name} (${s.studentId})`"
              :value="s.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标课堂">
          <el-select v-model="sendForm.classroomId" placeholder="请选择课堂" style="width: 100%">
            <el-option
              v-for="c in store.classrooms"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="邀请留言">
          <el-input v-model="sendForm.message" type="textarea" :rows="3" placeholder="写一段邀请留言..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sendDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSend">发送邀请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAppStore } from '../store'
import { ElMessage } from 'element-plus'

const store = useAppStore()
const activeTab = ref('received')
const sendDialogVisible = ref(false)

const sendForm = reactive({
  toId: null,
  classroomId: null,
  message: '',
})

const receivedInvitations = computed(() => {
  return store.myInvitations
    .filter(i => i.to === store.currentUser?.id)
    .sort((a, b) => b.id - a.id)
})

const sentInvitations = computed(() => {
  return store.myInvitations
    .filter(i => i.from === store.currentUser?.id)
    .sort((a, b) => b.id - a.id)
})

const availableStudents = computed(() => {
  return store.students.filter(s => s.id !== store.currentUser?.id)
})

function getStudentName(id) {
  const s = store.students.find(s => s.id === id)
  return s ? s.name : '未知'
}

function getClassroomName(id) {
  const c = store.classrooms.find(c => c.id === id)
  return c ? c.name : '未知课堂'
}

function handleInvitation(invitationId, accept) {
  store.handleInvitation(invitationId, accept)
  ElMessage.success(accept ? '已接受邀请' : '已拒绝邀请')
}

function showSendDialog() {
  sendForm.toId = null
  sendForm.classroomId = null
  sendForm.message = ''
  sendDialogVisible.value = true
}

function confirmSend() {
  if (!sendForm.toId) {
    ElMessage.warning('请选择邀请对象')
    return
  }
  if (!sendForm.classroomId) {
    ElMessage.warning('请选择目标课堂')
    return
  }
  const result = store.sendInvitation(sendForm.toId, sendForm.classroomId, sendForm.message)
  if (result.success) {
    ElMessage.success(result.message)
    sendDialogVisible.value = false
  }
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

.invitation-card {
  margin-bottom: 16px;
}

.inv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.inv-from {
  display: flex;
  align-items: center;
  gap: 12px;
}

.inv-avatar {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-weight: 600;
}

.inv-from h4 {
  margin: 0;
  font-size: 15px;
  color: #333;
}

.text-muted {
  color: #999;
  font-size: 12px;
}

.inv-body p {
  margin: 6px 0;
  font-size: 14px;
  color: #555;
}

.inv-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}
</style>
