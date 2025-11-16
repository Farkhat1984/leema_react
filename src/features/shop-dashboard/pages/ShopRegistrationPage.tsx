/**
 * Shop Registration Page
 * Allows shop owners to register their shop or edit registration
 * Shows status (pending/approved/rejected/deactivated)
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { ShopStatus } from '@/features/auth/types';
import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { ROUTES } from '@/shared/constants/config';
import { FormInput } from '@/shared/components/forms/FormInput';
import { FormTextarea } from '@/shared/components/forms/FormTextarea';
import { Button } from '@/shared/components/ui/Button';
import { PageLoader } from '@/shared/components/feedback/PageLoader';
import { logger } from '@/shared/lib/utils/logger';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { ImageUploadSingle } from '@/shared/components/ui/ImageUploadSingle';
import { PhoneInput } from '@/shared/components/forms/PhoneInput';
import { AlertCircle, Store, CheckCircle, Clock, XCircle, Ban } from 'lucide-react';

// Validation schema
const shopSchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
  description: z.string().min(10, 'Описание должно содержать минимум 10 символов'),
  contact_phone: z.string().min(10, 'Пожалуйста, введите корректный номер телефона'),
  whatsapp_phone: z.string().optional(),
  address: z.string().min(5, 'Пожалуйста, введите корректный адрес'),
});

type ShopFormData = z.infer<typeof shopSchema>;

interface Shop {
  id: number;
  name: string;
  description: string;
  contact_phone: string;
  whatsapp_phone?: string;
  address: string;
  avatar?: string;
  status: ShopStatus;
  is_approved: boolean;
  is_active: boolean;
  rejection_reason?: string;
  deactivation_reason?: string;
}

function ShopRegistrationPage() {
  const navigate = useNavigate();
  const { shop, updateShop } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [shopData, setShopData] = useState<Shop | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ShopFormData>({
    resolver: zodResolver(shopSchema),
  });

  useEffect(() => {
    loadShopData();
  }, []);

  /**
   * Load existing shop data if available
   */
  const loadShopData = async () => {
    try {
      if (shop) {
        // Backend returns shop_name, phone, whatsapp_number, avatar_url
        const response = await apiRequest<any>(API_ENDPOINTS.SHOPS.ME);

        // Map backend response to frontend format
        const mappedShop: Shop = {
          id: response.id,
          name: response.shop_name,
          description: response.description,
          contact_phone: response.phone || '',
          whatsapp_phone: response.whatsapp_number || '',
          address: response.address || '',
          avatar: response.avatar_url,
          status: response.status,
          is_approved: response.is_approved,
          is_active: response.is_active,
          rejection_reason: response.rejection_reason,
          deactivation_reason: response.deactivation_reason,
        };

        setShopData(mappedShop);

        // Pre-fill form with existing data
        reset({
          name: mappedShop.name,
          description: mappedShop.description || '',
          contact_phone: mappedShop.contact_phone,
          whatsapp_phone: mappedShop.whatsapp_phone || '',
          address: mappedShop.address,
        });

        if (mappedShop.avatar) {
          setAvatarPreview(mappedShop.avatar);
        }
      }
    } catch (error: any) {
      // 404 = shop doesn't exist yet (new registration)
      // 403 = shop not approved/active (expected on registration page)
      // Only show error for other status codes
      const status = error.response?.status;
      if (status !== 404 && status !== 403) {
        logger.error('Failed to load shop data', error);
        toast.error('Не удалось загрузить информацию о магазине');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle avatar image change
   */
  const handleAvatarChange = (file: File | null) => {
    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAvatarPreview(shopData?.avatar || null);
    }
  };

  /**
   * Submit registration form (save draft)
   */
  const onSubmit = async (data: ShopFormData) => {
    // Block submission if already submitted and pending
    if (shopData?.status === 'pending') {
      toast.error('Ваша заявка уже на рассмотрении. Дождитесь ответа от администратора.');
      return;
    }

    setIsSaving(true);
    try {
      // Upload avatar if changed
      let avatarUrl = shopData?.avatar;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);

        const uploadResponse = await apiRequest<{ url: string }>(
          API_ENDPOINTS.SHOPS.UPLOAD_AVATAR,
          'POST',
          formData
        );
        avatarUrl = uploadResponse.url;
      }

      // Update or create shop - map frontend field names to backend field names
      const payload = {
        shop_name: data.name,
        description: data.description,
        phone: data.contact_phone,
        whatsapp_number: data.whatsapp_phone,
        address: data.address,
        avatar_url: avatarUrl,
      };

      const response = await apiRequest<any>(
        API_ENDPOINTS.SHOPS.UPDATE_ME,
        'PUT',
        payload
      );

      // Map backend response to frontend format
      const mappedShop: Shop = {
        id: response.id,
        name: response.shop_name,
        description: response.description,
        contact_phone: response.phone || '',
        whatsapp_phone: response.whatsapp_number || '',
        address: response.address || '',
        avatar: response.avatar_url,
        status: response.status,
        is_approved: response.is_approved,
        is_active: response.is_active,
        rejection_reason: response.rejection_reason,
        deactivation_reason: response.deactivation_reason,
      };

      // Update shop in auth store
      updateShop(response as any);
      setShopData(mappedShop);

      // Show appropriate success message
      toast.success('Информация о магазине сохранена');

      // If was just approved, redirect to dashboard
      const wasJustApproved = !shopData?.is_approved && response.is_approved;
      if (wasJustApproved && response.is_active) {
        toast.success('Ваш магазин одобрен! Переход в панель управления...');
        setTimeout(() => navigate(ROUTES.SHOP.DASHBOARD), 1500);
      }
    } catch (error: any) {
      logger.error('Failed to save shop', error);
      toast.error(error.message || 'Не удалось сохранить информацию о магазине');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Submit shop for moderation
   * This function is called by the "Submit for Review" button
   * It uses handleSubmit to validate and save the form first, then submits for review
   */
  const onSubmitForReview = handleSubmit(async (data: ShopFormData) => {
    setIsSaving(true);
    try {
      // Step 1: Save the form data first (upload avatar if needed)
      let avatarUrl = shopData?.avatar;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);

        const uploadResponse = await apiRequest<{ url: string }>(
          API_ENDPOINTS.SHOPS.UPLOAD_AVATAR,
          'POST',
          formData
        );
        avatarUrl = uploadResponse.url;
      }

      // Save shop data
      const payload = {
        shop_name: data.name,
        description: data.description,
        phone: data.contact_phone,
        whatsapp_number: data.whatsapp_phone,
        address: data.address,
        avatar_url: avatarUrl,
      };

      await apiRequest<any>(
        API_ENDPOINTS.SHOPS.UPDATE_ME,
        'PUT',
        payload
      );

      // Step 2: Now submit for review
      const response = await apiRequest<any>(
        `${API_ENDPOINTS.SHOPS.ME}/submit`,
        'POST'
      );

      // Map backend response to frontend format
      const mappedShop: Shop = {
        id: response.id,
        name: response.shop_name,
        description: response.description,
        contact_phone: response.phone || '',
        whatsapp_phone: response.whatsapp_number || '',
        address: response.address || '',
        avatar: response.avatar_url,
        status: response.status,
        is_approved: response.is_approved,
        is_active: response.is_active,
        rejection_reason: response.rejection_reason,
        deactivation_reason: response.deactivation_reason,
      };

      // Update shop in auth store
      updateShop(response as any);
      setShopData(mappedShop);

      toast.success('Заявка отправлена на модерацию! Администратор рассмотрит её в течение 1-2 дней.');
    } catch (error: any) {
      logger.error('Failed to submit shop', error);
      toast.error(error.message || 'Не удалось отправить заявку на модерацию');
    } finally {
      setIsSaving(false);
    }
  });

  /**
   * Get status badge variant
   */
  const getStatusVariant = (status: ShopStatus) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'deactivated':
        return 'default';
      default:
        return 'default';
    }
  };

  /**
   * Get status message
   */
  const getStatusMessage = (status: ShopStatus, shop?: Shop) => {
    switch (status) {
      case 'draft':
        return 'Заполните информацию о магазине и нажмите "Отправить на модерацию" для проверки администратором.';
      case 'pending':
        return 'Ваша заявка на рассмотрении у администратора. Редактирование заблокировано до получения ответа. Это может занять 1-2 дня.';
      case 'approved':
        return 'Ваш магазин одобрен и активен! Вы можете управлять товарами и заказами.';
      case 'rejected':
        return 'Ваша заявка была отклонена. Пожалуйста, ознакомьтесь с причиной ниже, исправьте данные и отправьте заявку повторно.';
      case 'deactivated':
        return shop?.deactivation_reason
          ? `Ваш магазин деактивирован. Причина: ${shop.deactivation_reason}. Обратитесь к администратору для получения дополнительной информации.`
          : 'Ваш магазин был деактивирован. Обратитесь к администратору для получения дополнительной информации.';
      default:
        return '';
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status: ShopStatus) => {
    switch (status) {
      case 'draft':
        return AlertCircle;
      case 'pending':
        return Clock;
      case 'approved':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      case 'deactivated':
        return Ban;
      default:
        return AlertCircle;
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <Store className="w-8 h-8 text-purple-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              {shopData ? 'Редактировать информацию магазина' : 'Регистрация магазина'}
            </h1>
          </div>
          <p className="text-gray-600">
            {shopData
              ? 'Обновите информацию и настройки вашего магазина'
              : 'Заполните информацию о вашем магазине для начала работы на платформе'}
          </p>
        </div>

        {/* Status Card */}
        {shopData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 mr-3">Статус:</span>
                  <StatusBadge
                    status={shopData.status}
                    variant={getStatusVariant(shopData.status)}
                  />
                </div>
                <p className="text-sm text-gray-600 mb-3">{getStatusMessage(shopData.status, shopData)}</p>

                {/* Pending Message */}
                {shopData.status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900 mb-1">
                        Заявка на рассмотрении
                      </p>
                      <p className="text-sm text-yellow-800">
                        Спасибо за регистрацию! Администратор рассмотрит вашу заявку в течение 1-2 дней.
                        Вы получите уведомление на email, когда магазин будет одобрен.
                      </p>
                      <p className="text-sm text-yellow-800 mt-2 font-medium">
                        ⚠️ Редактирование заявки заблокировано до получения ответа.
                      </p>
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {shopData.status === 'rejected' && shopData.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900 mb-1">Причина отклонения:</p>
                      <p className="text-sm text-red-800 mb-3">{shopData.rejection_reason}</p>
                      <p className="text-sm text-red-900 font-medium">
                        ✏️ Исправьте данные ниже и нажмите "Отправить повторно"
                      </p>
                    </div>
                  </div>
                )}

                {/* Deactivated Message */}
                {shopData.status === 'deactivated' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start space-x-3">
                    <Ban className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-900 mb-1">
                        Магазин деактивирован
                      </p>
                      {shopData.deactivation_reason && (
                        <p className="text-sm text-orange-800 mb-2">
                          <span className="font-medium">Причина:</span> {shopData.deactivation_reason}
                        </p>
                      )}
                      <p className="text-sm text-orange-800">
                        📧 Свяжитесь с администратором для получения дополнительной информации.
                      </p>
                    </div>
                  </div>
                )}

                {/* Approved Message */}
                {shopData.status === 'approved' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        ✅ Ваш магазин активен и готов к работе!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Логотип магазина
              </label>
              <ImageUploadSingle
                value={avatarPreview}
                onChange={handleAvatarChange}
                maxSize={5 * 1024 * 1024}
                shape="square"
                disabled={shopData?.status === 'pending' || shopData?.status === 'deactivated' || shopData?.status === 'approved'}
              />
              <p className="mt-2 text-xs text-gray-500">
                Рекомендуется: квадратное изображение, минимум 400x400px, максимум 5МБ
              </p>
            </div>

            {/* Shop Name */}
            <FormInput
              label="Название магазина"
              {...register('name')}
              error={errors.name?.message}
              placeholder="Введите название вашего магазина"
              required
              disabled={shopData?.status === 'pending' || shopData?.status === 'deactivated' || shopData?.status === 'approved'}
            />

            {/* Description */}
            <FormTextarea
              label="Описание"
              {...register('description')}
              error={errors.description?.message}
              placeholder="Опишите ваш магазин, товары и что делает вас уникальными"
              rows={4}
              required
              disabled={shopData?.status === 'pending' || shopData?.status === 'deactivated' || shopData?.status === 'approved'}
            />

            {/* Contact Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Контактный телефон <span className="text-red-500">*</span>
              </label>
              <PhoneInput
                value={shopData?.contact_phone || ''}
                onChange={(value) => setValue('contact_phone', value)}
                error={errors.contact_phone?.message}
                disabled={shopData?.status === 'pending' || shopData?.status === 'deactivated' || shopData?.status === 'approved'}
              />
            </div>

            {/* WhatsApp Phone (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Телефон WhatsApp (опционально)
              </label>
              <PhoneInput
                value={shopData?.whatsapp_phone || ''}
                onChange={(value) => setValue('whatsapp_phone', value)}
                error={errors.whatsapp_phone?.message}
                disabled={shopData?.status === 'pending' || shopData?.status === 'deactivated' || shopData?.status === 'approved'}
              />
              <p className="mt-1 text-xs text-gray-500">
                Если отличается от контактного телефона
              </p>
            </div>

            {/* Address */}
            <FormTextarea
              label="Адрес"
              {...register('address')}
              error={errors.address?.message}
              placeholder="Введите физический адрес вашего магазина"
              rows={2}
              required
              disabled={shopData?.status === 'pending' || shopData?.status === 'deactivated' || shopData?.status === 'approved'}
            />

            {/* Submit Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(ROUTES.SHOP.DASHBOARD)}
                disabled={isSaving}
              >
                Отмена
              </Button>
              <div className="flex gap-3">
                {/* Save draft button (for draft and rejected statuses) */}
                {(shopData?.status === 'draft' || shopData?.status === 'rejected') && (
                  <Button
                    type="submit"
                    variant="outline"
                    isLoading={isSaving}
                    disabled={isSaving}
                  >
                    Сохранить черновик
                  </Button>
                )}

                {/* Submit for review button (for draft and rejected statuses) */}
                {(shopData?.status === 'draft' || shopData?.status === 'rejected') && (
                  <Button
                    type="button"
                    variant="primary"
                    isLoading={isSaving}
                    disabled={isSaving}
                    onClick={onSubmitForReview}
                  >
                    {shopData?.status === 'rejected' ? 'Отправить повторно' : 'Отправить на модерацию'}
                  </Button>
                )}

                {/* Update button for approved shops */}
                {shopData?.status === 'approved' && (
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSaving}
                    disabled={isSaving}
                  >
                    Обновить информацию
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShopRegistrationPage;
