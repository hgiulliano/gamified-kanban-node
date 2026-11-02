// ============================================
// KANBAN CONTEXT — Estado global + API + Toast
// ============================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  getTasks,
  createTask,
  updateTaskStatus,
  getUser,
  createUser,
  deleteTask,
  updateTask,
} from '../services/api'

const KanbanContext = createContext(undefined)

export function KanbanProvider({ children }) {
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  // Usuário selecionado na sidebar. Fica no contexto para o board poder filtrar.
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  // `error` guarda APENAS erro de carregamento inicial.
  // Erros de ações (mover/editar/excluir) viram toast, para não sumir com o board.
  const [error, setError] = useState(null)
  const [toasts, setToasts] = useState([])

  // Toast system
  const showToast = useCallback((toast) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, ...toast }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Carrega dados iniciais
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Uma única chamada: /tasks já devolve username/level/current_xp (JOIN)
      const tasksData = await getTasks()
      setTasks(tasksData)

      // Monta a lista de usuários a partir das tasks, sem duplicar
      const userMap = new Map()
      tasksData.forEach((t) => {
        if (t.user_id && !userMap.has(t.user_id)) {
          userMap.set(t.user_id, {
            id: t.user_id,
            username: t.username,
            level: t.level,
            current_xp: t.current_xp,
          })
        }
      })
      setUsers(Array.from(userMap.values()))
      // Mantém a seleção atual se ainda existir; senão seleciona o primeiro
      const list = Array.from(userMap.values())
      setSelectedUserId((prev) =>
        list.some((u) => u.id === prev) ? prev : list[0]?.id ?? null
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Criar task
  const addTask = useCallback(
    async (title, userId) => {
      try {
        const newTask = await createTask(title, userId)
        setTasks((prev) => [newTask, ...prev])

        if (!users.find((u) => u.id === userId)) {
          const user = await getUser(userId)
          setUsers((prev) => [...prev, user])
        }
      } catch (err) {
        showToast({ type: 'error', title: 'Erro ao criar task', message: err.message })
        throw err
      }
    },
    [users, showToast]
  )

  // Mover task (com XP/Level Up)
  const moveTask = useCallback(
    async (taskId, newStatus) => {
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return

      const oldStatus = task.status

      // Atualização otimista (UI responde na hora)
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      )

      try {
        const result = await updateTaskStatus(taskId, newStatus)

        // Se a API respondeu com a task completa, sincroniza
        if (result.task) {
          const wasReady = oldStatus === 'READY'
          const isNowReady = newStatus === 'READY'
          const gainedXP = result.xp_gained || 0
          const leveledUp = result.level_up || false

          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, ...result.task } : t))
          )

          if (result.task.user_id) {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === result.task.user_id
                  ? {
                      ...u,
                      level: result.task.level,
                      current_xp: result.task.current_xp,
                    }
                  : u
              )
            )
          }

          // Toast notifications
          if (isNowReady && !wasReady && gainedXP > 0) {
            if (leveledUp) {
              showToast({
                type: 'level-up',
                title: 'Level Up!',
                message: `${task.username} subiu para nível ${result.new_level}! (+${gainedXP} XP)`,
              })
            } else {
              showToast({
                type: 'xp-gain',
                title: 'Task Concluída',
                message: `${task.username} ganhou ${gainedXP} XP (Total: ${result.new_xp} XP)`,
              })
            }
          }
        }
      } catch (err) {
        // Rollback: volta a task para o status antigo
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: oldStatus } : t))
        )
        showToast({ type: 'error', title: 'Não foi possível mover', message: err.message })
        throw err
      }
    },
    [tasks, showToast]
  )

  // Editar título da task (persiste no back-end)
  const editTask = useCallback(
    async (taskId, updates) => {
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return

      const oldTask = { ...task }

      // Otimista
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
      )

      try {
        // PATCH /tasks/:id — hoje o back-end aceita `title`
        if (updates.title !== undefined) {
          const updated = await updateTask(taskId, { title: updates.title })
          if (updated?.id) {
            setTasks((prev) =>
              prev.map((t) => (t.id === taskId ? { ...t, ...updated } : t))
            )
          }
        }
      } catch (err) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? oldTask : t)))
        showToast({ type: 'error', title: 'Erro ao editar', message: err.message })
        throw err
      }
    },
    [tasks, showToast]
  )

  // Excluir task (persiste no back-end)
  const removeTask = useCallback(
    async (taskId) => {
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return

      // Otimista
      setTasks((prev) => prev.filter((t) => t.id !== taskId))

      try {
        await deleteTask(taskId)
        showToast({ type: 'success', title: 'Task excluída', message: task.title })
      } catch (err) {
        // Rollback: re-insere a task
        setTasks((prev) => [task, ...prev])
        showToast({ type: 'error', title: 'Erro ao excluir', message: err.message })
        throw err
      }
    },
    [tasks, showToast]
  )

  // Usuários
  const addUser = useCallback(
    async (username) => {
      try {
        const newUser = await createUser(username)
        setUsers((prev) => [...prev, newUser])
        setSelectedUserId(newUser.id) // já deixa o novo usuário selecionado
        return newUser
      } catch (err) {
        showToast({ type: 'error', title: 'Erro ao criar usuário', message: err.message })
        throw err
      }
    },
    [showToast]
  )

  const clearError = useCallback(() => setError(null), [])

  // Dados derivados da seleção (o board só mostra as tasks do usuário atual)
  const selectedUser = users.find((u) => u.id === selectedUserId) || null
  const visibleTasks =
    selectedUserId === null ? [] : tasks.filter((t) => t.user_id === selectedUserId)

  const value = {
    tasks,
    // tasks filtradas pelo usuário selecionado — usadas pelo Board
    visibleTasks,
    selectedUserId,
    setSelectedUserId,
    selectedUser,
    users,
    loading,
    error,
    toasts,
    addTask,
    moveTask,
    editTask,
    removeTask,
    addUser,
    clearError,
    removeToast,
    refresh: loadInitialData,
  }

  return (
    <KanbanContext.Provider value={value}>
      {children}
      <div className="toast-container" role="region" aria-label="Notificações" aria-live="polite">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </KanbanContext.Provider>
  )
}

// Toast Component
function Toast({ toast, onClose }) {
  const icons = {
    'xp-gain': (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    'level-up': (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    'success': (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    'error': (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  }

  const colors = {
    'xp-gain': 'var(--color-success)',
    'level-up': 'var(--color-warning)',
    'success': 'var(--color-success)',
    'error': 'var(--color-error)',
  }

  return (
    <div
      className="toast"
      role="alert"
      aria-live="polite"
      style={{ borderLeftColor: colors[toast.type] }}
    >
      <div className="toast-icon" style={{ color: colors[toast.type] }}>
        {icons[toast.type]}
      </div>
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        {toast.message && <div className="toast-message">{toast.message}</div>}
      </div>
      <button onClick={() => onClose(toast.id)} className="toast-close" aria-label="Fechar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export function useKanban() {
  const context = useContext(KanbanContext)
  if (!context) throw new Error('useKanban deve ser usado dentro de KanbanProvider')
  return context
}
