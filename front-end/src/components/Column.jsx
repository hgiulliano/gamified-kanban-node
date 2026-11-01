// ============================================
// COLUMN — Coluna do Kanban (Droppable)
// ============================================

import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'

// Configuração das colunas
const COLUMN_CONFIG = {
  TODO: { label: '📝 A Fazer', color: '#6b7280', order: 0 },
  DOING: { label: '⚡ Fazendo', color: '#3b82f6', order: 1 },
  REVIEW: { label: '👀 Revisão', color: '#f59e0b', order: 2 },
  READY: { label: '✅ Pronto', color: '#10b981', order: 3 },
}

function Column({ status, tasks, onMoveTask }) {
  const config = COLUMN_CONFIG[status]

  // 1. HOOK useDroppable — Torna a área um "drop zone"
  const {
    setNodeRef,
    isOver,              // True quando algo está sendo arrastado POR CIMA
    overId,              // ID do item que está por cima (se houver)
  } = useDroppable({ id: status })  // ID único = status da coluna

  // 2. ESTILO DINÂMICO — Feedback visual quando arrastando por cima
  const columnStyle = {
    backgroundColor: isOver ? `${config.color}15` : 'transparent', // 15 = 8% opacity
    borderColor: isOver ? config.color : '#e5e7eb',
  }

  // 3. FILTRA TASKS DESTA COLUNA + ORDENA POR CRIAÇÃO (mais novas primeiro)
  const columnTasks = tasks
    .filter(task => task.status === status)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return (
    // 4. ELEMENTO RAIZ DA COLUNA
    <div
      ref={setNodeRef}              // Conecta DOM node ao dnd-kit
      className="kanban-column"
      style={columnStyle}
      data-status={status}
    >
      {/* Header da coluna */}
      <div className="column-header" style={{ borderColor: config.color }}>
        <h2 className="column-title">{config.label}</h2>
        <span className="column-count">{columnTasks.length}</span>
      </div>

      {/* Área onde cards são dropados */}
      <div className="column-dropzone" role="list" aria-label={config.label}>
        {columnTasks.length === 0 ? (
          // Estado vazio
          <div className="column-empty" style={{ borderColor: config.color }}>
            <p>Arraste uma task para cá</p>
            <span className="empty-hint">Ou clique em "+" para criar</span>
          </div>
        ) : (
          // Lista de cards (usa useSortable para ordenação dentro da coluna)
          columnTasks.map((task, index) => (
            // Key é obrigatória em listas React
            <TaskCard
              key={task.id}
              task={task}
              onMove={onMoveTask}  // Passamos a função de mover
            />
          ))
        )}
      </div>
    </div>
  )
}

export default Column