import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth'
import api from '../lib/api'
import { Upload, LogOut, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import CreateBatchModal from '../components/CreateBatchModal'

export default function NominasDashboard() {
  const { user, logout } = useAuthStore()
  const queryClient = useQueryClient()
  const [showCreateBatch, setShowCreateBatch] = useState(false)

  const { data: batches } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      const response = await api.get('/batches')
      return response.data
    },
  })

  const statusColors: Record<string, string> = {
    CREATED: 'bg-gray-100 text-gray-800',
    UPLOADED: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-yellow-100 text-yellow-800',
    DONE: 'bg-green-100 text-green-800',
    PARTIAL_SUCCESS: 'bg-orange-100 text-orange-800',
    FAILED: 'bg-red-100 text-red-800',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Nóminas</h1>
            <p className="text-sm text-gray-600 mt-1">{user?.username}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateBatch(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <Upload size={20} />
              Nuevo Lote
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut size={20} />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold mb-4">Lotes de Carga</h2>
        
        <div className="grid gap-4">
          {batches?.map((batch: any) => (
            <div key={batch.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">
                      {batch.periodType} • {batch.periodId}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[batch.status]}`}>
                      {batch.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Fecha: {batch.fechaPeriodo}
                  </p>
                  {batch.zipFilename && (
                    <p className="text-sm text-gray-600">
                      Archivo: {batch.zipFilename}
                    </p>
                  )}
                  <div className="flex gap-4 mt-3 text-sm">
                    <span className="text-gray-600">
                      Total: {batch.totalFiles || 0}
                    </span>
                    <span className="text-green-600">
                      ✓ {batch.successFiles || 0}
                    </span>
                    <span className="text-red-600">
                      ✗ {batch.errorFiles || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal de Creación de Lote */}
      <CreateBatchModal 
        isOpen={showCreateBatch} 
        onClose={() => setShowCreateBatch(false)} 
      />
    </div>
  )
}
