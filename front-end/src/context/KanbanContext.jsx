// ============================================
// CONTEXTO GLOBAL DO KANBAN
// Estado compartilhado: tasks, users, loading, error
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
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, ...result.task } : t
        ))
        
        // Atualiza user na lista se level/XP mudou
        if (result.task.user_id) {
          setUsers(prev => prev.map(u => 
            u.id === result.task.user_id ? { ...u, level: result.task.level, current_xp: result.task.current_xp } : u
          ))
        }
      }
    } catch (err) {
      // 5. ROLLBACK: Volta status antigo se erro
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: oldStatus } : t
      ))
      setError(err.message)
      throw err
    }
  }, [tasks])

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
    // Ações
    addTask,
    moveTask,
    addUser,
    clearError,
    refresh: loadInitialData,
  }

  return (
    <KanbanContext.Provider value={value}>
      {children}
    </KanbanContext.Provider>
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