<template>
  <div class="classroom-page">
    <div class="page-header">
      <h3>课堂管理</h3>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon> 创建课堂
      </el-button>
    </div>

    <!-- 课堂列表 -->
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :lg="8" v-for="classroom in store.classrooms" :key="classroom.id">
        <el-card class="classroom-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="classroom-name">{{ classroom.name }}</span>
              <el-tag :type="classroom.status === 'active' ? 'success' : 'info'" size="small">
                {{ classroom.status === 'active' ? '进行中' : '已结束' }}
              </el-tag>
            </div>
          </template>
          <div class="classroom-info">
            <p><el-icon><User /></el-icon> 教师：{{ classroom.teacher }}</p>
            <p><el-icon><Calendar /></el-icon> 时间：{{ classroom.startDate }} ~ {{ classroom.endDate }}</p>
            <p><el-icon><UserFilled /></el-icon> 队伍上限：{{ classroom.maxTeamSize }}人/队</p>
            <p class="classroom-desc">{{ classroom.description }}</p>
          </div>
          <el-divider />
          <div class="classroom-students">
            <span class="text-muted">已加入学生：</span>
            <div class="student-avatars">
              <el-avatar
                v-for="sid in classroom.students.slice(0, 5)"
                :key="sid"
                :size="32"
                class="student-avatar"
              >
                {{ getStudentName(sid).charAt(0) }}
              </el-avatar>
              <el-avatar v-if="classroom.students.length > 5" :size="32" class="student-avatar more">
                +{{ classroom.students.length - 5 }}
              </el-avatar>
            </div>
          </div>
          <div class="classroom-actions">
            <el-button type="primary" size="small" @click="viewClassroom(classroom)">
              <el-icon><View /></el-icon> 查看详情
            </el-button>
            <el-button
              v-if="!classroom.students.includes(store.currentUser?.id)"
              type="success"
              size="small"
              @click="joinClassroom(classroom)"
            >
              加入课堂
            </el-button>
            <el-button
              v-else
              type="warning"
              size="small"
              @click="leaveClassroom(classroom)"
            >
              退出课堂
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="store.classrooms.length === 0" description="暂无课堂" />

    <!-- 创建课堂对话框 -->
    <el-dialog v-model="createDialogVisible" title="创建新课堂" width="550px">
      <el-form :model="createForm" label-width="100px" :rules="createRules" ref="createFormRef">
        <el-form-item label="课堂名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入课堂名称" />
        </el-form-item>
        <el-form-item label="教师姓名" prop="teacher">
          <el-input v-model="createForm.teacher" placeholder="请输入教师姓名" />
        </el-form-item>
        <el-form-item label="课堂描述" prop="description">
          <el-input v-model="createForm.description" type="textarea" :rows="3" placeholder="请输入课堂描述" />
        </el-form-item>
        <el-form-item label="队伍上限" prop="maxTeamSize">
          <el-input-number v-model="createForm.maxTeamSize" :min="2" :max="10" />
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker v-model="createForm.startDate" type="date" placeholder="选择开始日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker v-model="createForm.endDate" type="date" placeholder="选择结束日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 课堂详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="课堂详情" width="700px">
      <template v-if="currentClassroom">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="课堂名称">{{ currentClassroom.name }}</el-descriptions-item>
          <el-descriptions-item label="教师">{{ currentClassroom.teacher }}</el-descriptions-item>
          <el-descriptions-item label="时间">{{ currentClassroom.startDate }} ~ {{ currentClassroom.endDate }}</el-descriptions-item>
          <el-descriptions-item label="队伍上限">{{ currentClassroom.maxTeamSize }}人/队</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ currentClassroom.description }}</el-descriptions-item>
        </el-descriptions>
        <h4 style="margin: 20px 0 10px">已加入学生 ({{ currentClassroom.students.length }}人)</h4>
        <el-table :data="getClassroomStudents(currentClassroom)" border>
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="studentId" label="学号" width="120" />
          <el-table-column prop="major" label="专业" />
          <el-table-column prop="grade" label="年级" width="80" />
          <el-table-column label="技能" width="200">
            <template #default="{ row }">
              <el-tag v-for="s in row.skills" :key="s" size="small" class="tag" type="primary">{{ s }}</el-tag>
            </template>
          </el-table-column>
        </el-table>

        <h4 style="margin: 20px 0 10px">课堂队伍</h4>
        <div v-if="getClassroomTeams(currentClassroom).length > 0">
          <el-card v-for="team in getClassroomTeams(currentClassroom)" :key="team.id" shadow="never" class="team-card-inline">
            <div class="card-header">
              <span>{{ team.name }}</span>
              <div>
                <el-tag size="small" type="info">队长: {{ getStudentName(team.leader) }}</el-tag>
                <el-tag v-if="team.slogan" size="small" type="success" style="margin-left: 8px">{{ team.slogan }}</el-tag>
              </div>
            </div>
            <div v-if="team.description" class="team-desc">{{ team.description }}</div>
            <div class="team-member-list">
              <el-tag v-for="mid in team.members" :key="mid" size="small" class="tag">{{ getStudentName(mid) }}</el-tag>
            </div>
            <div class="team-actions">
              <el-button 
                v-if="!team.members.includes(store.currentUser?.id) && team.members.length < (team.maxSize || 5)" 
                type="primary" 
                size="small" 
                @click="handleJoinTeam(team)"
              >
                加入队伍
              </el-button>
              <el-button 
                v-if="team.members.includes(store.currentUser?.id) && team.leader !== store.currentUser?.id" 
                type="warning" 
                size="small" 
                @click="handleLeaveTeam(team)"
              >
                退出队伍
              </el-button>
            </div>
          </el-card>
        </div>
        <el-empty v-else description="暂无队伍" :image-size="60" />
        
        <el-button type="primary" style="margin-top: 15px" @click="showCreateTeamDialog">
          <el-icon><Plus /></el-icon> 创建新队伍
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 创建队伍对话框 -->
    <el-dialog v-model="createTeamDialogVisible" title="创建新队伍" width="500px">
      <el-form :model="createTeamForm" label-width="80px" :rules="createTeamRules" ref="createTeamFormRef">
        <el-form-item label="队伍名称" prop="name">
          <el-input v-model="createTeamForm.name" placeholder="请输入队伍名称" />
        </el-form-item>
        <el-form-item label="队伍口号">
          <el-input v-model="createTeamForm.slogan" placeholder="请输入队伍口号（可选）" />
        </el-form-item>
        <el-form-item label="队伍描述">
          <el-input v-model="createTeamForm.description" type="textarea" :rows="3" placeholder="请输入队伍描述（可选）" />
        </el-form-item>
        <el-form-item label="人数上限">
          <el-input-number v-model="createTeamForm.maxSize" :min="2" :max="10" />
        </el-form-item>
        <el-form-item label="初始成员">
          <el-select v-model="createTeamForm.members" multiple placeholder="选择初始成员（可选）" style="width: 100%" filterable>
            <el-option
              v-for="s in availableStudentsForTeam"
              :key="s.id"
              :label="`${s.name} (${s.studentId})`"
              :value="s.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createTeamDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateTeam" :loading="createTeamLoading">创建队伍</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAppStore } from '../store'
