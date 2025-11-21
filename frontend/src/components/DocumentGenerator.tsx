import React, { useState } from 'react'
import { FileText, Download, CheckSquare } from 'lucide-react'
import { AnalysisResult, FloorPlan } from '../types'
import { OwnerData, ApartmentData } from './OwnerDataForm'
import axios from 'axios'

interface DocumentType {
  id: string
  name: string
  description: string
  requires_analysis: boolean
}

interface DocumentGeneratorProps {
  plan: FloorPlan
  analysis: AnalysisResult | null
  ownerData: OwnerData
  apartmentData: ApartmentData
}

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({
  plan,
  analysis,
  ownerData,
  apartmentData
}) => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [selectedDocType, setSelectedDocType] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [generatedDocument, setGeneratedDocument] = useState<string>('')
  const [loadingTypes, setLoadingTypes] = useState(false)

  React.useEffect(() => {
    loadDocumentTypes()
  }, [])

  const loadDocumentTypes = async () => {
    setLoadingTypes(true)
    try {
      const response = await axios.get('http://localhost:8000/api/document-types')
      setDocumentTypes(response.data.document_types)
    } catch (error) {
      console.error('Ошибка загрузки типов документов:', error)
    } finally {
      setLoadingTypes(false)
    }
  }

  const generateDocument = async () => {
    if (!selectedDocType) {
      alert('Выберите тип документа')
      return
    }

    const selectedType = documentTypes.find(t => t.id === selectedDocType)
    if (selectedType?.requires_analysis && !analysis) {
      alert('Сначала необходимо провести анализ плана')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(
        'http://localhost:8000/api/generate-document',
        {
          apartment_data: apartmentData,
          owner_data: ownerData,
          plan: plan,
          analysis: analysis || undefined,
          document_type: selectedDocType
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      setGeneratedDocument(response.data)
    } catch (error) {
      console.error('Ошибка генерации документа:', error)
      alert('Ошибка при генерации документа')
    } finally {
      setLoading(false)
    }
  }

  const downloadDocument = () => {
    if (!generatedDocument) return

    const selectedType = documentTypes.find(t => t.id === selectedDocType)
    const filename = `${selectedType?.name || 'document'}.txt`

    const blob = new Blob([generatedDocument], { type: 'text/plain;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const copyToClipboard = () => {
    if (!generatedDocument) return

    navigator.clipboard.writeText(generatedDocument)
    alert('Документ скопирован в буфер обмена')
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Генерация документов</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Выберите тип документа
            </label>
            {loadingTypes ? (
              <p className="text-gray-500">Загрузка...</p>
            ) : (
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Выберите документ --</option>
                {documentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedDocType && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                {documentTypes.find(t => t.id === selectedDocType)?.description}
              </p>
            </div>
          )}

          <button
            onClick={generateDocument}
            disabled={loading || !selectedDocType}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {loading ? 'Генерация...' : 'Сгенерировать документ'}
          </button>
        </div>
      </div>

      {generatedDocument && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Сгенерированный документ</h3>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
              >
                <CheckSquare className="w-4 h-4" />
                Копировать
              </button>
              <button
                onClick={downloadDocument}
                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Скачать
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
            <pre className="text-xs whitespace-pre-wrap font-mono">
              {generatedDocument}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
