import React from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from './Button';
import { logger } from '@/shared/lib/utils/logger';

interface ExcelExportProps {
  data: any[];
  fileName?: string;
  sheetName?: string;
  columns?: { key: string; label: string }[];
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  buttonText?: string;
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (error: Error) => void;
}

export const ExcelExport: React.FC<ExcelExportProps> = ({
  data,
  fileName = 'export',
  sheetName = 'Sheet1',
  columns,
  disabled = false,
  variant = 'outline',
  size = 'md',
  className = '',
  buttonText = 'Export to Excel',
  onExportStart,
  onExportComplete,
  onExportError,
}) => {
  const handleExport = () => {
    try {
      onExportStart?.();

      if (!data || data.length === 0) {
        throw new Error('No data to export');
      }

      // Transform data based on columns config
      let exportData = data;

      if (columns && columns.length > 0) {
        exportData = data.map((row) => {
          const transformedRow: any = {};
          columns.forEach((col) => {
            transformedRow[col.label] = row[col.key] ?? '';
          });
          return transformedRow;
        });
      }

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const maxWidth = 50;
      const colWidths: { wch: number }[] = [];

      // Get headers
      const headers = columns
        ? columns.map((col) => col.label)
        : Object.keys(exportData[0] || {});

      headers.forEach((header, i) => {
        const headerLength = header.length;
        const maxCellLength = Math.max(
          ...exportData.map((row) => {
            const value = columns ? row[header] : row[headers[i]];
            return String(value || '').length;
          })
        );

        const width = Math.min(
          Math.max(headerLength, maxCellLength) + 2,
          maxWidth
        );
        colWidths.push({ wch: width });
      });

      worksheet['!cols'] = colWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const finalFileName = `${fileName}_${timestamp}.xlsx`;

      // Write file
      XLSX.writeFile(workbook, finalFileName);

      onExportComplete?.();
    } catch (error) {
      logger.error('Excel export error', error);
      onExportError?.(error as Error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={disabled || !data || data.length === 0}
      className={className}
    >
      <Download className="w-4 h-4 mr-2" />
      {buttonText}
    </Button>
  );
};

// Utility function for exporting data directly
export const exportToExcel = (
  data: any[],
  options?: {
    fileName?: string;
    sheetName?: string;
    columns?: { key: string; label: string }[];
  }
) => {
  const {
    fileName = 'export',
    sheetName = 'Sheet1',
    columns,
  } = options || {};

  if (!data || data.length === 0) {
    logger.warn('No data to export');
    return;
  }

  let exportData = data;

  if (columns && columns.length > 0) {
    exportData = data.map((row) => {
      const transformedRow: any = {};
      columns.forEach((col) => {
        transformedRow[col.label] = row[col.key] ?? '';
      });
      return transformedRow;
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const finalFileName = `${fileName}_${timestamp}.xlsx`;

  XLSX.writeFile(workbook, finalFileName);
};

// Component for creating Excel template
interface ExcelTemplateDownloadProps {
  columns: { key: string; label: string }[];
  fileName?: string;
  sheetName?: string;
  sampleData?: any[];
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  buttonText?: string;
}

export const ExcelTemplateDownload: React.FC<ExcelTemplateDownloadProps> = ({
  columns,
  fileName = 'template',
  sheetName = 'Sheet1',
  sampleData = [],
  variant = 'outline',
  size = 'sm',
  className = '',
  buttonText = 'Download Template',
}) => {
  const handleDownload = () => {
    // Create header row
    const headers: any = {};
    columns.forEach((col) => {
      headers[col.label] = '';
    });

    // Combine with sample data if provided
    const templateData = sampleData.length > 0 ? sampleData : [headers];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Style header row (bold)
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'F3F4F6' } },
      };
    }

    // Auto-size columns
    const colWidths = columns.map((col) => ({
      wch: Math.max(col.label.length + 2, 15),
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const finalFileName = `${fileName}.xlsx`;
    XLSX.writeFile(workbook, finalFileName);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      className={className}
    >
      <FileSpreadsheet className="w-4 h-4 mr-2" />
      {buttonText}
    </Button>
  );
};
