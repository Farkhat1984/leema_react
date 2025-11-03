/**
 * Admin Wardrobes Page - View and manage user wardrobes
 * Displays all user wardrobes with products and statistics
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shirt, Image as ImageIcon, Eye } from 'lucide-react';
import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { ROUTES } from '@/shared/constants/config';
import { Card } from '@/shared/components/feedback/Card';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { DataTable } from '@/shared/components/ui/DataTable';
import { StatsCard } from '@/shared/components/ui/StatsCard';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { DetailModal } from '@/shared/components/ui/DetailModal';
import { Button } from '@/shared/components/ui/Button';
import { logger } from '@/shared/lib/utils/logger';
import { CONFIG } from '@/shared/constants/config';

// Helper function to convert relative image paths to absolute URLs
const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  // If already an absolute URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  // Construct absolute URL
  return `${CONFIG.API_URL}/${cleanPath}`;
};

interface WardrobeItem {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  name: string;
  description: string | null;
  images: string[];
  source: string;
  shop_name: string | null;
  is_favorite: boolean;
  folder: string | null;
  created_at: string;
  updated_at: string;
}

interface WardrobesResponse {
  items: WardrobeItem[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

interface WardrobeStats {
  total_items: number;
  total_users_with_items: number;
  by_source: Record<string, number>;
  avg_items_per_user: number;
  top_users: Array<{user_id: number; user_name: string; user_email: string; item_count: number}>;
  top_folders: Array<{folder: string; item_count: number}>;
  favorites_count: number;
}

function WardrobesPage() {
  const [wardrobes, setWardrobes] = useState<WardrobeItem[]>([]);
  const [stats, setStats] = useState<WardrobeStats>({
    total_items: 0,
    total_users_with_items: 0,
    by_source: {},
    avg_items_per_user: 0,
    top_users: [],
    top_folders: [],
    favorites_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const limit = 20;

  useEffect(() => {
    loadWardrobes();
  }, [currentPage, searchQuery]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadWardrobes = async () => {
    try {
      setIsLoading(true);
      const skip = (currentPage - 1) * limit;
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await apiRequest<WardrobesResponse>(
        `${API_ENDPOINTS.ADMIN.WARDROBES}?${params}`
      );

      setWardrobes(response.items || []);
      setTotalPages(Math.ceil(response.total / limit));
    } catch (error) {
      logger.error('Failed to load wardrobes', error);
      setWardrobes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiRequest<WardrobeStats>(
        API_ENDPOINTS.ADMIN.WARDROBES_STATS
      );
      setStats(response);
    } catch (error) {
      logger.error('Failed to load wardrobe stats', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleViewDetails = (item: WardrobeItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const columns = [
    {
      accessorKey: 'user',
      header: 'Пользователь',
      cell: ({row}: {row: {original: WardrobeItem}}) => {
        const item = row.original;
        return (
          <div>
            <div className="font-medium text-gray-900">{item.user_name}</div>
            <div className="text-sm text-gray-500">{item.user_email}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'item',
      header: 'Товар',
      cell: ({row}: {row: {original: WardrobeItem}}) => {
        const item = row.original;
        const imageUrl = item.images && item.images.length > 0 ? getImageUrl(item.images[0]) : null;
        return (
          <div className="flex items-center gap-3">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <ImageIcon className="text-gray-400 w-6 h-6" />
              </div>
            )}
            <div>
              <div className="font-medium text-gray-900">{item.name}</div>
              <div className="text-sm text-gray-500">{item.shop_name || item.source}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Добавлено',
      cell: ({row}: {row: {original: WardrobeItem}}) => {
        const item = row.original;
        return (
          <span className="text-gray-600">
            {new Date(item.created_at).toLocaleDateString('ru-RU')}
          </span>
        );
      },
    },
    {
      accessorKey: 'actions',
      header: 'Действия',
      cell: ({row}: {row: {original: WardrobeItem}}) => {
        const item = row.original;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(item)}
          >
            <Eye className="w-5 h-5" />
          </Button>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                to={ROUTES.ADMIN.DASHBOARD}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Link>
              <div className="flex items-center">
                <Shirt className="w-5 h-5 text-purple-600 mr-3" />
                <span className="text-xl font-bold text-gray-900">Гардеробы пользователей</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Всего товаров"
            value={stats.total_items}
            icon="tshirt"
          />
          <StatsCard
            title="Пользователей"
            value={stats.total_users_with_items}
            icon="users"
          />
          <StatsCard
            title="Средне на пользователя"
            value={stats.avg_items_per_user.toFixed(1)}
            icon="box"
          />
          <StatsCard
            title="Избранное"
            value={stats.favorites_count}
            icon="star"
          />
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Поиск по пользователю или товару..."
              />
            </div>
          </div>
        </Card>

        {/* Wardrobes Table */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Список товаров в гардеробах
          </h2>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner className="w-8 h-8 text-purple-600" />
            </div>
          ) : wardrobes.length === 0 ? (
            <EmptyState
              icon="tshirt"
              title="Гардеробы пусты"
              description={
                searchQuery
                  ? 'Попробуйте изменить параметры поиска'
                  : 'Когда пользователи добавят товары в гардероб, они появятся здесь'
              }
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
          title="Детали товара в гардеробе"
        >
          <div className="space-y-4">
            {/* Product Image */}
            {selectedItem.images && selectedItem.images.length > 0 && (
              <div className="flex justify-center">
                <img
                  src={getImageUrl(selectedItem.images[0])}
                  alt={selectedItem.name}
                  className="w-48 h-48 rounded-lg object-cover"
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">Описание:</span>
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
                <div className="flex justify-between">
                  <span className="text-gray-600">Избранное:</span>
                  <span className="font-medium text-gray-900">{selectedItem.is_favorite ? 'Да' : 'Нет'}</span>
                </div>
                {selectedItem.folder && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Папка:</span>
                    <span className="font-medium text-gray-900">{selectedItem.folder}</span>
                  </div>
                )}
              </div>
            </div>

            {/* User Details */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Информация о пользователе</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Имя:</span>
                  <span className="font-medium text-gray-900">{selectedItem.user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{selectedItem.user_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ID пользователя:</span>
                  <span className="font-medium text-gray-900">#{selectedItem.user_id}</span>
                </div>
              </div>
            </div>

            {/* Added Date */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Дата добавления</h4>
              <div className="text-sm">
                <span className="text-gray-600">
                  {new Date(selectedItem.created_at).toLocaleString('ru-RU')}
                </span>
              </div>
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
};

export default WardrobesPage;
