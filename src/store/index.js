import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockStudents, mockClassrooms, mockInvitations, mockEvaluations, mockTeams } from '../data/mockData'
import { 
  syncAllData, 
  createStudent, 
  updateStudent,
  createClassroom,
  updateClassroom,
  createInvitation,
  updateInvitation,
  createEvaluation,
  createTeam,
  updateTeam,
  isSupabaseConfigured,
  verifyAdmin,
  isAdminVerified,
  clearAdminSession
} from '../utils/supabaseService'

export const useAppStore = defineStore('app', () => {
  // 状态
  const isCloudSyncing = ref(false)
  const isInitialized = ref(false)
  const lastSyncTime = ref(localStorage.getItem('lastSyncTime') || '')
  const currentUser = ref(JSON.parse(localStorage.getItem('currentUser') || 'null'))
  let syncTimer = null

  // 数据
  const students = ref([...mockStudents])
  const classrooms = ref([...mockClassrooms])
  const invitations = ref([...mockInvitations])
  const evaluations = ref([...mockEvaluations])
  const teams = ref([...mockTeams])

  // ========== 工具函数 ==========

  function toJSON() {
    return {
      students: JSON.parse(JSON.stringify(students.value)),
      classrooms: JSON.parse(JSON.stringify(classrooms.value)),
      invitations: JSON.parse(JSON.stringify(invitations.value)),
      evaluations: JSON.parse(JSON.stringify(evaluations.value)),
      teams: JSON.parse(JSON.stringify(teams.value)),
    }
  }

  function loadFromLocal() {
    const saved = localStorage.getItem('appData')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.students) students.value = data.students
        if (data.classrooms) classrooms.value = data.classrooms
        if (data.invitations) invitations.value = data.invitations
        if (data.evaluations) evaluations.value = data.evaluations
        if (data.teams) teams.value = data.teams
      } catch (e) { console.error('加载本地数据失败:', e) }
    }
  }

  function saveToLocal() {
    localStorage.setItem('appData', JSON.stringify(toJSON()))
  }

  function updateSyncTime() {
    const now = new Date().toLocaleString('zh-CN')
    lastSyncTime.value = now
    localStorage.setItem('lastSyncTime', now)
  }

  // ========== 云端同步 ==========

  async function syncFromCloud(silent = false) {
    if (!isSupabaseConfigured()) return { success: false, message: '未配置 Supabase' }
    isCloudSyncing.value = true
    try {
      const result = await syncAllData()
      if (result.success && result.data) {
        students.value = result.data.students || []
        classrooms.value = result.data.classrooms || []
        invitations.value = result.data.invitations || []
        evaluations.value = result.data.evaluations || []
        teams.value = result.data.teams || []
        saveToLocal()
        if (currentUser.value) {
          const updated = students.value.find(s => s.id === currentUser.value.id)
          if (updated) {
            currentUser.value = updated
            localStorage.setItem('currentUser', JSON.stringify(updated))
          }
        }
        updateSyncTime()
        return { success: true, message: '数据已从云端同步' }
      }
      return result
    } finally {
      isCloudSyncing.value = false
    }
  }

  // ========== 定时拉取 ==========

  function startAutoSync(intervalMs = 60000) {
    stopAutoSync()
    syncTimer = setInterval(async () => {
      if (isSupabaseConfigured()) {
        await syncFromCloud(true)
      }
    }, intervalMs)
  }

  function stopAutoSync() {
    if (syncTimer) {
      clearInterval(syncTimer)
      syncTimer = null
    }
  }

  // ========== 初始化 ==========

  async function initialize() {
    if (isInitialized.value) return
    loadFromLocal()
    if (isSupabaseConfigured()) {
      await syncFromCloud(true)
    }
    isInitialized.value = true
  }

  // ========== 用户操作 ==========

  function login(studentId, password) {
    const student = students.value.find(s => s.studentId === studentId)
    if (!student) {
      return { success: false, message: '该学号未注册，请先注册' }
    }
    if (!student.password || student.password !== password) {
      return { success: false, message: '密码错误' }
    }
    currentUser.value = student
    localStorage.setItem('currentUser', JSON.stringify(student))
    return { success: true, message: '登录成功' }
  }

  async function register(userData) {
    const exists = students.value.find(s => s.studentId === userData.studentId)
    if (exists) {
      return { success: false, message: '该学号已注册' }
    }
    
    const newStudent = {
      id: Math.max(0, ...students.value.map(s => s.id)) + 1,
      studentId: userData.studentId,
      name: userData.name,
      password: userData.password,
      major: userData.major || '',
      grade: userData.grade || '',
      skills: [],
      personality: '',
      goals: [],
      avatar: '',
      bio: '',
      availableTime: '',
      score: 80,
    }
    
    // 同步到 Supabase
    if (isSupabaseConfigured()) {
      const result = await createStudent(newStudent)
      if (!result.success) {
        return { success: false, message: `注册失败: ${result.message}` }
      }
      // 使用返回的数据更新 ID
      if (result.data && result.data[0]) {
        newStudent.id = result.data[0].id
      }
    }
    
    students.value.push(newStudent)
    saveToLocal()
    return { success: true, message: '注册成功，请登录' }
  }

  async function updateProfile(data) {
    if (!currentUser.value) return { success: false, message: '未登录' }
    const idx = students.value.findIndex(s => s.id === currentUser.value.id)
    if (idx === -1) return { success: false, message: '用户不存在' }
    
    // 更新本地数据
    students.value[idx] = { ...students.value[idx], ...data }
    currentUser.value = students.value[idx]
    localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
    saveToLocal()
    
    // 同步到 Supabase
    if (isSupabaseConfigured()) {
      const result = await updateStudent(currentUser.value.studentId, data)
      if (!result.success) {
        console.error('同步到云端失败:', result.message)
        return { success: false, message: `本地已更新，但云端同步失败: ${result.message}` }
      }
      return { success: true, message: '个人信息已更新并同步到云端' }
    }
    
    return { success: true, message: '个人信息已更新' }
  }

  function logout() {
    stopAutoSync()
    currentUser.value = null
    localStorage.removeItem('currentUser')
  }

  async function sendInvitation(toId, classroomId, message) {
    const newInvitation = {
      id: Math.max(0, ...invitations.value.map(i => i.id)) + 1,
      from: currentUser.value.id,
      to: toId,
      classroomId,
      message,
      status: 'pending',
      createdAt: new Date().toLocaleString('zh-CN'),
    }
    
    if (isSupabaseConfigured()) {
      const result = await createInvitation(newInvitation)
      if (result.success && result.data && result.data[0]) {
        newInvitation.id = result.data[0].id
      }
    }
    
    invitations.value.push(newInvitation)
    saveToLocal()
    return { success: true, message: '邀请已发送' }
  }

  async function handleInvitation(invitationId, accept) {
    const idx = invitations.value.findIndex(i => i.id === invitationId)
    if (idx === -1) return { success: false, message: '邀请不存在' }
    
    const invitation = invitations.value[idx]
    
    if (accept) {
      // 接受邀请：更新邀请状态并创建/加入队伍
      invitations.value[idx].status = 'accepted'
      
      // 查找是否已有队伍
      const existingTeam = teams.value.find(t => 
        t.classroomId === invitation.classroomId && 
        (t.members.includes(invitation.from) || t.members.includes(invitation.to))
      )
      
      if (existingTeam) {
        // 加入已有队伍
        if (!existingTeam.members.includes(invitation.to)) {
          existingTeam.members.push(invitation.to)
        }
        if (!existingTeam.members.includes(invitation.from)) {
          existingTeam.members.push(invitation.from)
        }
        
        // 同步到云端
        if (isSupabaseConfigured()) {
          await updateTeam(existingTeam.id, { members: existingTeam.members })
        }
      } else {
        // 创建新队伍
        const fromStudent = students.value.find(s => s.id === invitation.from)
        const toStudent = students.value.find(s => s.id === invitation.to)
        const teamName = `${fromStudent?.name || '队员'} & ${toStudent?.name || '队员'}的队伍`
        
        const newTeam = {
          id: Math.max(0, ...teams.value.map(t => t.id)) + 1,
          name: teamName,
          classroomId: invitation.classroomId,
          members: [invitation.from, invitation.to],
          leader: invitation.from, // 邀请发起者为队长
          slogan: '',
          description: '',
          maxSize: 5,
          status: 'active',
          createdAt: new Date().toLocaleString('zh-CN'),
        }
        
        if (isSupabaseConfigured()) {
          const result = await createTeam(newTeam)
          if (result.success && result.data && result.data[0]) {
            newTeam.id = result.data[0].id
          }
        }
        
        teams.value.push(newTeam)
      }
      
      saveToLocal()
      
      if (isSupabaseConfigured()) {
        await updateInvitation(invitationId, 'accepted')
      }
      
      return { success: true, message: '已接受邀请并加入队伍' }
    } else {
      // 拒绝邀请
      invitations.value[idx].status = 'rejected'
      saveToLocal()
      
      if (isSupabaseConfigured()) {
        await updateInvitation(invitationId, 'rejected')
      }
      
      return { success: true, message: '已拒绝邀请' }
    }
  }

  // 创建队伍
  async function createTeamData(teamData) {
    // 检查用户是否已加入该班级
    const classroom = classrooms.value.find(c => c.id === teamData.classroomId)
    if (!classroom) {
      return { success: false, message: '班级不存在' }
    }
    if (!classroom.students.includes(currentUser.value?.id)) {
      return { success: false, message: '请先加入该班级才能创建队伍' }
    }
    
    // 检查用户是否已在该班级有队伍
    const existingTeam = teams.value.find(t => 
      t.classroomId === teamData.classroomId && 
      t.members.includes(currentUser.value?.id) &&
      t.status === 'active'
    )
    if (existingTeam) {
      return { success: false, message: '你已经在该班级有队伍了，请先退出当前队伍' }
    }
    
    const newTeam = {
      id: Math.max(0, ...teams.value.map(t => t.id)) + 1,
      name: teamData.name,
      classroomId: teamData.classroomId,
      members: teamData.members || [currentUser.value?.id],
      leader: teamData.leader || currentUser.value?.id,
      slogan: teamData.slogan || '',
      description: teamData.description || '',
      maxSize: teamData.maxSize || 5,
      status: 'active',
      createdAt: new Date().toLocaleString('zh-CN'),
    }
    
    // 先同步到云端，确保数据不丢失
    if (isSupabaseConfigured()) {
      const result = await createTeam(newTeam)
      if (result.success && result.data && result.data[0]) {
        newTeam.id = result.data[0].id
      } else if (!result.success) {
        return { success: false, message: `创建队伍失败: ${result.message}` }
      }
    }
    
    teams.value.push(newTeam)
    saveToLocal()
    updateSyncTime()
    return { success: true, message: '队伍创建成功', data: newTeam }
  }

  // 更新队伍
  async function updateTeamData(teamId, teamData) {
    const idx = teams.value.findIndex(t => t.id === teamId)
    if (idx === -1) return { success: false, message: '队伍不存在' }
    
    teams.value[idx] = { ...teams.value[idx], ...teamData }
    saveToLocal()
    
    if (isSupabaseConfigured()) {
      const result = await updateTeam(teamId, teamData)
      if (!result.success) {
        return { success: false, message: `本地已更新，但云端同步失败: ${result.message}` }
      }
    }
    
    return { success: true, message: '队伍信息已更新' }
  }

  // 加入队伍
  async function joinTeam(teamId) {
    const idx = teams.value.findIndex(t => t.id === teamId)
    if (idx === -1) return { success: false, message: '队伍不存在' }
    
    const team = teams.value[idx]
    if (team.members.includes(currentUser.value?.id)) {
      return { success: false, message: '你已经在队伍中' }
    }
    if (team.members.length >= team.maxSize) {
      return { success: false, message: '队伍已满' }
    }
    
    team.members.push(currentUser.value.id)
    saveToLocal()
    
    if (isSupabaseConfigured()) {
      await updateTeam(teamId, { members: team.members })
    }
    
    return { success: true, message: '已加入队伍' }
  }

  // 退出队伍
  async function leaveTeam(teamId) {
    const idx = teams.value.findIndex(t => t.id === teamId)
    if (idx === -1) return { success: false, message: '队伍不存在' }
    
    const team = teams.value[idx]
    const memberIdx = team.members.indexOf(currentUser.value?.id)
    if (memberIdx === -1) {
      return { success: false, message: '你不在该队伍中' }
    }
    
    team.members.splice(memberIdx, 1)
    
    // 如果队伍空了，标记为解散
    if (team.members.length === 0) {
      team.status = 'disbanded'
    }
    // 如果队长退出，转让队长
    else if (team.leader === currentUser.value?.id) {
      team.leader = team.members[0]
    }
    
    saveToLocal()
    
    if (isSupabaseConfigured()) {
      // status 仅本地使用，不同步到云端
      await updateTeam(teamId, { members: team.members, leader: team.leader })
    }
    
    return { success: true, message: '已退出队伍' }
  }

  // 加入课堂
  async function joinClassroom(classroomId) {
    const idx = classrooms.value.findIndex(c => c.id === classroomId)
    if (idx === -1) return { success: false, message: '课堂不存在' }

    const classroom = classrooms.value[idx]
    if (classroom.students.includes(currentUser.value?.id)) {
      return { success: false, message: '你已在该课堂中' }
    }

    classroom.students.push(currentUser.value.id)
    saveToLocal()

    if (isSupabaseConfigured()) {
      const result = await updateClassroom(classroomId, { students: classroom.students })
      if (!result.success) {
        return { success: false, message: `本地已加入，但云端同步失败: ${result.message}` }
      }
    }

    updateSyncTime()
    return { success: true, message: '已加入课堂' }
  }

  // 退出课堂
  async function leaveClassroom(classroomId) {
    const idx = classrooms.value.findIndex(c => c.id === classroomId)
    if (idx === -1) return { success: false, message: '课堂不存在' }

    const classroom = classrooms.value[idx]
    const studentIdx = classroom.students.indexOf(currentUser.value?.id)
    if (studentIdx === -1) {
      return { success: false, message: '你不在该课堂中' }
    }

    classroom.students.splice(studentIdx, 1)
    saveToLocal()

    if (isSupabaseConfigured()) {
      const result = await updateClassroom(classroomId, { students: classroom.students })
      if (!result.success) {
        return { success: false, message: `本地已退出，但云端同步失败: ${result.message}` }
      }
    }

    updateSyncTime()
    return { success: true, message: '已退出课堂' }
  }

  async function submitEvaluation(data) {
    const newEval = {
      id: Math.max(0, ...evaluations.value.map(e => e.id)) + 1,
      from: currentUser.value.id,
      ...data,
      createdAt: new Date().toLocaleDateString('zh-CN'),
    }
    
    if (isSupabaseConfigured()) {
      const result = await createEvaluation(newEval)
      if (result.success && result.data && result.data[0]) {
        newEval.id = result.data[0].id
      }
    }
    
    evaluations.value.push(newEval)
    saveToLocal()
    return { success: true, message: '评价已提交' }
  }

  async function createClassroomData(data) {
    const newClassroom = {
      id: Math.max(0, ...classrooms.value.map(c => c.id)) + 1,
      ...data,
      students: [currentUser.value.id],
      status: 'active',
    }
    
    if (isSupabaseConfigured()) {
      const result = await createClassroom(newClassroom)
      if (result.success && result.data && result.data[0]) {
        newClassroom.id = result.data[0].id
      }
    }
    
    classrooms.value.push(newClassroom)
    saveToLocal()
    return { success: true, message: '课堂创建成功' }
  }

  // ========== 计算属性 ==========

  const recentActivities = computed(() => {
    const activities = []
    const userId = currentUser.value?.id
    if (!userId) return activities
    invitations.value.filter(i => i.from === userId || i.to === userId).slice(0, 5).forEach(inv => {
      const fromName = students.value.find(s => s.id === inv.from)?.name || '未知'
      const toName = students.value.find(s => s.id === inv.to)?.name || '未知'
      activities.push({
        time: inv.createdAt,
        content: inv.from === userId ? `你向 ${toName} 发送了组队邀请` : `${fromName} 向你发送了组队邀请`,
        status: inv.status,
      })
    })
    evaluations.value.filter(e => e.from === userId || e.to === userId).slice(0, 5).forEach(evl => {
      const fromName = students.value.find(s => s.id === evl.from)?.name || '未知'
      const toName = students.value.find(s => s.id === evl.to)?.name || '未知'
      activities.push({
        time: evl.createdAt,
        content: evl.from === userId ? `你评价了 ${toName}` : `${fromName} 评价了你`,
      })
    })
    return activities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10)
  })

  const myInvitations = computed(() => {
    if (!currentUser.value) return []
    return invitations.value.filter(i => i.to === currentUser.value.id || i.from === currentUser.value.id)
  })

  const myEvaluations = computed(() => {
    if (!currentUser.value) return []
    return evaluations.value.filter(e => e.to === currentUser.value.id || e.from === currentUser.value.id)
  })

  function getStudentRating(studentId) {
    const evals = evaluations.value.filter(e => e.to === studentId)
    if (evals.length === 0) return 0
    const avg = evals.reduce((sum, e) => sum + ((e.teamwork||0)+(e.communication||0)+(e.technical||0)+(e.responsibility||0)) / 4, 0) / evals.length
    return Math.round(avg * 10) / 10 || 0
  }

  return {
    currentUser, students, classrooms, invitations, evaluations, teams,
    isCloudSyncing, isInitialized, lastSyncTime, recentActivities,
    login, register, updateProfile, logout,
    sendInvitation, handleInvitation, submitEvaluation, createClassroom: createClassroomData,
    createTeam: createTeamData, updateTeam: updateTeamData, joinTeam, leaveTeam,
    joinClassroom, leaveClassroom,
    myInvitations, myEvaluations, getStudentRating,
    initialize, syncFromCloud, saveToLocal, loadFromLocal,
    startAutoSync, stopAutoSync,
    isSupabaseConfigured,
    verifyAdmin, isAdminVerified, clearAdminSession
  }
})