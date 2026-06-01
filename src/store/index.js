import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockStudents, mockClassrooms, mockInvitations, mockEvaluations, mockTeams } from '../data/mockData'
import { readFromGist, writeToGist, isGistConfigured, getGistConfig, saveGistConfig } from '../utils/gistService'

export const useAppStore = defineStore('app', () => {
  // 云同步状态
  const isCloudSyncing = ref(false)
  const lastSyncTime = ref(localStorage.getItem('lastSyncTime') || '')

  // 当前用户
  const currentUser = ref(JSON.parse(localStorage.getItem('currentUser') || 'null'))

  // 所有学生
  const students = ref([...mockStudents])

  // 课堂列表
  const classrooms = ref([...mockClassrooms])

  // 邀请列表
  const invitations = ref([...mockInvitations])

  // 评价列表
  const evaluations = ref([...mockEvaluations])

  // 队伍列表
  const teams = ref([...mockTeams])

  // 从本地存储加载数据
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
      } catch (e) {
        console.error('加载本地数据失败:', e)
      }
    }
  }

  // 保存到本地存储
  function saveToLocal() {
    const data = {
      students: students.value,
      classrooms: classrooms.value,
      invitations: invitations.value,
      evaluations: evaluations.value,
      teams: teams.value,
    }
    localStorage.setItem('appData', JSON.stringify(data))
  }

  // 从云端同步数据
  async function syncFromCloud() {
    if (!isGistConfigured()) {
      return { success: false, message: '未配置云端存储' }
    }

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
        lastSyncTime.value = new Date().toLocaleString('zh-CN')
        localStorage.setItem('lastSyncTime', lastSyncTime.value)
        return { success: true, message: '数据已从云端同步' }
      }
      return result
    } finally {
      isCloudSyncing.value = false
    }
  }

  // 同步数据到云端
  async function syncToCloud() {
    if (!isGistConfigured()) {
      return { success: false, message: '未配置云端存储' }
    }

    isCloudSyncing.value = true
    try {
      const data = {
        students: students.value,
        classrooms: classrooms.value,
        invitations: invitations.value,
        evaluations: evaluations.value,
        teams: teams.value,
        updatedAt: new Date().toISOString()
      }
      const result = await writeToGist(data)
      if (result.success) {
        lastSyncTime.value = new Date().toLocaleString('zh-CN')
        localStorage.setItem('lastSyncTime', lastSyncTime.value)
        saveToLocal()
      }
      return result
    } finally {
      isCloudSyncing.value = false
    }
  }

  // 初始化：优先从云端加载，失败则从本地加载
  async function initialize() {
    loadFromLocal()
    if (isGistConfigured()) {
      await syncFromCloud()
    }
  }

  // 登录（任意学号都可以登录，不存在的学号自动创建新用户）
  function login(studentId, password) {
    let student = students.value.find(s => s.studentId === studentId)
    if (!student) {
      // 自动创建新用户
      const newStudent = {
        id: students.value.length + 1,
        name: `用户${studentId.slice(-4)}`,
        studentId: studentId,
        major: '计算机科学与技术',
        grade: '大二',
        skills: ['前端开发', '后端开发'],
        personality: 'learner',
        goals: ['完成课程项目', '学习新技术'],
        avatar: '',
        bio: '热爱编程，期待与优秀的队友合作',
        availableTime: '灵活安排',
        score: 80,
      }
      students.value.push(newStudent)
      student = newStudent
      saveToLocal()
    }
    currentUser.value = student
    localStorage.setItem('currentUser', JSON.stringify(student))
    return { success: true, message: '登录成功' }
  }

  // 注册
  function register(userData) {
    const exists = students.value.find(s => s.studentId === userData.studentId)
    if (exists) {
      return { success: false, message: '该学号已注册' }
    }
    const newStudent = {
      id: students.value.length + 1,
      ...userData,
      avatar: '',
      score: 80,
    }
    students.value.push(newStudent)
    currentUser.value = newStudent
    localStorage.setItem('currentUser', JSON.stringify(newStudent))
    saveToLocal()
    return { success: true, message: '注册成功' }
  }

  // 更新个人信息
  function updateProfile(data) {
    if (!currentUser.value) return
    const idx = students.value.findIndex(s => s.id === currentUser.value.id)
    if (idx !== -1) {
      students.value[idx] = { ...students.value[idx], ...data }
      currentUser.value = students.value[idx]
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
      saveToLocal()
    }
  }

  // 登出
  function logout() {
    currentUser.value = null
    localStorage.removeItem('currentUser')
  }

  // 发送邀请
  function sendInvitation(toId, classroomId, message) {
    const newInvitation = {
      id: invitations.value.length + 1,
      from: currentUser.value.id,
      to: toId,
      classroomId,
      message,
      status: 'pending',
      createdAt: new Date().toLocaleString('zh-CN'),
    }
    invitations.value.push(newInvitation)
    saveToLocal()
    return { success: true, message: '邀请已发送' }
  }

  // 处理邀请
  function handleInvitation(invitationId, accept) {
    const idx = invitations.value.findIndex(i => i.id === invitationId)
    if (idx !== -1) {
      invitations.value[idx].status = accept ? 'accepted' : 'rejected'
      saveToLocal()
    }
  }

  // 提交评价
  function submitEvaluation(data) {
    const newEval = {
      id: evaluations.value.length + 1,
      from: currentUser.value.id,
      ...data,
      createdAt: new Date().toLocaleDateString('zh-CN'),
    }
    evaluations.value.push(newEval)
    saveToLocal()
    return { success: true, message: '评价已提交' }
  }

  // 创建课堂
  function createClassroom(data) {
    const newClassroom = {
      id: classrooms.value.length + 1,
      ...data,
      students: [currentUser.value.id],
      status: 'active',
    }
    classrooms.value.push(newClassroom)
    saveToLocal()
    return { success: true, message: '课堂创建成功' }
  }

  // 获取当前用户的邀请
  const myInvitations = computed(() => {
    if (!currentUser.value) return []
    return invitations.value.filter(
      i => i.to === currentUser.value.id || i.from === currentUser.value.id
    )
  })

  // 获取当前用户的评价
  const myEvaluations = computed(() => {
    if (!currentUser.value) return []
    return evaluations.value.filter(
      e => e.to === currentUser.value.id || e.from === currentUser.value.id
    )
  })

  // 获取学生平均评分
  function getStudentRating(studentId) {
    const evals = evaluations.value.filter(e => e.to === studentId)
    if (evals.length === 0) return 0 // 返回0而不是null，避免显示问题
    const avg = evals.reduce((sum, e) => {
      const teamwork = e.teamwork || 0
      const communication = e.communication || 0
      const technical = e.technical || 0
      const responsibility = e.responsibility || 0
      return sum + (teamwork + communication + technical + responsibility) / 4
    }, 0) / evals.length
    return Math.round(avg * 10) / 10 || 0
  }

  return {
    currentUser, students, classrooms, invitations, evaluations, teams,
    isCloudSyncing, lastSyncTime,
    login, register, updateProfile, logout,
    sendInvitation, handleInvitation, submitEvaluation, createClassroom,
    myInvitations, myEvaluations, getStudentRating,
    initialize, syncFromCloud, syncToCloud, saveToLocal, loadFromLocal,
    isGistConfigured, getGistConfig, saveGistConfig,
  }
})