import { ElMessage } from 'element-plus'

const store = useAppStore()

const createDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentClassroom = ref(null)
const createFormRef = ref(null)

// 队伍创建相关
const createTeamDialogVisible = ref(false)
const createTeamLoading = ref(false)
const createTeamFormRef = ref(null)

const createForm = reactive({
  name: '',
  teacher: '',
  description: '',
  maxTeamSize: 4,
  startDate: '',
  endDate: '',
})

const createTeamForm = reactive({
  name: '',
  slogan: '',
  description: '',
  maxSize: 5,
  members: [],
})

const createRules = {
  name: [{ required: true, message: '请输入课堂名称', trigger: 'blur' }],
  teacher: [{ required: true, message: '请输入教师姓名', trigger: 'blur' }],
  description: [{ required: true, message: '请输入课堂描述', trigger: 'blur' }],
}

const createTeamRules = {
  name: [{ required: true, message: '请输入队伍名称', trigger: 'blur' }],
}

// 可选学生列表（排除当前用户和已在队伍中的学生）
const availableStudentsForTeam = computed(() => {
  if (!currentClassroom.value) return []
  return store.students.filter(s => 
    s.id !== store.currentUser?.id && 
    currentClassroom.value.students.includes(s.id)
  )
})

function getStudentName(id) {
  const s = store.students.find(s => s.id === id)
  return s ? s.name : '未知'
}

