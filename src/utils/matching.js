import { mockStudents } from '../data/mockData'

/**
 * 计算两个学生之间的匹配度
 * 基于技能互补性、性格兼容性、目标一致性三个维度
 * @param {Object} studentA - 学生A的信息
 * @param {Object} studentB - 学生B的信息
 * @returns {Object} - 包含总匹配度和各维度分数
 */
export function calculateMatchScore(studentA, studentB) {
  // 1. 技能互补性 (权重 40%)
  const skillsA = studentA?.skills || []
  const skillsB = studentB?.skills || []
  const skillScore = calculateSkillComplementarity(skillsA, skillsB)

  // 2. 性格兼容性 (权重 30%)
  const personalityA = studentA?.personality || ''
  const personalityB = studentB?.personality || ''
  const personalityScore = calculatePersonalityCompatibility(personalityA, personalityB)

  // 3. 目标一致性 (权重 30%)
  const goalsA = studentA?.goals || []
  const goalsB = studentB?.goals || []
  const goalScore = calculateGoalConsistency(goalsA, goalsB)

  const totalScore = Math.round(skillScore * 0.4 + personalityScore * 0.3 + goalScore * 0.3)

  return {
    total: totalScore || 50, // 确保不为0或NaN
    skill: Math.round(skillScore) || 50,
    personality: Math.round(personalityScore) || 50,
    goal: Math.round(goalScore) || 50,
  }
}

/**
 * 技能互补性计算
 * - 完全相同：50分（有一定基础重叠好沟通）
 * - 完全互补：100分（最佳组合）
 * - 部分互补：根据比例计算
 */
function calculateSkillComplementarity(skillsA, skillsB) {
  if (!skillsA || !skillsB || skillsA.length === 0 || skillsB.length === 0) return 50

  const setA = new Set(skillsA)
  const setB = new Set(skillsB)

  // 交集（共同技能）
  const intersection = [...setA].filter(s => setB.has(s))
  // 并集
  const union = new Set([...setA, ...setB])
  // 互补技能（各自独有的）
  const complementA = [...setA].filter(s => !setB.has(s))
  const complementB = [...setB].filter(s => !setA.has(s))

  // Jaccard相似度（共同技能占比）
  const similarity = intersection.length / union.length

  // 互补度（独有技能占比）
  const complementarity = (complementA.length + complementB.length) / union.length

  // 最佳状态：有一定重叠（便于沟通）+ 大量互补（技能覆盖广）
  // 重叠度在0.2-0.4之间最佳
  let overlapBonus = 0
  if (similarity >= 0.2 && similarity <= 0.4) {
    overlapBonus = 20
  } else if (similarity > 0 && similarity < 0.2) {
    overlapBonus = 10
  } else if (similarity > 0.4 && similarity <= 0.6) {
    overlapBonus = 10
  }

  const score = Math.min(100, Math.round(complementarity * 60 + overlapBonus + similarity * 20))
  return score
}

/**
 * 性格兼容性计算
 * 不同性格类型之间的兼容度
 */
function calculatePersonalityCompatibility(typeA, typeB) {
  if (!typeA || !typeB) return 50

  // 性格兼容度矩阵
  const compatibilityMatrix = {
    'leader-leader': 60, 'leader-executor': 90, 'leader-creative': 85,
    'leader-communicator': 80, 'leader-analyst': 85, 'leader-learner': 75,
    'executor-executor': 80, 'executor-creative': 75, 'executor-communicator': 85,
    'executor-analyst': 80, 'executor-learner': 70,
    'creative-creative': 70, 'creative-communicator': 90, 'creative-analyst': 75,
    'creative-learner': 80,
    'communicator-communicator': 75, 'communicator-analyst': 80, 'communicator-learner': 85,
    'analyst-analyst': 70, 'analyst-learner': 75,
    'learner-learner': 65,
  }

  const key1 = `${typeA}-${typeB}`
  const key2 = `${typeB}-${typeA}`

  return compatibilityMatrix[key1] || compatibilityMatrix[key2] || 70
}

/**
 * 目标一致性计算
 * 共同目标越多，匹配度越高
 */
function calculateGoalConsistency(goalsA, goalsB) {
  if (!goalsA || !goalsB || goalsA.length === 0 || goalsB.length === 0) return 50

  const setA = new Set(goalsA)
  const setB = new Set(goalsB)
  const common = [...setA].filter(g => setB.has(g))
  const total = new Set([...setA, ...setB]).size

  // 基础分：共同目标占比
  const baseScore = (common.length / total) * 100

  // 有共同目标加分
  const bonus = common.length > 0 ? 10 : 0

  return Math.min(100, Math.round(baseScore + bonus))
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

  matches.sort((a, b) => b.score.total - a.score.total)

  return matches.slice(0, topN)
}

/**
 * 自动组队 - 将学生分成最优队伍
 * @param {Array} students - 待分组的学生列表
 * @param {number} teamSize - 每队人数
 * @returns {Array} - 分组结果
 */
export function autoTeamFormation(students, teamSize = 4) {
  if (students.length === 0) return []

  const teams = []
  const remaining = [...students]

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

    teams.push({
      members: team,
      avgScore: Math.round(
        team.reduce((sum, m) => {
          const pairScores = team
            .filter(t => t.id !== m.id)
            .map(t => calculateMatchScore(m, t).total)
          return sum + (pairScores.length > 0 ? pairScores.reduce((a, b) => a + b, 0) / pairScores.length : 0)
        }, 0) / team.length
      ),
    })
  }

  // 处理剩余学生（不足一队）
  if (remaining.length > 0) {
    teams.push({
      members: remaining,
      avgScore: 0,
    })
  }

  return teams
}
