// ============================================
// API SERVICE — Camada de comunicação com back-end
// ============================================

// URL da API. Em desenvolvimento, o padrão cobre o backend local.
// Em produção/deploy, defina VITE_API_URL no .env (veja .env.example).
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body)
  }

  const response = await fetch(url, config)

  let data
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const message = data?.error || `Erro ${response.status}: ${response.statusText}`
    throw new Error(message)
  }

  return data
}

// ============================================
// USUÁRIOS
// ============================================

export async function getUsers() {
  return request('/users')
}

export async function getUser(id) {
  return request(`/users/${id}`)
}

export async function createUser(username) {
  return request('/users', { method: 'POST', body: { username } })
}

// ============================================
// TASKS
// ============================================

export async function getTasks() {
  return request('/tasks')
}

export async function createTask(title, userId) {
  return request('/tasks', { method: 'POST', body: { title, user_id: userId } })
}

export async function updateTaskStatus(taskId, status) {
  return request(`/tasks/${taskId}/status`, { method: 'PATCH', body: { status } })
}

// Endpoints que precisam ser implementados no back-end
export async function updateTask(taskId, updates) {
  return request(`/tasks/${taskId}`, { method: 'PATCH', body: updates })
}

export async function deleteTask(taskId) {
  return request(`/tasks/${taskId}`, { method: 'DELETE' })
}