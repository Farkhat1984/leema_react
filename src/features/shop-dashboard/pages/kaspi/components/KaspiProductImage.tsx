import { Package } from 'lucide-react';

interface KaspiProductImageProps {
  productName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Компонент-заглушка для изображений товаров Kaspi.kz
 *
 * Kaspi API не предоставляет URL изображений товаров через API.
 * Показывает иконку Package с информативным tooltip.
 */
export function KaspiProductImage({
  productName,
  className = '',
  size = 'md',
}: KaspiProductImageProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center border border-purple-200`}
      title={`${productName}\n\n⚠️ Kaspi API не предоставляет изображения товаров через API.\nДля отображения фото свяжитесь с поддержкой Kaspi.`}
    >
      <Package className="w-1/2 h-1/2 text-purple-400" />
    </div>
  );
}
