/**
 * GitHub Gist 云端存储服务
 * 用于持久化学生数据到 GitHub Gist
 */

const GIST_API_URL = 'https://api.github.com/gists'

// 存储配置的 key
const CONFIG_KEY = 'gist_config'

/**
 * 获取 Gist 配置
 */
export function getGistConfig() {
  const config = localStorage.getItem(CONFIG_KEY)
  return config ? JSON.parse(config) : { token: '', gistId: '' }
}

/**
 * 保存 Gist 配置
 */
export function saveGistConfig(token, gistId) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ token, gistId }))
}

/**
 * 检查是否已配置
 */
export function isGistConfigured() {
  const { token, gistId } = getGistConfig()
  return !!(token && gistId)
}

/**
 * 创建新的 Gist 用于存储数据
 * @param {string} token - GitHub Personal Access Token
 * @param {object} initialData - 初始数据
 * @returns {Promise<{success: boolean, gistId?: string, message: string}>}
 */
export async function createGist(token, initialData = {}) {
  try {
    const response = await fetch(GIST_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
      },
      body: JSON.stringify({
        description: '智能组队系统数据存储 - Smart Team Matching Data',
        public: false,
        files: {
          'team-matching-data.json': {
            content: JSON.stringify(initialData, null, 2)
          }
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, message: error.message || '创建 Gist 失败' }
    }

    const data = await response.json()
    return { success: true, gistId: data.id, message: 'Gist 创建成功' }
  } catch (error) {
    return { success: false, message: `网络错误: ${error.message}` }
  }
}

/**
 * 从 Gist 读取数据
 * @returns {Promise<{success: boolean, data?: object, message: string}>}
 */
export async function readFromGist() {
  const { token, gistId } = getGistConfig()
  
  if (!token || !gistId) {
    return { success: false, message: '未配置 Gist' }
  }

  try {
    const response = await fetch(`${GIST_API_URL}/${gistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
      }
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, message: error.message || '读取 Gist 失败' }
    }

    const data = await response.json()
    const content = data.files?.['team-matching-data.json']?.content
    
    if (!content) {
      return { success: false, message: 'Gist 中没有找到数据文件' }
    }

    return { success: true, data: JSON.parse(content), message: '读取成功' }
  } catch (error) {
    return { success: false, message: `网络错误: ${error.message}` }
  }
}

/**
 * 写入数据到 Gist
 * @param {object} data - 要存储的数据
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function writeToGist(data) {
  const { token, gistId } = getGistConfig()
  
  if (!token || !gistId) {
    return { success: false, message: '未配置 Gist' }
  }

  try {
    const response = await fetch(`${GIST_API_URL}/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
      },
      body: JSON.stringify({
        files: {
          'team-matching-data.json': {
            content: JSON.stringify(data, null, 2)
          }
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, message: error.message || '写入 Gist 失败' }
    }

    return { success: true, message: '数据已同步到云端' }
  } catch (error) {
    return { success: false, message: `网络错误: ${error.message}` }
  }
}

/**
 * 验证 Token 是否有效
 * @param {string} token - GitHub Personal Access Token
 * @returns {Promise<{success: boolean, username?: string, message: string}>}
 */
export async function validateToken(token) {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
      }
    })

    if (!response.ok) {
      return { success: false, message: 'Token 无效或已过期' }
    }

    const data = await response.json()
    return { success: true, username: data.login, message: 'Token 验证成功' }
  } catch (error) {
    return { success: false, message: `网络错误: ${error.message}` }
  }
}
