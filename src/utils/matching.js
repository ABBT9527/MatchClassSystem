/**
 * 智能组队匹配算法
 * 基于多维度匹配度计算：技能互补度、性格兼容度、目标一致度、评分相似度
 */

// 性格兼容度矩阵 (值 0~1，1为最兼容)
const PERSONALITY_MATRIX = {
  leader:    { leader: 0.4, executor: 0.9, creative: 0.7, communicator: 0.8, analyst: 0.6, learner: 0.5 },
  executor:  { leader: 0.9, executor: 0.6, creative: 0.7, communicator: 0.8, analyst: 0.8, learner: 0.7 },
  creative:  { leader: 0.7, executor: 0.7, creative: 0.5, communicator: 0.8, analyst: 0.6, learner: 0.9 },
  communicator: { leader: 0.8, executor: 0.8, creative: 0.8, communicator: 0.6, analyst: 0.7, learner: 0.8 },
  analyst:   { leader: 0.6, executor: 0.8, creative: 0.6, communicator: 0.7, analyst: 0.8, learner: 0.7 },
  learner:   { leader: 0.5, executor: 0.7, creative: 0.9, communicator: 0.8, analyst: 0.7, learner: 0.8 },
}

/**
 * 计算两个学生之间的综合匹配度
 * @param {Object} studentA - 学生A的信息
 * @param {Object} studentB - 学生B的信息
 * @returns {Object} - 包含总匹配度和各维度分数
 */
export function calculateMatchScore(studentA, studentB) {
  // 1. 技能互补度 (权重 35%)
  const skillScore = calculateSkillComplementarity(
    studentA?.skills || [],
    studentB?.skills || []
  )

  // 2. 性格兼容度 (权重 25%)
  const personalityScore = calculatePersonalityCompatibility(
    studentA?.personality || '',
    studentB?.personality || ''
  )

  // 3. 目标一致度 (权重 20%)
  const goalScore = calculateGoalConsistency(
    studentA?.goals || [],
    studentB?.goals || []
  )

  // 4. 个人评分相似度 (权重 20%)
  const scoreSimilarity = calculateScoreSimilarity(
    studentA?.score || 80,
    studentB?.score || 80
  )

  // 综合匹配度计算
  const totalScore = Math.round(
    skillScore * 0.35 +
    personalityScore * 0.25 +
    goalScore * 0.20 +
    scoreSimilarity * 0.20
  )

  return {
    total: totalScore,
    skill: Math.round(skillScore),
    personality: Math.round(personalityScore),
    goal: Math.round(goalScore),
    scoreSimilarity: Math.round(scoreSimilarity),
  }
}

/**
 * 技能互补度计算
 * 公式: Complement(A,B) = |SA ∪ SB| - |SA ∩ SB| / |SA ∪ SB|
 * 两人技能完全相同 -> 0, 完全不重复 -> 1
 */
function calculateSkillComplementarity(skillsA, skillsB) {
  const setA = new Set(skillsA)
  const setB = new Set(skillsB)
  
  const union = new Set([...setA, ...setB])
  const intersection = new Set([...setA].filter(s => setB.has(s)))
  
  if (union.size === 0) return 50 // 都没有技能时返回中等分数
  
  const complement = (union.size - intersection.size) / union.size
  return complement * 100
}

/**
 * 性格兼容度计算
 * 从性格兼容矩阵中查找
 */
function calculatePersonalityCompatibility(typeA, typeB) {
  if (!typeA || !typeB) return 50
  
  const row = PERSONALITY_MATRIX[typeA]
  if (!row) return 50
  
  const value = row[typeB]
  return (value || 0.5) * 100
}

/**
 * 目标一致度计算
 * 使用 Jaccard 相似系数: |TA ∩ TB| / |TA ∪ TB|
 */
function calculateGoalConsistency(goalsA, goalsB) {
  const setA = new Set(goalsA)
  const setB = new Set(goalsB)
  
  const union = new Set([...setA, ...setB])
  const intersection = new Set([...setA].filter(g => setB.has(g)))
  
  if (union.size === 0) return 50 // 都没有目标时返回中等分数
  
  const consistency = intersection.size / union.size
  return consistency * 100
}

/**
 * 个人评分相似度计算
 * 公式: 100 × (1 - |PA - PB| / 100)
 * 分数相差0分 -> 100, 相差100分 -> 0
 */
function calculateScoreSimilarity(scoreA, scoreB) {
  const diff = Math.abs(scoreA - scoreB)
  return 100 * (1 - diff / 100)
}

/**
 * 为指定学生推荐最佳队友
 * @param {Object} student - 当前学生信息
 * @param {Array} allStudents - 所有学生列表
 * @param {number} topN - 返回前N个匹配结果
 * @returns {Array} - 排序后的匹配结果列表
 */
export function findBestMatches(student, allStudents, topN = 5) {
  const otherStudents = allStudents.filter(s => s.id !== student.id)

  const matches = otherStudents.map(other => ({
    student: other,
    score: calculateMatchScore(student, other),
  }))

  // 按总分降序排序
  matches.sort((a, b) => b.score.total - a.score.total)

  return matches.slice(0, topN)
}

/**
 * 检查学生是否已在某班级的队伍中
 * @param {Object} student - 学生信息
 * @param {number} classroomId - 班级ID
 * @param {Array} teams - 所有队伍列表
 * @returns {boolean} - 是否已在队伍中
 */
function isStudentInTeam(studentId, classroomId, teams) {
  return teams.some(team => 
    team.classroomId === classroomId && 
    team.members.includes(studentId) &&
    team.status === 'active'
  )
}

