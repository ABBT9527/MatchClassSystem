import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockStudents, mockClassrooms, mockInvitations, mockEvaluations, mockTeams } from '../data/mockData'
import { readFromGist, writeToGist, isGistConfigured, getGistConfig, saveGistConfig } from '../utils/gistService'

export const useAppStore = defineStore('app', () => {
  const isCloudSyncing = ref(false)
  const lastSyncTime = ref(localStorage.getItem('lastSyncTime') || '')
  const currentUser = ref(JSON.parse(localStorage.getItem('currentUser') || 'null'))
  const students = ref([...mockStudents])
  const classrooms = ref([...mockClassrooms])
  const invitations = ref([...mockInvitations])
  const evaluations = ref([...mockEvaluations])
  const teams = ref([...mockTeams])

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

  function saveToLocal() {
    localStorage.setItem('appData', JSON.stringify(toJSON()))
  }

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

  async function syncToCloud() {
    if (!isGistConfigured()) return { success: false, message: '未配置云端存储' }
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

  async function initialize() {
    loadFromLocal()
    if (isGistConfigured()) await syncFromCloud()
  }

  function login(studentId, password) {
    let student = students.value.find(s => s.studentId === studentId)
    if (!student) {
      const newStudent = {
        id: students.value.length + 1, name: `用户${studentId.slice(-4)}`, studentId,
        major: '计算机科学与技术', grade: '大二', skills: ['前端开发', '后端开发'],
        personality: 'learner', goals: ['完成课程项目', '学习新技术'],
        avatar: '', bio: '热爱编程，期待与优秀的队友合作', availableTime: '灵活安排', score: 80,
      }
      students.value.push(newStudent)
      student = newStudent
      saveToLocal()
    }
    currentUser.value = student
    localStorage.setItem('currentUser', JSON.stringify(student))
    return { success: true, message: '登录成功' }
  }

  function register(userData) {
    const exists = students.value.find(s => s.studentId === userData.studentId)
    if (exists) return { success: false, message: '该学号已注册' }
    const newStudent = { id: students.value.length + 1, ...userData, avatar: '', score: 80 }
    students.value.push(newStudent)
    currentUser.value = newStudent
    localStorage.setItem('currentUser', JSON.stringify(newStudent))
    saveToLocal()
    return { success: true, message: '注册成功' }
  }

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

  function logout() { currentUser.value = null; localStorage.removeItem('currentUser') }

  function sendInvitation(toId, classroomId, message) {
    invitations.value.push({ id: invitations.value.length + 1, from: currentUser.value.id, to: toId, classroomId, message, status: 'pending', createdAt: new Date().toLocaleString('zh-CN') })
    saveToLocal()
    return { success: true, message: '邀请已发送' }
  }

  function handleInvitation(invitationId, accept) {
    const idx = invitations.value.findIndex(i => i.id === invitationId)
    if (idx !== -1) { invitations.value[idx].status = accept ? 'accepted' : 'rejected'; saveToLocal() }
  }

  function submitEvaluation(data) {
    evaluations.value.push({ id: evaluations.value.length + 1, from: currentUser.value.id, ...data, createdAt: new Date().toLocaleDateString('zh-CN') })
    saveToLocal()
    return { success: true, message: '评价已提交' }
  }

  function createClassroom(data) {
    classrooms.value.push({ id: classrooms.value.length + 1, ...data, students: [currentUser.value.id], status: 'active' })
    saveToLocal()
    return { success: true, message: '课堂创建成功' }
  }

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
    currentUser, students, classrooms, invitations, evaluations, teams, isCloudSyncing, lastSyncTime,
    login, register, updateProfile, logout, sendInvitation, handleInvitation, submitEvaluation, createClassroom,
    myInvitations, myEvaluations, getStudentRating,
    initialize, syncFromCloud, syncToCloud, saveToLocal, loadFromLocal, isGistConfigured, getGistConfig, saveGistConfig,
  }
})
