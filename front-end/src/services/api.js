// ============================================
// SERVIÇO DE API - Camada de comunicação com back-end
// ============================================

const API_BASE = 'http://localhost:3000'

// Helper genérico para fetch com tratamento de erros
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  // Se body é objeto, converte para JSON
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body)
  }

  const response = await fetch(url, config)

  // Tenta parsear JSON (pode falhar se resposta não for JSON)
  let data
  try {
    data = await response.json()
  } catch {
    data = null
  }

  // Se status não é 2xx, lança erro com mensagem da API
  if (!response.ok) {
    const message = data?.error || `Erro ${response.status}: ${response.statusText}`
    throw new Error(message)
  }

  return data
}

// ============================================
// USUÁRIOS
// ============================================

// GET /users/:id
export async function getUser(id) {
  return request(`/users/${id}`)
}

// POST /users
export async function createUser(username) {
  return request('/users', {
    method: 'POST',
    body: { username },
  })
}

// ============================================
// TASKS
// ============================================

// GET /tasks
export async function getTasks() {
  return request('/tasks')
}

// POST /tasks
export async function createTask(title, userId) {
  return request('/tasks', {
    method: 'POST',
    body: { title, user_id: userId },
  })
}

// PATCH /tasks/:id/status
export async function updateTaskStatus(taskId, status) {
  return request(`/tasks/${taskId}/status`, {
    method: 'PATCH',
    body: { status },
  })
}