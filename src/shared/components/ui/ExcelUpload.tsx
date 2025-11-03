import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileSpreadsheet, Upload, X, AlertCircle, CheckCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from './Button';
import { logger } from '@/shared/lib/utils/logger';

export interface ExcelRow {
  [key: string]: any;
  _rowNumber: number;
  _isValid: boolean;
  _errors?: string[];
}

export interface ExcelData {
  headers: string[];
  rows: ExcelRow[];
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  file?: File;
  errors?: string[];
}

interface ExcelUploadProps {
  onDataParsed: (data: ExcelData) => void;
  onRemove?: () => void;
  requiredColumns?: string[];
  validateRow?: (row: any, rowNumber: number) => { isValid: boolean; errors?: string[] };
  maxRows?: number;
  maxSize?: number; // in bytes
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  showPreview?: boolean;
  previewRows?: number;
  templateDownloadUrl?: string;
  helperText?: string;
}

export const ExcelUpload: React.FC<ExcelUploadProps> = ({
  onDataParsed,
  onRemove,
  requiredColumns = [],
  validateRow,
  maxRows = 10000,
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false,
  className = '',
  label,
  error,
  showPreview = true,
  previewRows = 5,
  templateDownloadUrl,
  helperText,
}) => {
  const [parsedData, setParsedData] = useState<ExcelData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseExcelFile = async (file: File) => {
    setIsProcessing(true);
    setParseError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      // Get first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert to JSON
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
        raw: false,
      });

      if (jsonData.length === 0) {
        throw new Error('Excel file is empty');
      }

      if (jsonData.length > maxRows) {
        throw new Error(`File contains too many rows. Maximum ${maxRows} rows allowed.`);
      }

      // Extract headers
      const headers = Object.keys(jsonData[0]);

      // Validate required columns
      if (requiredColumns.length > 0) {
        const missingColumns = requiredColumns.filter(
          (col) => !headers.includes(col)
        );
        if (missingColumns.length > 0) {
          throw new Error(
            `Missing required columns: ${missingColumns.join(', ')}`
          );
        }
      }

      // Validate rows
      let validRows = 0;
      let invalidRows = 0;

      const processedRows: ExcelRow[] = jsonData.map((row, index) => {
        const rowNumber = index + 2; // +2 because Excel rows start at 1 and first row is header

        let isValid = true;
        let errors: string[] = [];

        // Custom validation
        if (validateRow) {
          const validation = validateRow(row, rowNumber);
          isValid = validation.isValid;
          errors = validation.errors || [];
        }

        // Check required columns are not empty
        requiredColumns.forEach((col) => {
          if (!row[col] || String(row[col]).trim() === '') {
            isValid = false;
            errors.push(`${col} is required`);
          }
        });

        if (isValid) {
          validRows++;
        } else {
          invalidRows++;
        }

        return {
          ...row,
          _rowNumber: rowNumber,
          _isValid: isValid,
          _errors: errors.length > 0 ? errors : undefined,
        };
      });

      const data: ExcelData = {
        headers,
        rows: processedRows,
        fileName: file.name,
        totalRows: jsonData.length,
        validRows,
        invalidRows,
        file: file,
        errors: [],
      };

      setParsedData(data);
      onDataParsed(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to parse Excel file';
      setParseError(errorMessage);
      logger.error('Excel parse error', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        parseExcelFile(acceptedFiles[0]);
      }
    },
    [maxRows, requiredColumns, validateRow]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
          '.xlsx',
        ],
        'application/vnd.ms-excel': ['.xls'],
        'text/csv': ['.csv'],
      },
      maxSize,
      maxFiles: 1,
      disabled: disabled || isProcessing,
      multiple: false,
    });

  const handleRemove = () => {
    setParsedData(null);
    setParseError(null);
    onRemove?.();
  };

  const fileError = fileRejections[0]?.errors[0];

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {!parsedData ? (
        <>
          {/* Upload Zone */}
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer
              ${
                isDragActive
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 hover:border-indigo-400'
              }
              ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              ${error || fileError || parseError ? 'border-red-500' : ''}
            `}
          >
            <input {...getInputProps()} />

            <div className="flex flex-col items-center justify-center text-gray-500">
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-3"></div>
                  <p className="text-sm font-medium">Processing Excel file...</p>
                </>
              ) : isDragActive ? (
                <>
                  <Upload className="w-12 h-12 mb-3 text-indigo-500" />
                  <p className="text-sm font-medium">Drop Excel file here</p>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-12 h-12 mb-3" />
                  <p className="text-sm font-medium mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">
                    XLSX, XLS, CSV up to {(maxSize / 1024 / 1024).toFixed(0)}MB
                  </p>
                  {helperText && (
                    <p className="text-xs text-gray-400 mt-1">{helperText}</p>
                  )}
                  {requiredColumns.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Required columns: {requiredColumns.join(', ')}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Template Download */}
          {templateDownloadUrl && (
            <div className="mt-3 flex items-center justify-center">
              <a
                href={templateDownloadUrl}
                download
                className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700"
              >
                <Download className="w-4 h-4 mr-1" />
                Download template
              </a>
            </div>
          )}
        </>
      ) : (
        <>
          {/* File Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <FileSpreadsheet className="w-10 h-10 text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {parsedData.fileName}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center">
                      Total: {parsedData.totalRows} rows
                    </span>
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Valid: {parsedData.validRows}
                    </span>
                    {parsedData.invalidRows > 0 && (
                      <span className="flex items-center text-red-600">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Invalid: {parsedData.invalidRows}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="ml-4 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Preview Table */}
            {showPreview && parsedData.rows.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Preview (first {Math.min(previewRows, parsedData.rows.length)}{' '}
                  rows):
                </p>
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                        #
                      </th>
                      {parsedData.headers.map((header) => (
                        <th
                          key={header}
                          className="px-2 py-2 text-left text-xs font-medium text-gray-500"
                        >
                          {header}
                        </th>
                      ))}
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parsedData.rows.slice(0, previewRows).map((row, index) => (
                      <tr
                        key={index}
                        className={!row._isValid ? 'bg-red-50' : ''}
                      >
                        <td className="px-2 py-2 whitespace-nowrap text-gray-500">
                          {row._rowNumber}
                        </td>
                        {parsedData.headers.map((header) => (
                          <td
                            key={header}
                            className="px-2 py-2 whitespace-nowrap text-gray-900"
                          >
                            {String(row[header] || '')}
                          </td>
                        ))}
                        <td className="px-2 py-2 whitespace-nowrap">
                          {row._isValid ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="flex items-center">
                              <AlertCircle className="w-4 h-4 text-red-500" />
                              {row._errors && (
                                <span className="ml-1 text-xs text-red-600">
                                  {row._errors[0]}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.rows.length > previewRows && (
                  <p className="mt-2 text-xs text-gray-500">
                    ... and {parsedData.rows.length - previewRows} more rows
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Error Messages */}
      {(error || fileError || parseError) && (
        <div className="mt-2 flex items-center text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error || fileError?.message || parseError}
        </div>
      )}
    </div>
  );
};
