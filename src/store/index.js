import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockStudents, mockClassrooms, mockInvitations, mockEvaluations, mockTeams } from '../data/mockData'
import { readFromGist, writeToGist, isGistConfigured, hasWritePermission, saveAdminToken, getAdminToken } from '../utils/gistService'

export const useAppStore = defineStore('app', () => {
  // 状态
  const isCloudSyncing = ref(false)
  const isInitialized = ref(false)
  const lastSyncTime = ref(localStorage.getItem('lastSyncTime') || '')
  const currentUser = ref(JSON.parse(localStorage.getItem('currentUser') || 'null'))

  // 数据
  const students = ref([...mockStudents])
  const classrooms = ref([...mockClassrooms])
  const invitations = ref([...mockInvitations])
  const evaluations = ref([...mockEvaluations])
  const teams = ref([...mockTeams])

  // 转为纯 JSON
  function toJSON() {
    return {
      students: JSON.parse(JSON.stringify(students.value)),
      classrooms: JSON.parse(JSON.stringify(classrooms.value)),
      invitations: JSON.parse(JSON.stringify(invitations.value)),
      evaluations: JSON.parse(JSON.stringify(evaluations.value)),
      teams: JSON.parse(JSON.stringify(teams.value)),
    }
  }

  // 从本地加载
  function loadFromLocal() {
    const savedData = localStorage.getItem('appData')
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        if (data.students) students.value = data.students
        if (data.classrooms) classrooms.value = data.classrooms
        if (data.invitations) invitations.value = data.invitations
        if (data.evaluations) evaluations.value = data.evaluations
        if (data.teams) teams.value = data.teams
      } catch (e) { console.error('加载本地数据失败:', e) }
    }
  }

  // 保存到本地
  function saveToLocal() {
    localStorage.setItem('appData', JSON.stringify(toJSON()))
  }

  // 从云端拉取
  async function syncFromCloud() {
    if (!isGistConfigured()) return { success: false, message: '未配置云端存储' }
    isCloudSyncing.value = true
    try {
      const result = await readFromGist()
      if (result.success && result.data) {
        if (result.data.students) students.value = result.data.students
        if (result.data.classrooms) classrooms.value = result.data.classrooms
        if (result.data.invitations) invitations.value = result.data.invitations
        if (result.data.evaluations) evaluations.value = result.data.evaluations
        if (result.data.teams) teams.value = result.data.teams
        saveToLocal()
        if (currentUser.value) {
          const updatedUser = students.value.find(s => s.id === currentUser.value.id)
          if (updatedUser) {
            currentUser.value = updatedUser
            localStorage.setItem('currentUser', JSON.stringify(updatedUser))
          }
        }
        lastSyncTime.value = new Date().toLocaleString('zh-CN')
        localStorage.setItem('lastSyncTime', lastSyncTime.value)
        return { success: true, message: '数据已从云端同步' }
      }
      return result
    } finally { isCloudSyncing.value = false }
  }

  // 推送到云端
  async function syncToCloud() {
    if (!isGistConfigured()) return { success: false, message: '未配置云端存储' }
    if (!hasWritePermission()) return { success: false, message: '未配置管理员 Token，无法写入数据' }
    isCloudSyncing.value = true
    try {
      const data = { ...toJSON(), updatedAt: new Date().toISOString() }
      const result = await writeToGist(data)
      if (result.success) {
        lastSyncTime.value = new Date().toLocaleString('zh-CN')
        localStorage.setItem('lastSyncTime', lastSyncTime.value)
      }
      return result
    } finally { isCloudSyncing.value = false }
  }

  // 初始化：从云端加载数据
  async function initialize() {
    if (isInitialized.value) return
    loadFromLocal()
    if (isGistConfigured()) {
      await syncFromCloud()
    }
    isInitialized.value = true
  }

  // 登录验证（需要密码）
  function login(studentId, password) {
    const student = students.value.find(s => s.studentId === studentId)
    if (!student) {
      return { success: false, message: '该学号未注册' }
    }
    if (!student.password || student.password !== password) {
      return { success: false, message: '密码错误' }
    }
    currentUser.value = student
    localStorage.setItem('currentUser', JSON.stringify(student))
    return { success: true, message: '登录成功' }
  }

  // 注册
  async function register(userData) {
    if (!hasWritePermission()) {
      return { success: false, message: '未配置管理员 Token，无法注册新用户' }
    }
    const exists = students.value.find(s => s.studentId === userData.studentId)
    if (exists) {
      return { success: false, message: '该学号已注册' }
    }
    const newStudent = {
      id: Math.max(0, ...students.value.map(s => s.id)) + 1,
      studentId: userData.studentId,
      name: userData.name,
      password: userData.password, // 保存密码
      major: userData.major || '计算机科学与技术',
      grade: userData.grade || '大二',
      skills: [],
      personality: '',
      goals: [],
      avatar: '',
      bio: '',
      availableTime: '',
      score: 80,
    }
    students.value.push(newStudent)
    saveToLocal()
    
    // 同步到云端
    const syncResult = await syncToCloud()
    if (!syncResult.success) {
      return { success: false, message: `注册成功但同步失败: ${syncResult.message}` }
    }
    
    return { success: true, message: '注册成功', student: newStudent }
  }

  // 更新个人信息
  async function updateProfile(data) {
    if (!currentUser.value) return
    const idx = students.value.findIndex(s => s.id === currentUser.value.id)
    if (idx !== -1) {
      students.value[idx] = { ...students.value[idx], ...data }
      currentUser.value = students.value[idx]
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
      saveToLocal()
      
      // 同步到云端
      if (hasWritePermission()) {
        await syncToCloud()
      }
    }
  }

  // 登出
  function logout() {
    currentUser.value = null
    localStorage.removeItem('currentUser')
  }

  // 发送邀请
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
    invitations.value.push(newInvitation)
    saveToLocal()
    if (hasWritePermission()) await syncToCloud()
    return { success: true, message: '邀请已发送' }
  }

  // 处理邀请
  async function handleInvitation(invitationId, accept) {
    const idx = invitations.value.findIndex(i => i.id === invitationId)
    if (idx !== -1) {
      invitations.value[idx].status = accept ? 'accepted' : 'rejected'
      saveToLocal()
      if (hasWritePermission()) await syncToCloud()
    }
  }

  // 提交评价
  async function submitEvaluation(data) {
    const newEval = {
      id: Math.max(0, ...evaluations.value.map(e => e.id)) + 1,
      from: currentUser.value.id,
      ...data,
      createdAt: new Date().toLocaleDateString('zh-CN'),
    }
    evaluations.value.push(newEval)
    saveToLocal()
    if (hasWritePermission()) await syncToCloud()
    return { success: true, message: '评价已提交' }
  }

  // 创建课堂
  async function createClassroom(data) {
    const newClassroom = {
      id: Math.max(0, ...classrooms.value.map(c => c.id)) + 1,
      ...data,
      students: [currentUser.value.id],
      status: 'active',
    }
    classrooms.value.push(newClassroom)
    saveToLocal()
    if (hasWritePermission()) await syncToCloud()
    return { success: true, message: '课堂创建成功' }
  }

  // 获取最近动态
  const recentActivities = computed(() => {
    const activities = []
    const userId = currentUser.value?.id
    if (!userId) return activities
    
    // 邀请相关
    invitations.value.filter(i => i.from === userId || i.to === userId).slice(0, 5).forEach(inv => {
      const fromName = students.value.find(s => s.id === inv.from)?.name || '未知'
      const toName = students.value.find(s => s.id === inv.to)?.name || '未知'
      activities.push({
        type: 'invitation',
        time: inv.createdAt,
        content: inv.from === userId ? `你向 ${toName} 发送了组队邀请` : `${fromName} 向你发送了组队邀请`,
        status: inv.status
      })
    })
    
    // 评价相关
    evaluations.value.filter(e => e.from === userId || e.to === userId).slice(0, 5).forEach(evl => {
      const fromName = students.value.find(s => s.id === evl.from)?.name || '未知'
      const toName = students.value.find(s => s.id === evl.to)?.name || '未知'
      activities.push({
        type: 'evaluation',
        time: evl.createdAt,
        content: evl.from === userId ? `你评价了 ${toName}` : `${fromName} 评价了你`,
      })
    })
    
    return activities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10)
  })

  // 我的邀请
  const myInvitations = computed(() => {
    if (!currentUser.value) return []
    return invitations.value.filter(i => i.to === currentUser.value.id || i.from === currentUser.value.id)
  })

  // 我的评价
  const myEvaluations = computed(() => {
    if (!currentUser.value) return []
    return evaluations.value.filter(e => e.to === currentUser.value.id || e.from === currentUser.value.id)
  })

  // 学生评分
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
    sendInvitation, handleInvitation, submitEvaluation, createClassroom,
    myInvitations, myEvaluations, getStudentRating,
    initialize, syncFromCloud, syncToCloud, saveToLocal, loadFromLocal,
    isGistConfigured, hasWritePermission, saveAdminToken, getAdminToken,
  }
})