function getClassroomStudents(classroom) {
  return classroom.students.map(id => store.students.find(s => s.id === id)).filter(Boolean)
}

function getClassroomTeams(classroom) {
  return store.teams.filter(t => t.classroomId === classroom.id)
}

function showCreateDialog() {
  createForm.name = ''
  createForm.teacher = ''
  createForm.description = ''
  createForm.maxTeamSize = 4
  createForm.startDate = ''
  createForm.endDate = ''
  createDialogVisible.value = true
}

function handleCreate() {
  createFormRef.value.validate((valid) => {
    if (!valid) return
    const result = store.createClassroom(createForm)
    if (result.success) {
      ElMessage.success(result.message)
      createDialogVisible.value = false
    }
  })
}

function viewClassroom(classroom) {
  currentClassroom.value = classroom
  detailDialogVisible.value = true
}

async function joinClassroom(classroom) {
  const result = await store.joinClassroom(classroom.id)
  if (result.success) {
    ElMessage.success(result.message)
  } else {
    ElMessage.error(result.message)
  }
}

async function leaveClassroom(classroom) {
  const result = await store.leaveClassroom(classroom.id)
  if (result.success) {
    ElMessage.success(result.message)
  } else {
    ElMessage.error(result.message)
  }
}

// 显示创建队伍对话框
function showCreateTeamDialog() {
  if (!currentClassroom.value) {
    ElMessage.warning('请先选择课堂')
    return
  }
  createTeamForm.name = ''
  createTeamForm.slogan = ''
  createTeamForm.description = ''
  createTeamForm.maxSize = 5
  createTeamForm.members = []
  createTeamDialogVisible.value = true
}

// 创建队伍
async function handleCreateTeam() {
  if (!createTeamFormRef.value) return
  
  createTeamFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    createTeamLoading.value = true
    try {
      // 确保当前用户在成员列表中
      const members = [...createTeamForm.members]
      if (!members.includes(store.currentUser?.id)) {
        members.push(store.currentUser?.id)
      }
      
      const result = await store.createTeam({
        name: createTeamForm.name,
        slogan: createTeamForm.slogan,
        description: createTeamForm.description,
        maxSize: createTeamForm.maxSize,
        classroomId: currentClassroom.value.id,
        members: members,
        leader: store.currentUser?.id,
      })
      
      if (result.success) {
        ElMessage.success(result.message)
        createTeamDialogVisible.value = false
      } else {
        ElMessage.error(result.message)
      }
    } catch (error) {
      ElMessage.error('创建队伍失败')
      console.error('创建队伍错误:', error)
    } finally {
      createTeamLoading.value = false
    }
  })
}

// 加入队伍
async function handleJoinTeam(team) {
  const result = await store.joinTeam(team.id)
  if (result.success) {
    ElMessage.success(result.message)
  } else {
    ElMessage.error(result.message)
  }
}

// 退出队伍
async function handleLeaveTeam(team) {
  const result = await store.leaveTeam(team.id)
  if (result.success) {
    ElMessage.success(result.message)
  } else {
    ElMessage.error(result.message)
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

.classroom-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.classroom-name {
  font-weight: 600;
  font-size: 15px;
}

.classroom-info p {
  margin: 8px 0;
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
}

.classroom-desc {
  color: #999 !important;
  margin-top: 10px !important;
  line-height: 1.5;
}

.text-muted {
  color: #999;
  font-size: 13px;
}

.student-avatars {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.student-avatar {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 12px;
}

.student-avatar.more {
  background: #e0e0e0;
  color: #666;
}

.classroom-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.tag {
  margin: 2px 4px;
}

.team-card-inline {
  margin-bottom: 10px;
}

.team-member-list {
  margin-top: 8px;
}

.team-desc {
  margin: 8px 0;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.team-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}
</style>
