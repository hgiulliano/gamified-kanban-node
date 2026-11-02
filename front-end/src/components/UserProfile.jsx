// ============================================
// USER PROFILE — Perfil do usuário com XP e tasks concluídas
// ============================================

import { useState, useMemo } from 'react'
import { useKanban } from '../context/KanbanContext'

function UserProfile({ users }) {
  const { tasks, selectedUserId, setSelectedUserId } = useKanban()
  const [view, setView] = useState('stats') // 'stats' | 'tasks'

  // Se o usuário selecionado não existe mais, cai para o primeiro da lista
  const user = users.find((u) => u.id === selectedUserId) || users[0]
  const userId = user?.id ?? null

  // REGRA DOS HOOKS: useMemo precisa ser chamado ANTES de qualquer return.
  // Antes ele estava depois de `if (!user) return null`, o que muda a
  // quantidade de hooks entre renders e pode derrubar a tela.
  const userTasks = useMemo(
    () => (userId === null ? [] : tasks.filter((t) => t.user_id === userId)),
    [tasks, userId]
  )

  if (!user) return null

  const completedTasks = userTasks.filter(t => t.status === 'READY')
  const inProgressTasks = userTasks.filter(t => t.status !== 'READY' && t.status !== 'TODO')
  const todoTasks = userTasks.filter(t => t.status === 'TODO')

  const totalXp = user.current_xp + (user.level - 1) * 100
  const xpToNextLevel = 100 - user.current_xp
  const progressPercent = (user.current_xp / 100) * 100

  return (
    <div className="user-profile">
      {/* Header do usuário */}
      <div className="user-header">
        <div className="user-avatar" aria-hidden="true">
          <span className="avatar-initial">{user.username[0].toUpperCase()}</span>
        </div>
        <div className="user-info">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(Number(e.target.value))}
            className="user-select"
            aria-label="Selecionar usuário"
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.username} (Nv.{u.level})
              </option>
            ))}
          </select>
          <p className="username">@{user.username}</p>
        </div>
      </div>

      {/* Stats principais — compactos para caber sem rolagem */}
      <div className="user-stats">
        <div className="stat-card primary">
          <p className="stat-value">{user.level}</p>
          <p className="stat-label">Nível</p>
        </div>

        <div className="stat-card xp">
          <p className="stat-value">{user.current_xp}/100</p>
          <p className="stat-label">XP</p>
        </div>

        <div className="stat-card completed">
          <p className="stat-value">{completedTasks.length}</p>
          <p className="stat-label">Concluídas</p>
        </div>
      </div>

      {/* Barra de progresso do nível */}
      <div className="level-progress">
        <div className="progress-header">
          <span>Progresso para Nv. {user.level + 1}</span>
          <span>{user.current_xp} / 100 XP</span>
        </div>
        <div className="progress-bar" role="progressbar" aria-valuenow={user.current_xp} aria-valuemin={0} aria-valuemax={100}>
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="progress-hint">{xpToNextLevel} XP para próximo nível</p>
      </div>

      {/* Abas de tasks */}
      <div className="user-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={view === 'stats'}
          onClick={() => setView('stats')}
          className={`tab-btn ${view === 'stats' ? 'active' : ''}`}
        >
          Resumo
          <span className="tab-count">{userTasks.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={view === 'tasks'}
          onClick={() => setView('tasks')}
          className={`tab-btn ${view === 'tasks' ? 'active' : ''}`}
        >
          Tasks
          <span className="tab-count">{inProgressTasks.length + completedTasks.length}</span>
        </button>
      </div>

      {/* Conteúdo das abas */}
      <div className="tab-content">
        {view === 'stats' ? (
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{todoTasks.length}</span>
              <span className="stat-name">A Fazer</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{inProgressTasks.length}</span>
              <span className="stat-name">Em Andamento</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{completedTasks.length}</span>
              <span className="stat-name">Concluídas</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{totalXp}</span>
              <span className="stat-name">XP Total</span>
            </div>
          </div>
        ) : (
          <div className="user-tasks-list">
            {userTasks.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p>Nenhuma task criada</p>
                <span>Use o formulário no topo para criar a primeira task</span>
              </div>
            ) : (
              <ul className="tasks-list" role="list">
                {userTasks
                  .sort((a, b) => {
                    // READY por último, depois por data
                    if (a.status === 'READY' && b.status !== 'READY') return 1
                    if (a.status !== 'READY' && b.status === 'READY') return -1
                    return new Date(b.created_at) - new Date(a.created_at)
                  })
                  .map(task => (
                    <li key={task.id} className={`task-row ${task.status.toLowerCase()}`}>
                      <div className="task-status-indicator" style={{ backgroundColor: getStatusColor(task.status) }} />
                      <div className="task-main">
                        <span className="task-title-text">{task.title}</span>
                        <span className={`task-badge ${task.status.toLowerCase()}`}>{getStatusLabel(task.status)}</span>
                      </div>
                      <time className="task-date" dateTime={task.created_at}>
                        {formatDate(task.created_at)}
                      </time>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Helpers
function getStatusColor(status) {
  const colors = {
    TODO: '#64748b',
    DOING: '#2563eb',
    REVIEW: '#d97706',
    READY: '#059669'
  }
  return colors[status] || colors.TODO
}

function getStatusLabel(status) {
  const labels = {
    TODO: 'A Fazer',
    DOING: 'Fazendo',
    REVIEW: 'Revisão',
    READY: 'Concluída'
  }
  return labels[status] || status
}

function formatDate(iso) {
  const date = new Date(iso)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export default UserProfile