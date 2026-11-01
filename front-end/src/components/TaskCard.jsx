// ============================================
// TASK CARD — Card arrastável com @dnd-kit
// ============================================

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function TaskCard({ task }) {
  // 1. HOOK useSortable — Torna o elemento arrastável
  // Retorna: attributes (props para o elemento), listeners (eventos), setNodeRef (ref para o DOM), transform (CSS transform)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  // 2. ESTILO DINÂMICO PARA ANIMAÇÃO DE ARRASTE
  const style = {
    transform: CSS.Transform.toString(transform), // Converte matrix para string CSS
    transition,                                    // Transição suave ao soltar
    opacity: isDragging ? 0.5 : 1,                // Visual feedback ao arrastar
  }

  // 3. CORES POR STATUS
  const statusColors = {
    TODO: '#6b7280',      // Cinza
    DOING: '#3b82f6',     // Azul
    REVIEW: '#f59e0b',    // Amarelo
    READY: '#10b981',     // Verde
  }

  const statusLabels = {
    TODO: '📝 A Fazer',
    DOING: '⚡ Fazendo',
    REVIEW: '👀 Revisão',
    READY: '✅ Pronto',
  }

  return (
    // 4. ELEMENTO RAIZ — Precisa de ref + attributes + listeners + style
    <div
      ref={setNodeRef}                    // Conecta o DOM node ao dnd-kit
      {...attributes}                     // Espalha atributos de acessibilidade (role, aria-*)
      {...listeners}                      // Conecta eventos de mouse/touch
      style={style}                       // Aplica transform/transition/opacity
      className="task-card"
      data-status={task.status}
    >
      {/* Handle de arraste (área para pegar) — opcional, mas bom para UX */}
      <div
        className="drag-handle"
        {...attributes}                   // Mesmo attributes no handle
        {...listeners}
        aria-label="Arraste para mover"
      >
        ⋮⋮
      </div>

      {/* Conteúdo do card */}
      <div className="task-content">
        <h3 className="task-title">{task.title}</h3>
        
        {/* Badge de status colorido */}
        <span 
          className="task-status-badge"
          style={{ backgroundColor: statusColors[task.status] }}
        >
          {statusLabels[task.status]}
        </span>

        {/* Info do usuário + XP */}
        <div className="task-meta">
          <span className="task-user">👤 {task.username}</span>
          <span className="task-xp">⭐ Nv.{task.level} • {task.current_xp} XP</span>
        </div>
      </div>
    </div>
  )
}

export default TaskCard