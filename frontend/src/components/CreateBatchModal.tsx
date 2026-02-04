import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Upload } from 'lucide-react'
import api from '../lib/api'

interface CreateBatchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateBatchModal({ isOpen, onClose }: CreateBatchModalProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [batchId, setBatchId] = useState<number | null>(null)
  
  // Form state
  const [periodType, setPeriodType] = useState('quincenal')
  const [periodId, setPeriodId] = useState('')
  const [fechaPeriodo, setFechaPeriodo] = useState('')
  const [zipFile, setZipFile] = useState<File | null>(null)

  // Create batch mutation
  const createBatchMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/batches', data)
      return response.data
    },
    onSuccess: (data) => {
      setBatchId(data.id)
      setStep(2)
    },
    onError: (error: any) => {
      alert('Error al crear lote: ' + (error.response?.data?.message || error.message))
    },
  })

  // Upload ZIP mutation
  const uploadZipMutation = useMutation({
    mutationFn: async ({ batchId, file }: { batchId: number; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post(`/batches/${batchId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      handleClose()
      alert('¡Lote creado y archivo subido exitosamente!')
    },
    onError: (error: any) => {
      alert('Error al subir archivo: ' + (error.response?.data?.message || error.message))
    },
  })

  const handleClose = () => {
    setStep(1)
    setBatchId(null)
    setPeriodType('quincenal')
    setPeriodId('')
    setFechaPeriodo('')
    setZipFile(null)
    onClose()
  }

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault()
    createBatchMutation.mutate({
      periodType,
      periodId,
      fechaPeriodo,
    })
  }

  const handleUploadZip = (e: React.FormEvent) => {
    e.preventDefault()
    if (!batchId || !zipFile) return
    uploadZipMutation.mutate({ batchId, file: zipFile })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith('.zip')) {
      setZipFile(file)
    } else {
      alert('Por favor selecciona un archivo ZIP')
      e.target.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {step === 1 ? 'Crear Nuevo Lote' : 'Subir Archivo ZIP'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            <form onSubmit={handleCreateBatch} className="space-y-4">
              {/* Period Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Periodo
                </label>
                <select
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>

              {/* Period ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Periodo ID
                </label>
                <input
                  type="text"
                  value={periodId}
                  onChange={(e) => setPeriodId(e.target.value)}
                  placeholder="Ej: 2024-01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: YYYY-MM para mensual/quincenal, YYYY-WW para semanal
                </p>
              </div>

              {/* Fecha Periodo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha del Periodo
                </label>
                <input
                  type="date"
                  value={fechaPeriodo}
                  onChange={(e) => setFechaPeriodo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Fecha de corte del periodo (no la fecha de pago)
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createBatchMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createBatchMutation.isPending ? 'Creando...' : 'Continuar'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleUploadZip} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ✓ Lote creado exitosamente (ID: {batchId})
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {periodType} • {periodId} • {fechaPeriodo}
                </p>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Archivo ZIP
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleFileChange}
                    className="hidden"
                    id="zip-file"
                    required
                  />
                  <label
                    htmlFor="zip-file"
                    className="mt-2 cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Seleccionar archivo
                  </label>
                  {zipFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      {zipFile.name} ({(zipFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploadZipMutation.isPending || !zipFile}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadZipMutation.isPending ? 'Subiendo...' : 'Subir Archivo'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
