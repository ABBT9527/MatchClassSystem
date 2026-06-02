<template>
  <div class="team-manage-container">
    <!-- 我的队伍列表 -->
    <div v-if="!currentTeam" class="teams-list">
      <el-empty v-if="myTeams.length === 0" description="您还没有加入任何队伍">
        <el-button type="primary" @click="goToClassroom">去课堂加入队伍</el-button>
      </el-empty>
      
      <div v-else class="teams-grid">
        <el-card
          v-for="team in myTeams"
          :key="team.id"
          class="team-card"
          shadow="hover"
          @click="selectTeam(team)"
        >
          <div class="team-card-header">
            <el-avatar :size="48" :icon="UserFilled" class="team-avatar" />
            <div class="team-info">
              <h3 class="team-name">{{ team.name }}</h3>
              <p class="team-classroom">{{ getClassroomName(team.classroomId) }}</p>
            </div>
            <el-tag v-if="isTeamLeader(team)" type="success" size="small">组长</el-tag>
            <el-tag v-else type="info" size="small">组员</el-tag>
          </div>
          <div class="team-card-body">
            <p class="team-slogan">{{ team.slogan || '暂无口号' }}</p>
            <div class="team-members-count">
              <el-icon><User /></el-icon>
              <span>{{ team.members?.length || 0 }} 人</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 队伍详情页 -->
    <div v-else class="team-detail">
      <!-- 返回按钮 -->
      <div class="detail-header">
        <el-button text @click="backToList">
          <el-icon><ArrowLeft /></el-icon>
          返回列表
        </el-button>
      </div>

      <el-row :gutter="24">
        <!-- 左侧：队伍信息 -->
        <el-col :span="16">
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <span>队伍信息</span>
                <el-button
                  v-if="isLeader"
                  type="primary"
                  size="small"
                  @click="startEdit"
                >
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
              </div>
            </template>

            <!-- 查看模式 -->
            <div v-if="!isEditing" class="info-view">
              <div class="info-item">
                <label>队伍名称：</label>
                <span>{{ currentTeam.name }}</span>
              </div>
              <div class="info-item">
                <label>所属课堂：</label>
                <span>{{ getClassroomName(currentTeam.classroomId) }}</span>
              </div>
              <div class="info-item">
                <label>队伍口号：</label>
                <span>{{ currentTeam.slogan || '暂无口号' }}</span>
              </div>
              <div class="info-item">
                <label>队伍描述：</label>
                <span>{{ currentTeam.description || '暂无描述' }}</span>
              </div>
              <div class="info-item">
                <label>创建时间：</label>
                <span>{{ currentTeam.createdAt }}</span>
              </div>
            </div>

            <!-- 编辑模式 -->
            <el-form v-else :model="editForm" label-width="100px">
              <el-form-item label="队伍名称">
                <el-input v-model="editForm.name" placeholder="请输入队伍名称" />
              </el-form-item>
              <el-form-item label="队伍口号">
                <el-input v-model="editForm.slogan" placeholder="请输入队伍口号" />
              </el-form-item>
              <el-form-item label="队伍描述">
                <el-input
                  v-model="editForm.description"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入队伍描述"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveEdit">保存</el-button>
                <el-button @click="cancelEdit">取消</el-button>
              </el-form-item>
            </el-form>
          </el-card>

          <!-- 成员列表 -->
          <el-card class="members-card">
            <template #header>
              <div class="card-header">
                <span>成员列表 ({{ currentTeam.members?.length || 0 }})</span>
                <el-button
                  v-if="isLeader"
                  type="danger"
                  size="small"
                  @click="showRemoveDialog = true"
                >
                  <el-icon><Delete /></el-icon>
                  移除成员
                </el-button>
              </div>
            </template>

            <div class="members-list">
              <div
                v-for="memberId in currentTeam.members"
                :key="memberId"
                class="member-item"
              >
                <el-avatar :size="40" class="member-avatar">
                  {{ getMemberName(memberId).charAt(0) }}
                </el-avatar>
                <div class="member-info">
                  <span class="member-name">{{ getMemberName(memberId) }}</span>
                  <el-tag v-if="memberId === currentTeam.leader" type="success" size="small">组长</el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：操作区 -->
        <el-col :span="8">
          <el-card class="action-card">
            <template #header>
              <span>队伍操作</span>
            </template>

            <div class="action-buttons">
              <el-button
                v-if="isLeader"
                type="primary"
                class="action-btn"
                @click="showInviteDialog = true"
              >
                <el-icon><Plus /></el-icon>
                邀请新成员
              </el-button>

              <el-button
                v-if="isLeader && currentTeam.members?.length > 1"
                type="warning"
                class="action-btn"
                @click="showTransferDialog = true"
              >
                <el-icon><Switch /></el-icon>
                转让组长
              </el-button>

              <el-button
                type="danger"
                class="action-btn"
                @click="handleLeaveTeam"
              >
                <el-icon><Close /></el-icon>
                {{ isLeader ? '解散队伍' : '退出队伍' }}
              </el-button>
            </div>
          </el-card>

          <!-- 队伍统计 -->
          <el-card class="stats-card">
            <template #header>
              <span>队伍统计</span>
            </template>
            <div class="stats-item">
              <label>成员数量</label>
              <span class="stats-value">{{ currentTeam.members?.length || 0 }}</span>
            </div>
            <div class="stats-item">
              <label>队伍状态</label>
              <el-tag :type="currentTeam.status === 'active' ? 'success' : 'info'">
                {{ currentTeam.status === 'active' ? '活跃' : '已解散' }}
              </el-tag>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 邀请成员对话框 -->
    <el-dialog v-model="showInviteDialog" title="邀请新成员" width="500px">
      <el-form :model="inviteForm" label-width="80px">
        <el-form-item label="选择成员">
          <el-select
            v-model="inviteForm.targetId"
            placeholder="请选择要邀请的成员"
            style="width: 100%"
          >
            <el-option
              v-for="student in availableStudents"
              :key="student.id"
              :label="student.name"
              :value="student.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="邀请消息">
          <el-input
            v-model="inviteForm.message"
            type="textarea"
            :rows="3"
            placeholder="请输入邀请消息（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showInviteDialog = false">取消</el-button>
        <el-button type="primary" @click="sendInvite">发送邀请</el-button>
      </template>
    </el-dialog>

    <!-- 移除成员对话框 -->
    <el-dialog v-model="showRemoveDialog" title="移除成员" width="400px">
      <p style="margin-bottom: 16px;">请选择要移除的成员：</p>
      <el-select v-model="memberToRemove" placeholder="选择成员" style="width: 100%">
        <el-option
          v-for="memberId in removableMembers"
          :key="memberId"
          :label="getMemberName(memberId)"
          :value="memberId"
        />
      </el-select>
      <template #footer>
        <el-button @click="showRemoveDialog = false">取消</el-button>
        <el-button type="danger" @click="removeMember">确认移除</el-button>
      </template>
    </el-dialog>

    <!-- 转让组长对话框 -->
    <el-dialog v-model="showTransferDialog" title="转让组长" width="400px">
      <p style="margin-bottom: 16px;">请选择新的组长：</p>
      <el-select v-model="newLeaderId" placeholder="选择新组长" style="width: 100%">
        <el-option
          v-for="memberId in otherMembers"
          :key="memberId"
          :label="getMemberName(memberId)"
          :value="memberId"
        />
      </el-select>
      <template #footer>
        <el-button @click="showTransferDialog = false">取消</el-button>
        <el-button type="primary" @click="transferLeader">确认转让</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../store'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  UserFilled,
  User,
  ArrowLeft,
  Edit,
  Delete,
  Plus,
  Switch,
  Close,
} from '@element-plus/icons-vue'

