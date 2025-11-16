/**
 * Admin User Wardrobe Page - View specific user's wardrobe
 * Displays all wardrobe items for a single user with filtering
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Image as ImageIcon, Eye, User as UserIcon, X } from 'lucide-react';
import { BackButton } from '@/shared/components/ui/BackButton';
import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { ROUTES } from '@/shared/constants/config';
import { Card } from '@/shared/components/feedback/Card';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { DataTable } from '@/shared/components/ui/DataTable';
import { StatsCard } from '@/shared/components/ui/StatsCard';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { DetailModal } from '@/shared/components/ui/DetailModal';
import { Button } from '@/shared/components/ui/Button';
import { logger } from '@/shared/lib/utils/logger';
import { CONFIG } from '@/shared/constants/config';

// Helper function to convert relative image paths to absolute URLs
const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${CONFIG.API_URL}/${cleanPath}`;
};

interface WardrobeItem {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  images: string[];
  source: string;
  shop_name: string | null;
  is_favorite: boolean;
  folder: string | null;
  category_id: number | null;
  category_name: string | null;
  price: number | null;
  size: string | string[] | null;
  color: string | string[] | null;
  characteristics: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface UserInfo {
  id: number;
  name: string;
  email: string;
}

interface UserWardrobeResponse {
  user: UserInfo;
  items: WardrobeItem[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

function AdminUserWardrobePage() {
  const { userId } = useParams<{ userId: string }>();
  const [wardrobes, setWardrobes] = useState<WardrobeItem[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  // Filter states
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [isFavorite, setIsFavorite] = useState<boolean | null>(null);

  const limit = 20;

  useEffect(() => {
    if (userId) {
      loadUserWardrobe();
    }
  }, [userId, currentPage, selectedSource, selectedFolder, isFavorite]);

  const loadUserWardrobe = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const skip = (currentPage - 1) * limit;
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
        ...(selectedSource && { source: selectedSource }),
        ...(selectedFolder && { folder: selectedFolder }),
        ...(isFavorite !== null && { is_favorite: isFavorite.toString() }),
      });

      const response = await apiRequest<UserWardrobeResponse>(
        `${API_ENDPOINTS.ADMIN.WARDROBES_USER(userId)}?${params}`
      );

      setUser(response.user);
      setWardrobes(response.items || []);
      setTotalItems(response.total);
      setTotalPages(Math.ceil(response.total / limit));
    } catch {
      logger.error('Failed to load user wardrobe', error);
      setWardrobes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (item: WardrobeItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleClearFilters = () => {
    setSelectedSource('');
    setSelectedFolder('');
    setIsFavorite(null);
    setCurrentPage(1);
  };

  // Get unique values for filters
  const uniqueSources = Array.from(new Set(wardrobes.map(w => w.source).filter(Boolean)));
  const uniqueFolders = Array.from(new Set(wardrobes.map(w => w.folder).filter(Boolean)));

  const formatValue = (value: string | string[] | null): string => {
    if (!value) return '—';
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value;
  };

  const columns = [
    {
      accessorKey: 'image',
      header: 'Фото',
      cell: ({row}: {row: {original: WardrobeItem}}) => {
        const item = row.original;
        const imageUrl = item.images && item.images.length > 0 ? getImageUrl(item.images[0]) : null;
        return (
          <div className="w-20 h-20 flex-shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item.name}
                className="w-full h-full rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setEnlargedImage(imageUrl)}
              />
            ) : (
              <div className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center">
                <ImageIcon className="text-gray-400 w-8 h-8" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'name',
      header: 'Название',
      cell: ({row}: {row: {original: WardrobeItem}}) => {
        const item = row.original;
        return (
          <div className="max-w-[200px]">
            <div className="font-medium text-gray-900 truncate" title={item.name}>
              {item.name}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'price',
      header: 'Цена',
      cell: ({row}: {row: {original: WardrobeItem}}) => {
        const item = row.original;
        return (
          <span className="text-gray-900 font-medium whitespace-nowrap">
            {item.price ? `${item.price.toLocaleString('ru-RU')} ₸` : '—'}
          </span>
        );
      },
    },
    {
      accessorKey: 'size',
      header: 'Размер',
      cell: ({row}: {row: {original: WardrobeItem}}) => {
        const item = row.original;
        return (
          <span className="text-gray-600">
            {formatValue(item.size)}
          </span>
        );
      },
    },
    {
      accessorKey: 'category',
      header: 'Категория',
      cell: ({row}: {row: {original: WardrobeItem}}) => {
        const item = row.original;
        return (
          <span className="text-gray-600">
            {item.category_name || '—'}
          </span>
        );
      },
    },
    {
      accessorKey: 'color',
      header: 'Цвет',
      cell: ({row}: {row: {original: WardrobeItem}}) => {
        const item = row.original;
        return (
          <span className="text-gray-600">
            {formatValue(item.color)}
          </span>
        );
      },
    },
    {
      accessorKey: 'source',
      header: 'Источник',
      cell: ({row}: {row: {original: WardrobeItem}}) => {
        const item = row.original;
        const sourceLabels: Record<string, string> = {
          'shop_product': 'Магазин',
          'generated': 'AI',
          'uploaded': 'Загружено',
          'purchased': 'Куплено',
        };
        return (
          <span className="text-gray-600 text-sm">
            {sourceLabels[item.source] || item.source}
          </span>
        );
      },
    },
    {
      accessorKey: 'actions',
      header: '',
      cell: ({row}: {row: {original: WardrobeItem}}) => {
        const item = row.original;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(item)}
            title="Показать все поля"
          >
            <Eye className="w-5 h-5" />
          </Button>
        );
      },
    },
  ];

  // Count stats
  const favoriteCount = wardrobes.filter(w => w.is_favorite).length;
  const sourceCounts = wardrobes.reduce((acc, w) => {
    acc[w.source] = (acc[w.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Гардероб пользователя</h1>
            <p className="text-gray-600 mt-1">Просмотр всех вещей пользователя</p>
          </div>
          <BackButton to={ROUTES.ADMIN.WARDROBES} />
        </div>

        {/* User Info */}
        {user && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500 mt-1">ID пользователя: #{user.id}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Всего товаров"
            value={totalItems}
            icon="tshirt"
          />
          <StatsCard
            title="Избранное"
            value={favoriteCount}
            icon="star"
          />
          <StatsCard
            title="Из магазинов"
            value={sourceCounts['shop_product'] || 0}
            icon="store"
          />
          <StatsCard
            title="Сгенерировано AI"
            value={sourceCounts['generated'] || 0}
            icon="sparkles"
          />
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Фильтры</h3>
              {(selectedSource || selectedFolder || isFavorite !== null) && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Очистить фильтры
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Source filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Источник
                </label>
                <select
                  value={selectedSource}
                  onChange={(e) => {
                    setSelectedSource(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Все источники</option>
                  {uniqueSources.map((source) => (
                    <option key={source} value={source}>
                      {source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              {/* Folder filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Папка
                </label>
                <select
                  value={selectedFolder}
                  onChange={(e) => {
                    setSelectedFolder(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Все папки</option>
                  {uniqueFolders.map((folder) => (
                    <option key={folder} value={folder}>
                      {folder}
                    </option>
                  ))}
                </select>
              </div>

              {/* Favorite filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Избранное
                </label>
                <select
                  value={isFavorite === null ? '' : isFavorite.toString()}
                  onChange={(e) => {
                    setIsFavorite(e.target.value === '' ? null : e.target.value === 'true');
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Все</option>
                  <option value="true">Только избранное</option>
                  <option value="false">Не избранное</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Wardrobes Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Гардероб пользователя
            </h2>
            <span className="text-sm text-gray-600">
              Показано {wardrobes.length} из {totalItems}
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner className="w-8 h-8 text-purple-600" />
            </div>
          ) : wardrobes.length === 0 ? (
            <EmptyState
              icon="tshirt"
              title="Гардероб пуст"
              description="У этого пользователя пока нет товаров в гардеробе"
            />
          ) : (
            <DataTable
              data={wardrobes}
              columns={columns}
              loading={isLoading}
            />
          )}
        </Card>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <DetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Детали товара"
        >
          <div className="space-y-4">
            {/* Product Image */}
            {selectedItem.images && selectedItem.images.length > 0 && (
              <div className="flex justify-center">
                <img
                  src={getImageUrl(selectedItem.images[0])}
                  alt={selectedItem.name}
                  className="w-64 h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setEnlargedImage(getImageUrl(selectedItem.images[0]))}
                />
              </div>
            )}

            {/* Product Details */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Информация о товаре</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Название:</span>
                  <span className="font-medium text-gray-900">{selectedItem.name}</span>
                </div>
                {selectedItem.description && (
                  <div className="flex flex-col">
                    <span className="text-gray-600 mb-1">Описание:</span>
                    <span className="font-medium text-gray-900">{selectedItem.description}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Источник:</span>
                  <span className="font-medium text-gray-900">{selectedItem.source}</span>
                </div>
                {selectedItem.shop_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Магазин:</span>
                    <span className="font-medium text-gray-900">{selectedItem.shop_name}</span>
                  </div>
                )}
                {selectedItem.price && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Цена:</span>
                    <span className="font-medium text-gray-900">{selectedItem.price.toLocaleString('ru-RU')} ₸</span>
                  </div>
                )}
                {selectedItem.category_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Категория:</span>
                    <span className="font-medium text-gray-900">{selectedItem.category_name}</span>
                  </div>
                )}
                {selectedItem.size && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Размер:</span>
                    <span className="font-medium text-gray-900">{formatValue(selectedItem.size)}</span>
                  </div>
                )}
                {selectedItem.color && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Цвет:</span>
                    <span className="font-medium text-gray-900">{formatValue(selectedItem.color)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Избранное:</span>
                  <span className="font-medium text-gray-900">{selectedItem.is_favorite ? 'Да ⭐' : 'Нет ☆'}</span>
                </div>
                {selectedItem.folder && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Папка:</span>
                    <span className="font-medium text-gray-900">{selectedItem.folder}</span>
                  </div>
                )}
                {selectedItem.original_product_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID продукта:</span>
                    <span className="font-medium text-gray-900">{selectedItem.original_product_id}</span>
                  </div>
                )}
                {selectedItem.generation_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID генерации:</span>
                    <span className="font-medium text-gray-900">{selectedItem.generation_id}</span>
                  </div>
                )}
                {selectedItem.characteristics && Object.keys(selectedItem.characteristics).length > 0 && (
                  <div>
                    <span className="text-gray-600 block mb-1">Характеристики:</span>
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify(selectedItem.characteristics, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Даты</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Добавлено:</span>
                  <span className="text-gray-600">
                    {new Date(selectedItem.created_at).toLocaleString('ru-RU')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Обновлено:</span>
                  <span className="text-gray-600">
                    {new Date(selectedItem.updated_at).toLocaleString('ru-RU')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DetailModal>
      )}

      {/* Image Enlargement Modal */}
      {enlargedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <button
            onClick={() => setEnlargedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={enlargedImage}
            alt="Enlarged view"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default AdminUserWardrobePage;
