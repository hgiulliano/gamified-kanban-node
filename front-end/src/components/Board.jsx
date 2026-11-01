// ============================================
// BOARD — Quadro Kanban Completo (4 Colunas)
// Usa DndContext para coordenar drag-and-drop
// ============================================

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import Column from './Column'
import TaskForm from './TaskForm'
import { useKanban } from '../context/KanbanContext'

// Ordem das colunas (importante para layout)
const COLUMN_ORDER = ['TODO', 'DOING', 'REVIEW', 'READY']

function Board() {
  // 1. PEGA ESTADO E AÇÕES DO CONTEXTO GLOBAL
  const { tasks, loading, error, moveTask, addTask, users } = useKanban()

  // 2. SENSORES — Como o usuário pode arrastar (mouse + touch + teclado)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // Previne scroll acidental (8px)
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates, // Navegação por setas
    })
  )

  // 3. HANDLER QUANDO DRAG TERMINA (drop)
  const handleDragEnd = async (event) => {
    const { active, over } = event

    // active = item sendo arrastado (task)
    // over = zona onde soltou (coluna)
    
    if (!over) return  // Soltou fora de zona válida

    // @dnd-kit usa IDs string - converter para number para API
    const taskId = Number(active.id)
    const newStatus = over.id  // ID da coluna = status (string: 'TODO', 'DOING', etc.)

    // Evita mover para mesmo status
    const task = tasks.find(t => t.id === taskId)
    if (task && task.status === newStatus) return

    // Chama ação do contexto (otimista + API + rollback)
    try {
      await moveTask(taskId, newStatus)
    } catch (err) {
      // Erro já tratado no contexto (rollback + setError)
      console.error('Erro ao mover task:', err)
    }
  }

  // 4. HANDLER CRIAR TASK (vem do TaskForm)
  const handleCreateTask = async (title, userId) => {
    try {
      await addTask(title, userId)
    } catch (err) {
      console.error('Erro ao criar task:', err)
    }
  }

  // 5. LOADING STATE
  if (loading) {
    return (
      <div className="board-loading" role="status" aria-label="Carregando quadro">
        <div className="spinner"></div>
        <p>Carregando seu Kanban...</p>
      </div>
    )
  }

  // 6. ERROR STATE
  if (error) {
    return (
      <div className="board-error" role="alert">
        <h3>⚠️ Erro ao carregar</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Tentar novamente</button>
      </div>
    )
  }

  // 7. IDs STRING PARA @dnd-kit (obrigatório)
  const sortableIds = tasks.map(t => String(t.id))

  return (
    // 8. DndContext — PROVIDER DO DRAG-AND-DROP
    <DndContext
      sensors={sensors}                    // Sensores configurados
      collisionDetection={closestCenter}   // Algoritmo: centro mais próximo
      onDragEnd={handleDragEnd}            // Callback quando solta
    >
      {/* SortableContext — Permite reordenar DENTRO da coluna */}
      <SortableContext
        items={sortableIds}                // IDs como STRING (obrigatório @dnd-kit)
        strategy={verticalListSortingStrategy}    // Estratégia lista vertical
      >
        <div className="kanban-board" role="region" aria-label="Quadro Kanban">
          
          {/* Header do Board */}
          <header className="board-header">
            <h1 className="board-title">🎮 Gamified Kanban</h1>
            <TaskForm onSubmit={handleCreateTask} users={users} />
          </header>

          {/* Grid das 4 Colunas */}
          <div className="board-grid" role="list">
            {COLUMN_ORDER.map(status => (
              <Column
                key={status}
                status={status}
                tasks={tasks}
                onMoveTask={moveTask}
              />
            ))}
          </div>

        </div>
      </SortableContext>
    </DndContext>
  )
}

// ============================================
// UTILITÁRIO: Coordenadas para navegação por teclado
// (Permite mover cards com setas ↑↓←→)
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

export default Board