const router = useRouter()
const store = useAppStore()

// 当前选中的队伍
const currentTeam = ref(null)
const isEditing = ref(false)

// 编辑表单
const editForm = ref({
  name: '',
  slogan: '',
  description: '',
})

// 对话框显示状态
const showInviteDialog = ref(false)
const showRemoveDialog = ref(false)
const showTransferDialog = ref(false)

// 邀请表单
const inviteForm = ref({
  targetId: '',
  message: '',
})

// 要移除的成员
const memberToRemove = ref('')

// 新组长
const newLeaderId = ref('')

// 获取我加入的队伍
const myTeams = computed(() => {
  if (!store.currentUser) return []
  return store.teams.filter(
    team => team.members?.includes(store.currentUser.id) && team.status === 'active'
  )
})

// 判断是否为组长
const isLeader = computed(() => {
  if (!currentTeam.value || !store.currentUser) return false
  return currentTeam.value.leader === store.currentUser.id
})

// 可邀请的学生（同课堂且未在该队伍的学生）
const availableStudents = computed(() => {
  if (!currentTeam.value) return []
  const classroom = store.classrooms.find(c => c.id === currentTeam.value.classroomId)
  if (!classroom) return []
  
  return store.students.filter(
    s => classroom.students.includes(s.id) && 
         !currentTeam.value.members.includes(s.id)
  )
})

