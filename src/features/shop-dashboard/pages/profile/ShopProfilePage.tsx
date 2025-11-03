/**
 * Shop Profile Edit Page - Edit shop profile and settings
 * Allows shop owners to update their shop information
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserCog, Info } from 'lucide-react';
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
  name: z.string().min(2, 'Название должно быть не менее 2 символов'),
  description: z.string().min(10, 'Описание должно быть не менее 10 символов'),
  address: z.string().min(5, 'Адрес должен быть не менее 5 символов'),
  phone: z.string().min(10, 'Введите корректный номер телефона'),
  whatsapp_phone: z.string().optional(),
  email: z.string().email('Введите корректный email'),
  instagram: z.string().optional(),
  website: z.string().url('Введите корректный URL').optional().or(z.literal('')),
});

type ShopProfileFormData = z.infer<typeof shopProfileSchema>;

interface Shop {
  id: number;
  name: string;
  description: string;
  address: string;
  phone: string;
  whatsapp_phone: string | null;
  email: string;
  instagram: string | null;
  website: string | null;
  avatar: string | null;
  status: string;
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
      name: shop.name,
      description: shop.description,
      address: shop.address,
      phone: shop.phone,
      whatsapp_phone: shop.whatsapp_phone || '',
      email: shop.email,
      instagram: shop.instagram || '',
      website: shop.website || '',
    } : undefined,
  });

  const phoneValue = watch('phone');

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
            <div className="flex items-center space-x-4">
              <Link
                to={ROUTES.SHOP.DASHBOARD}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Link>
              <div className="flex items-center">
                <UserCog className="text-purple-600 w-6 h-6 mr-3" />
                <span className="text-xl font-bold text-gray-900">Настройки профиля</span>
              </div>
            </div>
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
              value={avatarPreview}
              onChange={handleAvatarChange}
              shape="square"
              maxSize={5}
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
                  {...register('name')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Введите название магазина"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
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
                  Телефон <span className="text-red-500">*</span>
                </label>
                <PhoneInput
                  value={phoneValue}
                  onChange={(value) => setValue('phone', value)}
                  error={errors.phone?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <PhoneInput
                  value={watch('whatsapp_phone') || ''}
                  onChange={(value) => setValue('whatsapp_phone', value)}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Если не указан, будет использоваться основной телефон
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Social Media */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Социальные сети</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                    @
                  </span>
                  <input
                    type="text"
                    {...register('instagram')}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сайт
                </label>
                <input
                  type="url"
                  {...register('website')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://yourwebsite.com"
                />
                {errors.website && (
                  <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
                )}
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
                    {shop.status === 'approved' && 'Одобрен'}
                    {shop.status === 'pending' && 'Ожидает проверки'}
                    {shop.status === 'rejected' && 'Отклонен'}
                    {shop.status === 'deactivated' && 'Деактивирован'}
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
