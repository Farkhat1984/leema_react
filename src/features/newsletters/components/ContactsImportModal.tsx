import { useState } from 'react'
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { FormModal } from '@/shared/components/ui/FormModal'
import { Button } from '@/shared/components/ui/Button'
import { ExcelUpload } from '@/shared/components/ui/ExcelUpload'
import type { ContactsImportResult } from '../types/newsletter.types'
import { logger } from '@/shared/lib/utils/logger'

interface ContactsImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (file: File) => Promise<ContactsImportResult>
  onDownloadTemplate: () => Promise<void>
}

const REQUIRED_COLUMNS = ['name', 'phone']
const OPTIONAL_COLUMNS = ['has_whatsapp']

export function ContactsImportModal({
  isOpen,
  onClose,
  onImport,
  onDownloadTemplate,
}: ContactsImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<ContactsImportResult | null>(null)
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile)
    setResult(null)
    setPreviewData([])
    setValidationErrors([])
  }

  const handleImport = async () => {
    if (!file) return

    setIsUploading(true)
    try {
      const importResult = await onImport(file)
      setResult(importResult)

      // If successful, close after showing result
      if (importResult.success_count > 0 && importResult.failed_count === 0) {
        setTimeout(() => {
          onClose()
          handleReset()
        }, 2000)
      }
    } catch {
      logger.error('Import error', error)
      setValidationErrors([error instanceof Error ? error.message : 'Import failed'])
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setResult(null)
    setPreviewData([])
    setValidationErrors([])
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Импорт контактов из Excel"
      size="lg"
    >
      <div className="space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            📋 Инструкции по импорту:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Загрузите шаблон, чтобы увидеть правильный формат</li>
            <li>
              Обязательные столбцы: <code className="bg-blue-100 px-1 rounded">name</code>,{' '}
              <code className="bg-blue-100 px-1 rounded">phone</code>
            </li>
            <li>
              Дополнительные столбцы: <code className="bg-blue-100 px-1 rounded">has_whatsapp</code>{' '}
              (true/false или yes/no)
            </li>
            <li>Номера телефонов должны включать код страны (например, +7 123 456 7890)</li>
            <li>Поддерживаемые форматы: XLSX, XLS, CSV</li>
          </ul>
        </div>

        {/* File Upload */}
        <ExcelUpload
          onDataParsed={(data) => {
            setFile(data.file || null);
            setPreviewData(data.rows as Record<string, string>[]);
            setValidationErrors(data.errors || []);
          }}
          requiredColumns={REQUIRED_COLUMNS}
          maxSize={5 * 1024 * 1024}
        />

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-900 mb-1">
                  Ошибки валидации:
                </h4>
                <ul className="text-sm text-red-800 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Import Result */}
        {result && (
          <div
            className={`border rounded-lg p-4 ${
              result.failed_count === 0
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-start gap-2">
              {result.failed_count === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h4
                  className={`text-sm font-medium mb-2 ${
                    result.failed_count === 0 ? 'text-green-900' : 'text-yellow-900'
                  }`}
                >
                  Результат импорта:
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Всего:</span>
                    <span className="ml-2 font-semibold">{result.total}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Успешно:</span>
                    <span className="ml-2 font-semibold text-green-600">
                      {result.success_count}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Ошибок:</span>
                    <span className="ml-2 font-semibold text-red-600">
                      {result.failed_count}
                    </span>
                  </div>
                </div>

                {/* Show errors if any */}
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-xs font-medium text-gray-700 mb-1">Ошибки:</h5>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {result.errors.slice(0, 10).map((err, index) => (
                        <div
                          key={index}
                          className="text-xs text-gray-600 bg-white rounded px-2 py-1"
                        >
                          Строка {err.row}: {err.error}
                        </div>
                      ))}
                      {result.errors.length > 10 && (
                        <p className="text-xs text-gray-500 italic">
                          ... и еще {result.errors.length - 10} ошибок
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Selected File Info */}
        {file && !result && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-700 flex-1">{file.name}</span>
            <span className="text-xs text-gray-500">
              {(file.size / 1024).toFixed(2)} KB
            </span>
            <button
              onClick={() => handleFileSelect(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onDownloadTemplate}
          >
            <Download className="w-4 h-4 mr-2" />
            Загрузить шаблон
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || isUploading}
              isLoading={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Импорт
            </Button>
          </div>
        </div>
      </div>
    </FormModal>
  )
}