// 可移除的成员（非组长）
const removableMembers = computed(() => {
  if (!currentTeam.value) return []
  return currentTeam.value.members.filter(id => id !== currentTeam.value.leader)
})

// 其他成员（用于转让组长）
const otherMembers = computed(() => {
  if (!currentTeam.value || !store.currentUser) return []
  return currentTeam.value.members.filter(id => id !== store.currentUser.id)
})

// 获取课堂名称
const getClassroomName = (classroomId) => {
  const classroom = store.classrooms.find(c => c.id === classroomId)
  return classroom?.name || '未知课堂'
}

// 获取成员名称
const getMemberName = (memberId) => {
  const student = store.students.find(s => s.id === memberId)
  return student?.name || '未知用户'
}

// 判断是否为组长
const isTeamLeader = (team) => {
  if (!store.currentUser) return false
  return team.leader === store.currentUser.id
}

// 选择队伍
const selectTeam = (team) => {
  currentTeam.value = team
  editForm.value = {
    name: team.name,
    slogan: team.slogan || '',
    description: team.description || '',
  }
}

// 返回列表
const backToList = () => {
  currentTeam.value = null
  isEditing.value = false
}

// 开始编辑
const startEdit = () => {
  isEditing.value = true
}

// 保存编辑
const saveEdit = async () => {
  if (!editForm.value.name.trim()) {
    ElMessage.warning('请输入队伍名称')
    return
  }

  const result = await store.updateTeam(currentTeam.value.id, {
    name: editForm.value.name,
    slogan: editForm.value.slogan,
    description: editForm.value.description,
  })

  if (result.success) {
    ElMessage.success('保存成功')
    isEditing.value = false
    // 更新当前队伍数据
    const updatedTeam = store.teams.find(t => t.id === currentTeam.value.id)
    if (updatedTeam) {
      currentTeam.value = updatedTeam
    }
  } else {
    ElMessage.error(result.message)
  }
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
  editForm.value = {
    name: currentTeam.value.name,
    slogan: currentTeam.value.slogan || '',
    description: currentTeam.value.description || '',
  }
}

// 发送邀请
const sendInvite = async () => {
  if (!inviteForm.value.targetId) {
    ElMessage.warning('请选择要邀请的成员')
    return
  }

  const result = await store.createInvitation({
    teamId: currentTeam.value.id,
    to: inviteForm.value.targetId,
    message: inviteForm.value.message,
  })

  if (result.success) {
    ElMessage.success('邀请已发送')
    showInviteDialog.value = false
    inviteForm.value = { targetId: '', message: '' }
  } else {
    ElMessage.error(result.message)
  }
}

