/**
 * Shop Profile Edit Page - Edit shop profile and settings
 * Allows shop owners to update their shop information
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserCog, Info } from 'lucide-react';
import { BackButton } from '@/shared/components/ui/BackButton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/authStore';
import { shopService } from '@/features/shop-dashboard/services';
import { ROUTES } from '@/shared/constants/config';
import { Card } from '@/shared/components/feedback/Card';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Button } from '@/shared/components/ui/Button';
import { ImageUploadSingle } from '@/shared/components/ui/ImageUploadSingle';
import { PhoneInput } from '@/shared/components/forms/PhoneInput';
import toast from 'react-hot-toast';

const shopProfileSchema = z.object({
  shop_name: z.string().min(2, 'Название должно быть не менее 2 символов'),
  owner_name: z.string().min(2, 'Имя владельца должно быть не менее 2 символов'),
  description: z.string().min(10, 'Описание должно быть не менее 10 символов'),
  address: z.string().min(5, 'Адрес должен быть не менее 5 символов'),
  whatsapp_number: z.string().min(10, 'Введите корректный номер WhatsApp'),
  phone: z.string().optional(),
});

type ShopProfileFormData = z.infer<typeof shopProfileSchema>;

interface Shop {
  id: number;
  shop_name: string;
  owner_name: string;
  description: string;
  address: string;
  phone: string;
  whatsapp_number: string | null;
  avatar_url: string | null;
  is_approved: boolean;
  is_active: boolean;
}

function ShopProfilePage() {
  const { setShop } = useAuthStore();
  const queryClient = useQueryClient();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  /**
   * Fetch shop profile using React Query
   */
  const { data: shop, isLoading } = useQuery({
    queryKey: ['shop', 'profile'],
    queryFn: shopService.getProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ShopProfileFormData>({
    resolver: zodResolver(shopProfileSchema),
    values: shop ? {
      shop_name: shop.shop_name,
      owner_name: shop.owner_name,
      description: shop.description,
      address: shop.address,
      whatsapp_number: shop.whatsapp_number || shop.phone, // WhatsApp is primary, fallback to phone
      phone: shop.phone || '',
    } : undefined,
  });

  const whatsappValue = watch('whatsapp_number');

  const handleAvatarChange = (file: File | null) => {
    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Mutation for uploading avatar
   */
  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => shopService.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop', 'profile'] });
      toast.success('Аватар успешно загружен');
    },
    onError: () => {
      toast.error('Не удалось загрузить аватар');
    },
  });

  /**
   * Mutation for updating profile
   */
  const updateProfileMutation = useMutation({
    mutationFn: shopService.updateProfile,
    onSuccess: (response) => {
      setShop(response as any);
      queryClient.invalidateQueries({ queryKey: ['shop', 'profile'] });
      toast.success('Профиль успешно обновлен');
    },
    onError: () => {
      toast.error('Не удалось обновить профиль');
    },
  });

  const onSubmit = async (data: ShopProfileFormData) => {
    // Upload avatar if changed
    if (avatarFile) {
      await uploadAvatarMutation.mutateAsync(avatarFile);
    }

    // Update shop profile
    updateProfileMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner className="w-12 h-12 text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <UserCog className="text-purple-600 w-6 h-6 mr-3" />
              <span className="text-xl font-bold text-gray-900">Настройки профиля</span>
            </div>
            <BackButton to="/shop" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Аватар магазина</h2>
            <ImageUploadSingle
              value={avatarPreview || shop?.avatar_url}
              onChange={handleAvatarChange}
              shape="square"
              maxSize={5 * 1024 * 1024}
            />
          </Card>

          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Основная информация</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название магазина <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('shop_name')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Введите название магазина"
                />
                {errors.shop_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.shop_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Имя владельца <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('owner_name')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Введите имя владельца"
                />
                {errors.owner_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.owner_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Расскажите о вашем магазине"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Адрес <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('address')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Введите адрес магазина"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Контактная информация</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp <span className="text-red-500">*</span>
                </label>
                <PhoneInput
                  value={whatsappValue}
                  onChange={(value) => setValue('whatsapp_number', value)}
                  error={errors.whatsapp_number?.message}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Этот номер будет использоваться для WhatsApp интеграции
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон
                </label>
                <PhoneInput
                  value={watch('phone') || ''}
                  onChange={(value) => setValue('phone', value)}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Дополнительный номер телефона (необязательно)
                </p>
              </div>
            </div>
          </Card>

          {/* Status Info */}
          {shop && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-center">
                <Info className="text-blue-600 w-5 h-5 mr-3" />
                <div>
                  <p className="font-medium text-blue-900">Статус магазина</p>
                  <p className="text-sm text-blue-700">
                    {shop.is_approved && shop.is_active && 'Одобрен и активен'}
                    {!shop.is_approved && 'Ожидает проверки'}
                    {shop.is_approved && !shop.is_active && 'Деактивирован'}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link to={ROUTES.SHOP.DASHBOARD}>
              <Button type="button" variant="outline">
                Отмена
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              isLoading={updateProfileMutation.isPending || uploadAvatarMutation.isPending}
              disabled={updateProfileMutation.isPending || uploadAvatarMutation.isPending}
            >
              Сохранить изменения
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShopProfilePage;
