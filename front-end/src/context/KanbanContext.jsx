// ============================================
// CONTEXTO GLOBAL DO KANBAN
// Estado compartilhado: tasks, users, loading, error, toasts
// ============================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getTasks, createTask, updateTaskStatus, getUser, createUser } from '../services/api'

// 1. CRIA CONTEXTO (valor inicial undefined)
const KanbanContext = createContext(undefined)

// 2. PROVIDER COMPONENT
export function KanbanProvider({ children }) {
  // ESTADOS GLOBAIS
  const [tasks, setTasks] = useState([])        // Array de tasks
  const [users, setUsers] = useState([])        // Array de users (para dropdown)
  const [loading, setLoading] = useState(true)  // Loading inicial
  const [error, setError] = useState(null)      // Erros globais
  const [toasts, setToasts] = useState([])      // Notificações toast

  // ============================================
  // TOAST SYSTEM
  // ============================================
  const showToast = useCallback((toast) => {
    const id = Date.now() + Math.random()
    const newToast = { id, ...toast }
    setToasts(prev => [...prev, newToast])
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // ============================================
  // FUNÇÕES DE DADOS (usam useCallback para estabilidade)
  // ============================================

  // Carrega tasks e users iniciais
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [tasksData, usersData] = await Promise.all([
        getTasks(),
        getTasks().then(tasks => {
          // Extrai users únicos das tasks (já vêm com join no user)
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

  // Carrega ao montar
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Adiciona task (otimista: atualiza UI antes da API)
  const addTask = useCallback(async (title, userId) => {
    try {
      setError(null)
      const newTask = await createTask(title, userId)
      setTasks(prev => [newTask, ...prev])  // Adiciona no topo
      
      // Garante que user está na lista
      if (!users.find(u => u.id === userId)) {
        const user = await getUser(userId)
        setUsers(prev => [...prev, user])
      }
    } catch (err) {
      setError(err.message)
      throw err  // Re-lança para form tratar
    }
  }, [users])

  // Atualiza status (otimista + rollback se erro)
  const moveTask = useCallback(async (taskId, newStatus) => {
    // 1. Acha task atual
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const oldStatus = task.status

    // 2. OTIMISTA: Atualiza UI imediatamente
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ))

    try {
      setError(null)
      // 3. Chama API
      const result = await updateTaskStatus(taskId, newStatus)
      
      // 4. Atualiza com dados reais da API (inclui XP/level up)
      if (result.task) {
        const wasReady = oldStatus === 'READY'
        const isNowReady = newStatus === 'READY'
        const gainedXP = result.xp_gained || 0
        const leveledUp = result.level_up || false
        
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, ...result.task } : t
        ))
        
        // Atualiza user na lista se level/XP mudou
        if (result.task.user_id) {
          setUsers(prev => prev.map(u => 
            u.id === result.task.user_id ? { ...u, level: result.task.level, current_xp: result.task.current_xp } : u
          ))
        }

        // 5. TOAST NOTIFICATIONS para feedback visual
        if (isNowReady && !wasReady && gainedXP > 0) {
          if (leveledUp) {
            showToast({
              type: 'level-up',
              title: '🎉 Level Up!',
              message: `${task.username} subiu para o nível ${result.new_level}! (+${gainedXP} XP)`,
            })
          } else {
            showToast({
              type: 'xp-gain',
              title: '✅ Task Concluída!',
              message: `${task.username} ganhou ${gainedXP} XP! (Total: ${result.new_xp} XP)`,
            })
          }
        }
      }
    } catch (err) {
      // 6. ROLLBACK: Volta status antigo se erro
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: oldStatus } : t
      ))
      setError(err.message)
      throw err
    }
  }, [tasks, showToast])

  // Adiciona user
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

  // Limpa erro
  const clearError = useCallback(() => setError(null), [])

  // 3. VALOR DO CONTEXTO (o que fica disponível para filhos)
  const value = {
    // Dados
    tasks,
    users,
    loading,
    error,
    toasts,
    // Ações
    addTask,
    moveTask,
    addUser,
    clearError,
    removeToast,
    refresh: loadInitialData,
  }

  return (
    <KanbanContext.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div className="toast-container" role="region" aria-label="Notificações" aria-live="polite">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </KanbanContext.Provider>
  )
}

// ============================================
// TOAST COMPONENT
// ============================================
function Toast({ toast, onClose }) {
  const icons = {
    'xp-gain': '✨',
    'level-up': '🎉',
    'error': '⚠️',
    'success': '✅',
    'info': 'ℹ️',
  }

  const baseStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 18px',
    background: 'var(--color-bg-elevated)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-lg)',
    minWidth: '280px',
    maxWidth: '400px',
    animation: 'toastEnter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  }

  const typeStyles = {
    'xp-gain': { borderLeft: '4px solid var(--color-success)', background: 'linear-gradient(90deg, #f0fdf4, var(--color-bg-elevated))' },
    'level-up': { borderLeft: '4px solid var(--color-warning)', background: 'linear-gradient(90deg, #fefce8, var(--color-bg-elevated))' },
    'error': { borderLeft: '4px solid var(--color-error)', background: 'linear-gradient(90deg, #fef2f2, var(--color-bg-elevated))' },
    'success': { borderLeft: '4px solid var(--color-success)' },
    'info': { borderLeft: '4px solid var(--color-info)' },
  }

  const style = { ...baseStyles, ...typeStyles[toast.type] }

  return (
    <div style={style} role="alert" aria-live="polite">
      <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{icons[toast.type] || icons.info}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.875rem' }}>
          {toast.title}
        </div>
        {toast.message && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            {toast.message}
          </div>
        )}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '6px',
          transition: 'color 0.1s, background 0.1s',
          fontSize: '1rem',
          lineHeight: 1,
        }}
        onMouseEnter={(e) => e.target.style.color = 'var(--color-text)'}
        onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}
        aria-label="Fechar notificação"
      >
        ×
      </button>
    </div>
  )
}

// 4. HOOK CUSTOMIZADO PARA USAR CONTEXTO FÁCIL
export function useKanban() {
  const context = useContext(KanbanContext)
  if (!context) {
    throw new Error('useKanban deve ser usado dentro de KanbanProvider')
  }
  return context
}