// 移除成员
const removeMember = async () => {
  if (!memberToRemove.value) {
    ElMessage.warning('请选择要移除的成员')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要移除成员 "${getMemberName(memberToRemove.value)}" 吗？`,
      '确认移除',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )

    const result = await store.leaveTeam(currentTeam.value.id, memberToRemove.value)
    if (result.success) {
      ElMessage.success('成员已移除')
      showRemoveDialog.value = false
      memberToRemove.value = ''
      // 刷新队伍数据
      const updatedTeam = store.teams.find(t => t.id === currentTeam.value.id)
      if (updatedTeam) {
        currentTeam.value = updatedTeam
      }
    } else {
      ElMessage.error(result.message)
    }
  } catch {
    // 用户取消
  }
}

// 转让组长
const transferLeader = async () => {
  if (!newLeaderId.value) {
    ElMessage.warning('请选择新的组长')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要将组长转让给 "${getMemberName(newLeaderId.value)}" 吗？`,
      '确认转让',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )

    const result = await store.updateTeam(currentTeam.value.id, {
      leader: newLeaderId.value,
    })

    if (result.success) {
      ElMessage.success('组长转让成功')
      showTransferDialog.value = false
      newLeaderId.value = ''
      // 刷新队伍数据
      const updatedTeam = store.teams.find(t => t.id === currentTeam.value.id)
      if (updatedTeam) {
        currentTeam.value = updatedTeam
      }
    } else {
      ElMessage.error(result.message)
    }
  } catch {
    // 用户取消
  }
}

// 退出/解散队伍
const handleLeaveTeam = async () => {
  if (!currentTeam.value) return

  const isLeader = currentTeam.value.leader === store.currentUser?.id
  const actionText = isLeader ? '解散' : '退出'
  const confirmText = isLeader 
    ? '你是组长，解散队伍后所有成员将被移除，是否继续？'
    : '确定要退出该队伍吗？'

  try {
    await ElMessageBox.confirm(confirmText, `确认${actionText}`, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const result = await store.leaveTeam(currentTeam.value.id)
    if (result.success) {
      ElMessage.success(`${actionText}成功`)
      backToList()
    } else {
      ElMessage.error(result.message)
    }
  } catch {
    // 用户取消
  }
}

// 跳转到课堂页面
const goToClassroom = () => {
  router.push('/dashboard/classroom')
}

onMounted(() => {
  // 如果有队伍，默认选中第一个
  if (myTeams.value.length === 1) {
    selectTeam(myTeams.value[0])
  }
})
</script>

<style scoped>
.team-manage-container {
  padding: 20px;
}

/* 队伍列表 */
.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.team-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.team-card:hover {
  transform: translateY(-4px);
}

.team-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.team-avatar {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.team-info {
  flex: 1;
}

.team-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
}

.team-classroom {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.team-card-body {
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.team-slogan {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px 0;
  font-style: italic;
}

.team-members-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #999;
}

/* 队伍详情 */
.detail-header {
  margin-bottom: 20px;
}

.info-card,
.members-card,
.action-card,
.stats-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.info-view .info-item {
  margin-bottom: 16px;
  display: flex;
}

.info-view .info-item label {
  width: 100px;
  color: #666;
  flex-shrink: 0;
}

.info-view .info-item span {
  flex: 1;
  color: #333;
}

/* 成员列表 */
.members-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.member-avatar {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.member-name {
  font-size: 15px;
  color: #333;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  width: 100%;
  justify-content: center;
}

/* 统计 */
.stats-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stats-item:last-child {
  border-bottom: none;
}

.stats-item label {
  color: #666;
}

.stats-value {
  font-size: 20px;
  font-weight: 600;
  color: #667eea;
}
</style>
