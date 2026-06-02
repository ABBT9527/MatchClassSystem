/**
 * GitHub Gist 云端存储服务
 * 内置 Gist ID，支持只读模式和写入模式
 */

const GIST_API_URL = 'https://api.github.com/gists'

// ========== 内置配置 ==========
// Gist ID（只读，所有用户共享）
// 请将下面的占位符替换为您的实际 Gist ID
const BUILTIN_GIST_ID = 'd25b4d419ec70b22851191971d851728'

// 管理员 Token（仅用于写入数据，可选）
// 如果需要注册/修改数据功能，请在系统设置中配置
const CONFIG_KEY = 'gist_config'

/**
 * 获取内置的 Gist ID
 */
export function getBuiltinGistId() {
  return BUILTIN_GIST_ID
}

/**
 * 检查内置 Gist ID 是否有效
 */
export function hasBuiltinGistId() {
  return BUILTIN_GIST_ID && BUILTIN_GIST_ID !== 'YOUR_GIST_ID_HERE' && /^[a-f0-9]{32}$/i.test(BUILTIN_GIST_ID)
}

/**
 * 获取管理员 Token（用于写入）
 */
export function getAdminToken() {
  const config = localStorage.getItem(CONFIG_KEY)
  return config ? JSON.parse(config).token : ''
}

/**
 * 保存管理员 Token
 */
export function saveAdminToken(token) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ token }))
}

/**
 * 检查是否配置了写入权限
 */
export function hasWritePermission() {
  return !!getAdminToken()
}

/**
 * 验证 Gist ID 格式
 */
export function isValidGistId(gistId) {
  if (!gistId || typeof gistId !== 'string') return false
  return /^[a-f0-9]{32}$/i.test(gistId)
}

/**
 * 从 Gist 读取数据（公开只读）
 * @returns {Promise<{success: boolean, data?: object, message: string}>}
 */
export async function readFromGist() {
  const gistId = BUILTIN_GIST_ID
  
  if (!gistId || !isValidGistId(gistId)) {
    return { success: false, message: '未配置有效的 Gist ID' }
  }

  try {
    const response = await fetch(`${GIST_API_URL}/${gistId}`, {
      headers: {
        'Accept': 'application/vnd.github+json',
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return { success: false, message: error.message || `读取失败 (${response.status})` }
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
 * 写入数据到 Gist（需要管理员 Token）
 * @param {object} data - 要存储的数据
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function writeToGist(data) {
  const gistId = BUILTIN_GIST_ID
  const token = getAdminToken()
  
  if (!gistId || !isValidGistId(gistId)) {
    return { success: false, message: '未配置有效的 Gist ID' }
  }
  
  if (!token) {
    return { success: false, message: '未配置管理员 Token，无法写入数据' }
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
      const error = await response.json().catch(() => ({}))
      return { success: false, message: error.message || `写入失败 (${response.status})` }
    }

    return { success: true, message: '数据已同步到云端' }
  } catch (error) {
    return { success: false, message: `网络错误: ${error.message}` }
  }
}

/**
 * 创建新的 Gist（需要 Token）
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
      const error = await response.json().catch(() => ({}))
      return { success: false, message: error.message || '创建 Gist 失败' }
    }

    const data = await response.json()
    return { success: true, gistId: data.id, message: 'Gist 创建成功' }
  } catch (error) {
    return { success: false, message: `网络错误: ${error.message}` }
  }
}

/**
 * 验证 Token 是否有效
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

// 兼容旧接口
export function getGistConfig() {
  return { token: getAdminToken(), gistId: BUILTIN_GIST_ID }
}

export function saveGistConfig(token, gistId) {
  saveAdminToken(token)
}

export function isGistConfigured() {
  return hasBuiltinGistId()
}
