import { Calendar, TrendingUp, BarChart3 } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import type { TimePeriod } from '../types/analytics.types'

interface PeriodSelectorProps {
  value: TimePeriod
  onChange: (period: TimePeriod) => void
  className?: string
}

const PERIODS: { value: TimePeriod; label: string; icon: typeof Calendar }[] = [
  { value: 'daily', label: 'Daily', icon: Calendar },
  { value: 'weekly', label: 'Weekly', icon: TrendingUp },
  { value: 'monthly', label: 'Monthly', icon: BarChart3 },
]

export function PeriodSelector({ value, onChange, className = '' }: PeriodSelectorProps) {
  return (
    <div className={`inline-flex rounded-lg border border-gray-200 bg-white p-1 ${className}`}>
      {PERIODS.map((period) => {
        const Icon = period.icon
        const isActive = value === period.value
        return (
          <button
            key={period.value}
            onClick={() => onChange(period.value)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
              ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            {period.label}
          </button>
        )
      })}
    </div>
  )
}
