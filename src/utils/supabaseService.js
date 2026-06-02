/**
 * Supabase 云端存储服务
 * 使用 Supabase 数据库存储学生数据
 */

// Supabase 配置
const SUPABASE_URL = 'https://wfaswgvjzlknhepsptqx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmYXN3Z3ZqemxrbmhlcHNwdHF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNjAxOTIsImV4cCI6MjA5NTkzNjE5Mn0.ka9Eo-FIZAd3XtWQ-FPbiBViQ42y5qfN5CQru_5SRGs'

// 管理员密码
export const ADMIN_PASSWORD = 'MCSAdmin9527'

// 本地存储 key
const ADMIN_KEY = 'mcs_admin_verified'

// ========== 管理员验证 ==========

export function verifyAdmin(password) {
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem(ADMIN_KEY, 'true')
    return true
  }
  return false
}

export function isAdminVerified() {
  return localStorage.getItem(ADMIN_KEY) === 'true'
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_KEY)
}

// ========== Supabase API 封装 ==========

async function supabaseRequest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...options.headers
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return { success: false, message: error.message || `请求失败 (${response.status})` }
    }
    
    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    return { success: false, message: `网络错误: ${error.message}` }
  }
}

// ========== 数据操作 ==========

// 获取所有学生
export async function getStudents() {
  return await supabaseRequest('students?select=*')
}

// 获取单个学生
export async function getStudentById(studentId) {
  return await supabaseRequest(`students?student_id=eq.${studentId}&select=*`)
}

// 创建学生
export async function createStudent(studentData) {
  return await supabaseRequest('students', {
    method: 'POST',
    body: JSON.stringify({
      student_id: studentData.studentId,
      name: studentData.name,
      password: studentData.password,
      major: studentData.major || '',
      grade: studentData.grade || '',
      skills: studentData.skills || [],
      personality: studentData.personality || '',
      goals: studentData.goals || [],
      avatar: studentData.avatar || '',
      bio: studentData.bio || '',
      available_time: studentData.availableTime || '',
      score: studentData.score || 80
    })
  })
}

// 更新学生
export async function updateStudent(studentId, data) {
  return await supabaseRequest(`students?student_id=eq.${studentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

// 获取所有课堂
export async function getClassrooms() {
  return await supabaseRequest('classrooms?select=*')
}

// 创建课堂
export async function createClassroom(classroomData) {
  return await supabaseRequest('classrooms', {
    method: 'POST',
    body: JSON.stringify({
      name: classroomData.name,
      teacher: classroomData.teacher,
      description: classroomData.description,
      max_team_size: classroomData.maxTeamSize,
      students: classroomData.students || [],
      start_date: classroomData.startDate,
      end_date: classroomData.endDate,
      status: classroomData.status || 'active'
    })
  })
}

// 获取所有邀请
export async function getInvitations() {
  return await supabaseRequest('invitations?select=*')
}

// 创建邀请
export async function createInvitation(invitationData) {
  return await supabaseRequest('invitations', {
    method: 'POST',
    body: JSON.stringify({
      from_id: invitationData.from,
      to_id: invitationData.to,
      classroom_id: invitationData.classroomId,
      message: invitationData.message,
      status: invitationData.status || 'pending',
      created_at: invitationData.createdAt || new Date().toISOString()
    })
  })
}

// 更新邀请状态
export async function updateInvitation(invitationId, status) {
  return await supabaseRequest(`invitations?id=eq.${invitationId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  })
}

// 获取所有评价
export async function getEvaluations() {
  return await supabaseRequest('evaluations?select=*')
}

// 创建评价
export async function createEvaluation(evaluationData) {
  return await supabaseRequest('evaluations', {
    method: 'POST',
    body: JSON.stringify({
      from_id: evaluationData.from,
      to_id: evaluationData.to,
      classroom_id: evaluationData.classroomId,
      teamwork: evaluationData.teamwork,
      communication: evaluationData.communication,
      technical: evaluationData.technical,
      responsibility: evaluationData.responsibility,
      comment: evaluationData.comment,
      created_at: evaluationData.createdAt || new Date().toISOString()
    })
  })
}

// 获取所有队伍
export async function getTeams() {
  return await supabaseRequest('teams?select=*')
}

// 创建队伍
export async function createTeam(teamData) {
  return await supabaseRequest('teams', {
    method: 'POST',
    body: JSON.stringify({
      name: teamData.name,
      classroom_id: teamData.classroomId,
      members: teamData.members || [],
      leader_id: teamData.leader,
      created_at: teamData.createdAt || new Date().toISOString()
    })
  })
}

// ========== 批量数据同步 ==========

export async function syncAllData() {
  const results = await Promise.all([
    getStudents(),
    getClassrooms(),
    getInvitations(),
    getEvaluations(),
    getTeams()
  ])
  
  if (results.some(r => !r.success)) {
    return { success: false, message: '部分数据同步失败' }
  }
  
  // 转换数据格式
  const data = {
    students: results[0].data?.map(s => ({
      id: s.id,
      studentId: s.student_id,
      name: s.name,
      password: s.password,
      major: s.major,
      grade: s.grade,
      skills: s.skills || [],
      personality: s.personality || '',
      goals: s.goals || [],
      avatar: s.avatar || '',
      bio: s.bio || '',
      availableTime: s.available_time || '',
      score: s.score || 80
    })) || [],
    classrooms: results[1].data?.map(c => ({
      id: c.id,
      name: c.name,
      teacher: c.teacher,
      description: c.description,
      maxTeamSize: c.max_team_size,
      students: c.students || [],
      startDate: c.start_date,
      endDate: c.end_date,
      status: c.status
    })) || [],
    invitations: results[2].data?.map(i => ({
      id: i.id,
      from: i.from_id,
      to: i.to_id,
      classroomId: i.classroom_id,
      message: i.message,
      status: i.status,
      createdAt: i.created_at
    })) || [],
    evaluations: results[3].data?.map(e => ({
      id: e.id,
      from: e.from_id,
      to: e.to_id,
      classroomId: e.classroom_id,
      teamwork: e.teamwork,
      communication: e.communication,
      technical: e.technical,
      responsibility: e.responsibility,
      comment: e.comment,
      createdAt: e.created_at
    })) || [],
    teams: results[4].data?.map(t => ({
      id: t.id,
      name: t.name,
      classroomId: t.classroom_id,
      members: t.members || [],
      leader: t.leader_id,
      createdAt: t.created_at
    })) || []
  }
  
  return { success: true, data, message: '数据同步成功' }
}

// ========== 配置检查 ==========

export function isSupabaseConfigured() {
  return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && 
         SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY'
}

export function getSupabaseConfig() {
  return { url: SUPABASE_URL, key: SUPABASE_ANON_KEY }
}
