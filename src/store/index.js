import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockStudents, mockClassrooms, mockInvitations, mockEvaluations, mockTeams } from '../data/mockData'
import { 
  syncAllData, 
  createStudent, 
  updateStudent,
  createClassroom,
  createInvitation,
  updateInvitation,
  createEvaluation,
  createTeam,
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
    if (!currentUser.value) return
    const idx = students.value.findIndex(s => s.id === currentUser.value.id)
    if (idx !== -1) {
      students.value[idx] = { ...students.value[idx], ...data }
      currentUser.value = students.value[idx]
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
      saveToLocal()
      
      // 同步到 Supabase
      if (isSupabaseConfigured()) {
        await updateStudent(currentUser.value.studentId, data)
      }
    }
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
    if (idx !== -1) {
      invitations.value[idx].status = accept ? 'accepted' : 'rejected'
      saveToLocal()
      
      if (isSupabaseConfigured()) {
        await updateInvitation(invitationId, invitations.value[idx].status)
      }
    }
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
    myInvitations, myEvaluations, getStudentRating,
    initialize, syncFromCloud, saveToLocal, loadFromLocal,
    startAutoSync, stopAutoSync,
    isSupabaseConfigured,
    verifyAdmin, isAdminVerified, clearAdminSession
  }
})