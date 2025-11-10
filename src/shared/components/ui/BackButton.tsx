import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from './Button'

interface BackButtonProps {
  /** Custom navigation path. If not provided, uses browser history back */
  to?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Back button component for navigation
 * Positioned at top-right of pages (except main dashboards)
 */
export function BackButton({ to, className = '' }: BackButtonProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (to) {
      navigate(to)
    } else {
      navigate(-1)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`text-gray-600 hover:text-gray-900 ${className}`}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Назад
    </Button>
  )
}
