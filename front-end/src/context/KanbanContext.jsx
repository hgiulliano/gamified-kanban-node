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
  updateTask
} from '../services/api'

const KanbanContext = createContext(undefined)

export function KanbanProvider({ children }) {
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toasts, setToasts] = useState([])

  // Toast system
  const showToast = useCallback((toast) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, ...toast }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Carrega dados iniciais
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [tasksData, usersData] = await Promise.all([
        getTasks(),
        getTasks().then(tasks => {
          const userMap = new Map()
          tasks.forEach(t => {
            if (t.user_id && !userMap.has(t.user_id)) {
              userMap.set(t.user_id, {
                id: t.user_id,
                username: t.username,
                level: t.level,
                current_xp: t.current_xp,
              })
            }
          })
          return Array.from(userMap.values())
        })
      ])
      setTasks(tasksData)
      setUsers(usersData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadInitialData() }, [loadInitialData])

  // Criar task
  const addTask = useCallback(async (title, userId) => {
    try {
      setError(null)
      const newTask = await createTask(title, userId)
      setTasks(prev => [newTask, ...prev])
      
      if (!users.find(u => u.id === userId)) {
        const user = await getUser(userId)
        setUsers(prev => [...prev, user])
      }
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [users])

  // Mover task (com XP/Level Up)
  const moveTask = useCallback(async (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const oldStatus = task.status

    // Otimista
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ))

    try {
      setError(null)
      const result = await updateTaskStatus(taskId, newStatus)
      
      if (result.task) {
        const wasReady = oldStatus === 'READY'
        const isNowReady = newStatus === 'READY'
        const gainedXP = result.xp_gained || 0
        const leveledUp = result.level_up || false

        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, ...result.task } : t
        ))

        if (result.task.user_id) {
          setUsers(prev => prev.map(u => 
            u.id === result.task.user_id ? { ...u, level: result.task.level, current_xp: result.task.current_xp } : u
          ))
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
      // Rollback
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: oldStatus } : t
      ))
      setError(err.message)
      throw err
    }
  }, [tasks, showToast])

  // Atualizar task (título/status)
  const editTask = useCallback(async (taskId, updates) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const oldTask = { ...task }

    // Otimista
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    ))

    try {
      setError(null)
      // Nota: precisaria de endpoint PATCH /tasks/:id no back-end
      // Por enquanto só atualiza local
      // await updateTask(taskId, updates)
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === taskId ? oldTask : t))
      setError(err.message)
      throw err
    }
  }, [tasks])

  // Excluir task
  const removeTask = useCallback(async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Otimista
    setTasks(prev => prev.filter(t => t.id !== taskId))

    try {
      setError(null)
      // await deleteTask(taskId)
    } catch (err) {
      setTasks(prev => [...prev, task])
      setError(err.message)
      throw err
    }
  }, [tasks])

  // Usuários
  const addUser = useCallback(async (username) => {
    try {
      setError(null)
      const newUser = await createUser(username)
      setUsers(prev => [...prev, newUser])
      return newUser
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = {
    tasks,
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
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </KanbanContext.Provider>
  )
}

// Toast Component
function Toast({ toast, onClose }) {
  const icons = {
    'xp-gain': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
    'level-up': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    'error': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  }

  const colors = {
    'xp-gain': 'var(--color-success)',
    'level-up': 'var(--color-warning)',
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