/**
 * 自动组队 - 将学生分成最优队伍（贪心算法）
 * 改进版：只配对同班且未组队的学生，剩余学生分配到最合适的队伍
 * @param {Array} students - 待分组的学生列表（已筛选为同班学生）
 * @param {number} teamSize - 每队人数
 * @param {number} classroomId - 班级ID
 * @param {Array} existingTeams - 已存在的队伍列表
 * @returns {Array} - 分组结果
 */
export function autoTeamFormation(students, teamSize = 4, classroomId = null, existingTeams = []) {
  if (students.length === 0) return []

  // 筛选出未组队的学生
  const ungroupedStudents = classroomId 
    ? students.filter(s => !isStudentInTeam(s.id, classroomId, existingTeams))
    : [...students]

  if (ungroupedStudents.length === 0) {
    return existingTeams.map(team => ({
      members: team.members.map(memberId => students.find(s => s.id === memberId)).filter(Boolean),
      avgScore: calculateTeamAvgScore(team.members.map(memberId => students.find(s => s.id === memberId)).filter(Boolean)),
      isExisting: true
    }))
  }

  const teams = []
  const remaining = [...ungroupedStudents]

  // 先组成完整的队伍
  while (remaining.length >= teamSize) {
    // 选择第一个未分组的学生作为种子
    const seed = remaining.shift()
    const team = [seed]

    // 为种子学生找最佳队友
    const candidates = remaining.map(s => ({
      student: s,
      score: calculateMatchScore(seed, s),
    }))

    candidates.sort((a, b) => b.score.total - a.score.total)

    // 选择前 (teamSize - 1) 个作为队友
    for (let i = 0; i < teamSize - 1 && i < candidates.length; i++) {
      team.push(candidates[i].student)
      const idx = remaining.findIndex(s => s.id === candidates[i].student.id)
      if (idx !== -1) remaining.splice(idx, 1)
    }

    // 计算队伍平均匹配度
    const avgScore = calculateTeamAvgScore(team)

    teams.push({
      members: team,
      avgScore,
      isNew: true
    })
  }

  // 处理剩余学生（不足一队）- 将他们分配到最合适的已有队伍
  if (remaining.length > 0) {
    // 合并新创建的队伍和已有队伍
    const allTeams = [...teams]
    
    // 将已有队伍也加入考虑
    if (existingTeams && existingTeams.length > 0) {
      existingTeams.forEach(existingTeam => {
        if (existingTeam.classroomId === classroomId && existingTeam.status === 'active') {
          const teamMembers = existingTeam.members
            .map(memberId => students.find(s => s.id === memberId))
            .filter(Boolean)
          
          // 检查队伍是否还有空位
          if (teamMembers.length < (existingTeam.maxSize || 5)) {
            allTeams.push({
              members: teamMembers,
              avgScore: calculateTeamAvgScore(teamMembers),
              isExisting: true,
              teamId: existingTeam.id,
              maxSize: existingTeam.maxSize || 5
            })
          }
        }
      })
    }

    // 为每个剩余学生找到最合适的队伍
    remaining.forEach(student => {
      let bestTeam = null
      let bestScore = -1

      // 遍历所有队伍，找到匹配度最高的
      allTeams.forEach(team => {
        // 检查队伍是否已满
        const currentSize = team.members.length
        const maxSize = team.maxSize || 5
        
        if (currentSize < maxSize) {
          // 计算该学生与队伍中所有成员的匹配度平均值
          let totalMatchScore = 0
          team.members.forEach(member => {
            totalMatchScore += calculateMatchScore(student, member).total
          })
          const avgMatchScore = team.members.length > 0 ? totalMatchScore / team.members.length : 0

          if (avgMatchScore > bestScore) {
            bestScore = avgMatchScore
            bestTeam = team
          }
        }
      })

      // 将学生加入最合适的队伍
      if (bestTeam) {
        bestTeam.members.push(student)
        bestTeam.avgScore = calculateTeamAvgScore(bestTeam.members)
      } else {
        // 如果没有合适的队伍，创建一个新队伍（人数不足）
        teams.push({
          members: [student],
          avgScore: 0,
          isNew: true,
          isIncomplete: true
        })
      }
    })
  }

  return teams
}

/**
 * 计算队伍内平均两两匹配度
 */
function calculateTeamAvgScore(team) {
  if (team.length < 2) return 0
  
  let totalScore = 0
  let pairCount = 0
  
  for (let i = 0; i < team.length; i++) {
    for (let j = i + 1; j < team.length; j++) {
      totalScore += calculateMatchScore(team[i], team[j]).total
      pairCount++
    }
  }
  
  return pairCount > 0 ? Math.round(totalScore / pairCount) : 0
}

/**
 * 计算组内技能覆盖率（额外指标）
 * @param {Array} team - 队伍成员列表
 * @param {Array} requiredSkills - 需要覆盖的技能列表
 * @returns {number} - 覆盖率 (0~100)
 */
export function calculateSkillCoverage(team, requiredSkills = []) {
  if (requiredSkills.length === 0) return 100
  
  const teamSkills = new Set()
  team.forEach(member => {
    (member.skills || []).forEach(skill => teamSkills.add(skill))
  })
  
  const covered = requiredSkills.filter(skill => teamSkills.has(skill))
  return Math.round((covered.length / requiredSkills.length) * 100)
}

/**
 * 计算组内性格多样性（额外指标）
 * @param {Array} team - 队伍成员列表
 * @returns {number} - 多样性分数 (0~100)
 */
export function calculatePersonalityDiversity(team) {
  const personalities = new Set()
  team.forEach(member => {
    if (member.personality) personalities.add(member.personality)
  })
  
  // 性格类型越多，多样性越高
  // 最多6种性格类型
  return Math.round((personalities.size / 6) * 100)
}
