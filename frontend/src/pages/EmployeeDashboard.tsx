import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../stores/auth'
import api from '../lib/api'
import { FileText, Download, LogOut } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function EmployeeDashboard() {
  const { user, logout } = useAuthStore()

  const { data: receipts, isLoading } = useQuery({
    queryKey: ['receipts'],
    queryFn: async () => {
      const response = await api.get('/receipts')
      return response.data
    },
  })

  const downloadFile = (receiptId: number, fileType: string) => {
    window.open(`${api.defaults.baseURL}/receipts/${receiptId}/download/${fileType}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Recibos de Nómina</h1>
            <p className="text-sm text-gray-600 mt-1">{user?.name} • {user?.rfc}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <LogOut size={20} />
            Salir
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Cargando recibos...</p>
          </div>
        ) : receipts?.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600">No tienes recibos disponibles</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {receipts?.map((receipt: any) => (
              <div key={receipt.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {format(new Date(receipt.fechaPeriodo), 'MMMM yyyy', { locale: es })}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Periodo: {receipt.periodType} • {receipt.periodId}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {receipt.pdf1Filename && (
                      <button
                        onClick={() => downloadFile(receipt.id, 'pdf1')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                      >
                        <Download size={16} />
                        PDF
                      </button>
                    )}
                    {receipt.pdf2Filename && (
                      <button
                        onClick={() => downloadFile(receipt.id, 'pdf2')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                      >
                        <Download size={16} />
                        Detalle
                      </button>
                    )}
                    {receipt.xmlFilename && (
                      <button
                        onClick={() => downloadFile(receipt.id, 'xml')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                      >
                        <Download size={16} />
                        XML
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
