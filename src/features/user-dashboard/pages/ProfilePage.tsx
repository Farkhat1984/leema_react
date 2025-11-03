/**
 * User Profile Page
 * Allows users to view and edit their profile information
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/authStore';
import { userService } from '@/features/user-dashboard/services';
import { profileUpdateSchema } from '@/shared/lib/validation/schemas';
import { FormInput } from '@/shared/components/forms/FormInput';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/feedback/Card';
import { Alert } from '@/shared/components/feedback/Alert';
import { Avatar } from '@/shared/components/feedback/Avatar';
import { Wallet, Package, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

type ProfileFormData = {
  name: string;
  phone?: string;
  avatar?: string;
};

function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  /**
   * Fetch user profile from API
   */
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: userService.getProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  /**
   * Fetch user balance
   */
  const { data: balance } = useQuery({
    queryKey: ['user', 'balance'],
    queryFn: userService.getBalance,
    staleTime: 1000 * 60, // 1 minute
  });

  /**
   * Fetch user orders
   */
  const { data: orders = [] } = useQuery({
    queryKey: ['user', 'orders'],
    queryFn: userService.getOrders,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  /**
   * Fetch user wardrobe
   */
  const { data: wardrobe = [] } = useQuery({
    queryKey: ['user', 'wardrobe'],
    queryFn: userService.getWardrobe,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: profile?.name || user?.name || '',
      phone: profile?.phone || user?.phone || '',
      avatar: profile?.avatar || user?.avatar || '',
    },
  });

  /**
   * Mutation for updating profile
   */
  const updateProfileMutation = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      toast.success('Профиль успешно обновлен');
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка при обновлении профиля');
    },
  });

  /**
   * Handle profile update
   */
  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  /**
   * Cancel editing
   */
  const handleCancel = () => {
    reset({
      name: profile?.name || user?.name || '',
      phone: profile?.phone || user?.phone || '',
      avatar: profile?.avatar || user?.avatar || '',
    });
    setIsEditing(false);
  };

  if (profileLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Загрузка профиля...</p>
      </div>
    );
  }

  const displayUser = profile || user;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Профиль пользователя</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Balance Card */}
          {balance && (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Баланс</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {balance.current_balance.toLocaleString('ru-RU')} ₸
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-purple-600" />
              </div>
            </Card>
          )}

          {/* Orders Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Заказы</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          {/* Wardrobe Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Гардероб</p>
                <p className="text-2xl font-bold text-gray-900">{wardrobe.length}</p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Profile Card */}
        <Card className="p-8">
          <div className="flex items-start gap-6 mb-8">
            {/* Avatar */}
            <Avatar
              src={displayUser.avatar}
              alt={displayUser.name}
              size="xl"
              className="flex-shrink-0"
            />

            {/* User Info */}
            <div className="flex-grow">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{displayUser.name}</h2>
              <p className="text-gray-600 mb-2">{displayUser.email}</p>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {user.role === 'admin' ? 'Администратор' : user.role === 'shop_owner' ? 'Владелец магазина' : 'Пользователь'}
                </span>
              </div>
            </div>

            {/* Edit Button */}
            {!isEditing && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Редактировать
              </Button>
            )}
          </div>

          {/* Profile Form */}
          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormInput
                label="Имя"
                {...register('name')}
                error={errors.name?.message}
                placeholder="Введите ваше имя"
              />

              <FormInput
                label="Телефон"
                {...register('phone')}
                error={errors.phone?.message}
                placeholder="+7 (___) ___-__-__"
              />

              <FormInput
                label="Аватар (URL)"
                {...register('avatar')}
                error={errors.avatar?.message}
                placeholder="https://example.com/avatar.jpg"
              />

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={updateProfileMutation.isPending}
                  isLoading={updateProfileMutation.isPending}
                >
                  Сохранить изменения
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateProfileMutation.isPending}
                >
                  Отмена
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Read-only Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя
                </label>
                <p className="text-gray-900">{displayUser.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{displayUser.email}</p>
              </div>

              {displayUser.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон
                  </label>
                  <p className="text-gray-900">{displayUser.phone}</p>
                </div>
              )}

              {displayUser.createdAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Дата регистрации
                  </label>
                  <p className="text-gray-900">
                    {new Date(displayUser.createdAt).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
