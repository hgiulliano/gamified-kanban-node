// ============================================
// TASK CARD — Card arrastável com ações (editar/excluir)
// ============================================

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskMenu from './TaskMenu'

const STATUS_LABELS = {
  TODO: 'A Fazer',
  DOING: 'Fazendo',
  REVIEW: 'Revisão',
  READY: 'Concluída',
}

function TaskCard({ task, allTasks, users }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(task.id) })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  // User da task
  const user = users.find(u => u.id === task.user_id)

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      data-status={task.status}
      role="listitem"
      aria-label={`Task: ${task.title}, Status: ${STATUS_LABELS[task.status]}`}
    >
      {/* Drag Handle */}
      <button
        className="drag-handle"
        {...attributes}
        {...listeners}
        aria-label="Arraste para mover"
        type="button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>

      {/* Menu de ações (editar/excluir) */}
      <TaskMenu task={task} allTasks={allTasks} users={users} />

      {/* Conteúdo */}
      <div className="task-content">
        <h3 className="task-title">{task.title}</h3>

        {/* Badge de status */}
        <span 
          className={`task-badge ${task.status.toLowerCase()}`}
          style={{ backgroundColor: `var(--color-${task.status.toLowerCase()}-bg)`, color: `var(--color-${task.status.toLowerCase()})` }}
        >
          {STATUS_LABELS[task.status]}
        </span>

        {/* Meta: usuário + data */}
        <div className="task-meta">
          {user && (
            <span className="task-user" title={`Nv.${user.level} • ${user.current_xp} XP`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {user.username}
            </span>
          )}
          <time className="task-date" dateTime={task.created_at}>
            {formatRelativeDate(task.created_at)}
          </time>
        </div>

        {/* XP ganho se for READY */}
        {task.status === 'READY' && (
          <div className="task-xp-earned">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span>+50 XP ao concluir</span>
          </div>
        )}
      </div>
    </div>
  )
}

function formatRelativeDate(iso) {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `${diffDays}d atrás`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem atrás`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default TaskCard