/**
 * User Dashboard - Product Catalog (Main page for users)
 * Implements business requirements from BUSINESS_FLOW_DOCUMENTATION.md section 2.1
 *
 * Features:
 * - Product grid display
 * - Pagination (12 products per page)
 * - Category filtering
 * - Search functionality
 * - Lazy loading images
 * - Product details view
 * - Rent/buy prices display
 * - Favorites functionality
 * - Virtual try-on button (redirects to mobile app)
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, LogOut, User, ShoppingBag, Heart, Eye, Smartphone, Wallet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/authStore';
import { userService } from '@/features/user-dashboard/services';
import { productService } from '@/features/products/services';
import { useProductEvents, useOrderEvents, useBalanceEvents, useNotificationEvents } from '@/features/websocket/hooks';
import { ROUTES } from '@/shared/constants/config';
import { Card } from '@/shared/components/feedback/Card';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { NotificationDropdown } from '@/shared/components/layout/NotificationDropdown';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  name: string;
  description: string;
  price_rent: number;
  price_buy: number;
  images: string[];
  category_id: number;
  shop_id: number;
  shop_name?: string;
  sizes: string[];
  status: string;
}

interface Category {
  id: number;
  name: string;
}

function Dashboard() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 12;

  // Enable WebSocket event handlers
  useProductEvents();
  useOrderEvents();
  useBalanceEvents();
  useNotificationEvents();

  /**
   * Fetch user balance using React Query
   */
  const { data: balance } = useQuery({
    queryKey: ['user', 'balance'],
    queryFn: userService.getBalance,
    staleTime: 1000 * 60, // 1 minute
  });

  /**
   * Fetch products using React Query
   */
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', currentPage, selectedCategory, searchQuery],
    queryFn: () => productService.getProducts({
      page: currentPage,
      per_page: PRODUCTS_PER_PAGE,
      status: 'approved',
      category_id: selectedCategory || undefined,
      search: searchQuery || undefined,
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  /**
   * Fetch categories using React Query
   */
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const products = productsData?.products || [];
  const totalPages = productsData?.total_pages || 1;

  /**
   * Handle logout
   */
  const handleLogout = () => {
    useAuthStore.getState().logout();
    window.location.href = ROUTES.PUBLIC.LOGIN;
  };

  /**
   * Handle search
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  /**
   * Handle category filter
   */
  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  /**
   * Handle virtual try-on (redirect to mobile app)
   */
  const handleVirtualTryOn = (productId: number) => {
    // TODO: Implement deep link to mobile app
    toast.info('Функция виртуальной примерки доступна в мобильном приложении');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <ShoppingBag className="w-5 h-5 text-purple-600 mr-3" />
                <span className="text-xl font-bold text-gray-900">Каталог товаров</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {balance && (
                <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-purple-50 rounded-lg">
                  <Wallet className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-900">
                    {balance.current_balance.toLocaleString('ru-RU')} ₸
                  </span>
                </div>
              )}
              <NotificationDropdown />
              <Link
                to={ROUTES.USER.PROFILE}
                className="text-gray-600 hover:text-gray-900 hidden sm:flex items-center space-x-2"
              >
                <User className="w-5 h-5" />
                <span className="text-sm">{user?.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
                title="Выйти"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Поиск товаров..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="md:w-64">
              <select
                value={selectedCategory || ''}
                onChange={(e) => handleCategoryChange(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Все категории</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </Card>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner className="w-12 h-12 text-purple-600" />
          </div>
        ) : products.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Товары не найдены</h3>
            <p className="text-gray-600">Попробуйте изменить фильтры или поисковый запрос</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-100">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-16 h-16 text-gray-300" />
                      </div>
                    )}

                    {/* Favorite Button */}
                    <button
                      className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
                      onClick={() => toast.info('Функция избранного в разработке')}
                    >
                      <Heart className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                    {product.shop_name && (
                      <p className="text-sm text-gray-500 mb-2">{product.shop_name}</p>
                    )}

                    {/* Prices */}
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Аренда</p>
                        <p className="font-bold text-purple-600">{product.price_rent} ₸</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Покупка</p>
                        <p className="font-bold text-gray-900">{product.price_buy} ₸</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVirtualTryOn(product.id)}
                        className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center"
                      >
                        <Smartphone className="w-4 h-4 mr-1" />
                        Примерка
                      </button>
                      <button
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => toast.info('Детали товара в разработке')}
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Назад
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === page
                          ? 'bg-purple-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Вперед
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
