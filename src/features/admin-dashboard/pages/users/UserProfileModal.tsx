import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { apiRequest } from '@/shared/lib/api/client';
import { Button } from '@/shared/components/ui/Button';
import { formatDate } from '@/shared/lib/utils';

interface UserProfileModalProps {
  userId: number;
  onClose: () => void;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  balance: number;
  free_generations_left: number;
  free_try_ons_left: number;
  role: string;
  phone?: string;
  whatsapp?: string;
  full_name?: string;
  height?: number;
  age?: number;
  weight?: number;
  body_type?: string;
  total_generations?: number;
  created_at: string;
  updated_at: string;
}

function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const { data: user, isLoading } = useQuery<UserProfile>({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const response = await apiRequest<UserProfile>(`/api/v1/admin/users-all`, 'GET');
      // Find user in the response
      if (Array.isArray(response)) {
        return response.find((u: any) => u.id === userId);
      }
      // If response has users array
      if (response && 'users' in response) {
        return (response as any).users.find((u: any) => u.id === userId);
      }
      return response;
    },
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Профиль пользователя</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar & Basic Info */}
          <div className="flex items-center gap-4">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-3xl font-medium text-gray-600 dark:text-gray-300">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{user.name}</h3>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {user.role}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Баланс</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${user.balance || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Бесплатные генерации</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.free_generations_left || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Бесплатные примерки</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.free_try_ons_left || 0}</p>
            </div>
          </div>

          {/* Personal Details */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Личная информация</h4>
            <div className="space-y-3">
              {user.full_name && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Полное имя</span>
                  <span className="font-medium text-gray-900 dark:text-white">{user.full_name}</span>
                </div>
              )}
              {user.phone && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Телефон</span>
                  <span className="font-medium text-gray-900 dark:text-white">{user.phone}</span>
                </div>
              )}
              {user.whatsapp && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">WhatsApp</span>
                  <span className="font-medium text-gray-900 dark:text-white">{user.whatsapp}</span>
                </div>
              )}
              {user.age && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Возраст</span>
                  <span className="font-medium text-gray-900 dark:text-white">{user.age} лет</span>
                </div>
              )}
              {user.height && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Рост</span>
                  <span className="font-medium text-gray-900 dark:text-white">{user.height} см</span>
                </div>
              )}
              {user.weight && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Вес</span>
                  <span className="font-medium text-gray-900 dark:text-white">{user.weight} кг</span>
                </div>
              )}
              {user.body_type && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Тип телосложения</span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">{user.body_type}</span>
                </div>
              )}
            </div>
          </div>

          {/* System Details */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Системная информация</h4>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">ID пользователя</span>
                <span className="font-medium text-gray-900 dark:text-white">{user.id}</span>
              </div>
              {user.total_generations !== undefined && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Всего генераций</span>
                  <span className="font-medium text-gray-900 dark:text-white">{user.total_generations}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Дата регистрации</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatDate(user.created_at)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">Последнее обновление</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatDate(user.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </div>
  );
}

export default UserProfileModal;
