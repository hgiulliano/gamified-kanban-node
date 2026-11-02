// ============================================
// COLUMN — Coluna do Kanban (Drop Zone)
// ============================================

import { useDroppable } from '@dnd-kit/core'
import TaskCard from './TaskCard'

function Column({ status, config, tasks, users }) {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({ id: status })

  // Estilo dinâmico quando arrastando por cima
  const columnStyle = {
    backgroundColor: isOver ? 'var(--col-bg)' : 'transparent',
    borderColor: isOver ? 'var(--col-color)' : 'var(--color-border)',
  }

  return (
    <div
      ref={setNodeRef}
      className="kanban-column"
      style={columnStyle}
      data-status={status}
      data-over={isOver}
    >
      {/* Header da coluna */}
      <div className="column-header">
        <div className="column-title">
          <span className="column-icon" aria-hidden="true" />
          <span>{config.label}</span>
        </div>
        <span className="column-count">{tasks.length}</span>
      </div>

      {/* Drop Zone */}
      <div className="column-dropzone" role="list" aria-label={config.label}>
        {tasks.length === 0 ? (
          <div className="column-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>Nenhuma task</p>
            <span>Arraste uma task para cá</span>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={String(task.id)}
              task={task}
              users={users}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default Column