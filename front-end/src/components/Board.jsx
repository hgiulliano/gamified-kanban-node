// ============================================
// BOARD — Quadro Kanban com drag-and-drop corrigido
// ============================================

import { useMemo } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import Column from './Column'
import { useKanban } from '../context/KanbanContext'

const COLUMN_ORDER = ['TODO', 'DOING', 'REVIEW', 'READY']

const COLUMN_CONFIG = {
  TODO: { label: 'A Fazer', icon: '📋' },
  DOING: { label: 'Fazendo', icon: '⚡' },
  REVIEW: { label: 'Revisão', icon: '👁' },
  READY: { label: 'Concluída', icon: '✓' },
}

function Board() {
  const { tasks, loading, error, moveTask, users } = useKanban()

  // Sensores para drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Handler do drag end - CORRIGIDO: IDs como string
  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over) return

    // active.id vem como string do useSortable
    const taskId = Number(active.id)
    const newStatus = over.id // status string: 'TODO', 'DOING', etc.

    // Evita mover para mesmo status
    const task = tasks.find(t => t.id === taskId)
    if (task && task.status === newStatus) return

    try {
      await moveTask(taskId, newStatus)
    } catch (err) {
      console.error('Erro ao mover task:', err)
    }
  }

  // IDs como STRING para @dnd-kit
  const sortableIds = useMemo(() => tasks.map(t => String(t.id)), [tasks])

  if (loading) {
    return (
      <div className="board-loading" role="status" aria-label="Carregando quadro">
        <div className="spinner" aria-hidden="true" />
        <p>Carregando quadro...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="board-error" role="alert">
        <div className="error-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2>Erro ao carregar</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Tentar Novamente
        </button>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortableIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="kanban-board" role="region" aria-label="Quadro Kanban">
          <div className="board-grid" role="list">
            {COLUMN_ORDER.map(status => {
              const config = COLUMN_CONFIG[status]
              const columnTasks = tasks
                .filter(t => t.status === status)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

              return (
                <Column
                  key={status}
                  status={status}
                  config={config}
                  tasks={columnTasks}
                  allTasks={tasks}
                  users={users}
                />
              )
            })}
          </div>
        </div>
      </SortableContext>
    </DndContext>
  )
}

// Import no final para evitar erro de referência circular
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

export default Board