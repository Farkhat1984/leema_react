import { useState } from 'react'

interface DateRangePresetsProps {
  value: { from?: Date; to?: Date }
  onChange: (range: { from?: Date; to?: Date }) => void
  className?: string
}

const PRESETS = [
  { label: 'Последние 7 дней', days: 7 },
  { label: 'Последние 30 дней', days: 30 },
  { label: 'Последние 3 месяца', days: 90 },
  { label: 'Последний год', days: 365 },
]

export function DateRangePresets({ value, onChange, className = '' }: DateRangePresetsProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false)

  const handlePreset = (days: number) => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    onChange({ from, to })
    setIsCustomOpen(false)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.days}
            onClick={() => handlePreset(preset.days)}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => setIsCustomOpen(!isCustomOpen)}
          className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition-colors"
        >
          Произвольно
        </button>
      </div>

      {/* Custom Date Range Display */}
      {isCustomOpen && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
          <input
            type="date"
            value={value.from?.toISOString().split('T')[0] || ''}
            onChange={(e) => onChange({ from: e.target.value ? new Date(e.target.value) : undefined, to: value.to })}
            className="px-3 py-2 border border-gray-300 rounded-md mr-2"
          />
          <input
            type="date"
            value={value.to?.toISOString().split('T')[0] || ''}
            onChange={(e) => onChange({ from: value.from, to: e.target.value ? new Date(e.target.value) : undefined })}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      )}
    </div>
  )
}
