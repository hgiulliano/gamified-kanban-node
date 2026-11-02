// ============================================
// APP — Componente Raiz
// ============================================

import { KanbanProvider } from './context/KanbanContext'
import KanbanLayout from './components/KanbanLayout'
import './index.css'

function App() {
  return (
    <KanbanProvider>
      <div className="app">
        <KanbanLayout />
      </div>
    </KanbanProvider>
  )
}

export default App