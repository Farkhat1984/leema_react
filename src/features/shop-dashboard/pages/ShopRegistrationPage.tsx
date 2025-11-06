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
import { AlertCircle, Store, CheckCircle } from 'lucide-react';

// Validation schema
const shopSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  contact_phone: z.string().min(10, 'Please enter a valid phone number'),
  whatsapp_phone: z.string().optional(),
  address: z.string().min(5, 'Please enter a valid address'),
});

type ShopFormData = z.infer<typeof shopSchema>;

type ShopStatus = 'pending' | 'approved' | 'rejected' | 'deactivated';

interface Shop {
  id: number;
  name: string;
  description: string;
  contact_phone: string;
  whatsapp_phone?: string;
  address: string;
  avatar?: string;
  status: ShopStatus;
  rejection_reason?: string;
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
        const response = await apiRequest<Shop>(API_ENDPOINTS.SHOPS.ME);
        setShopData(response);

        // Pre-fill form with existing data
        reset({
          name: response.name,
          description: response.description,
          contact_phone: response.contact_phone,
          whatsapp_phone: response.whatsapp_phone || '',
          address: response.address,
        });

        if (response.avatar) {
          setAvatarPreview(response.avatar);
        }
      }
    } catch (error: any) {
      // 404 = shop doesn't exist yet (new registration)
      // 403 = shop not approved/active (expected on registration page)
      // Only show error for other status codes
      const status = error.response?.status;
      if (status !== 404 && status !== 403) {
        logger.error('Failed to load shop data', error);
        toast.error('Failed to load shop information');
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
   * Submit registration form
   */
  const onSubmit = async (data: ShopFormData) => {
    setIsSaving(true);
    try {
      // Upload avatar if changed
      let avatarUrl = shopData?.avatar;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        const uploadResponse = await apiRequest<{ url: string }>(
          API_ENDPOINTS.SHOPS.UPLOAD_AVATAR,
          'POST',
          formData
        );
        avatarUrl = uploadResponse.url;
      }

      // Update or create shop
      const payload = {
        ...data,
        avatar: avatarUrl,
      };

      const response = await apiRequest<Shop>(
        API_ENDPOINTS.SHOPS.UPDATE_ME,
        'PUT',
        payload
      );

      // Update shop in auth store
      updateShop(response as any);
      setShopData(response);

      toast.success(
        shopData
          ? 'Shop information updated successfully'
          : 'Shop registration submitted for approval'
      );

      // If approved and active, redirect to dashboard
      if (response.is_approved && response.is_active) {
        setTimeout(() => navigate(ROUTES.SHOP.DASHBOARD), 1500);
      }
    } catch (error: any) {
      logger.error('Failed to save shop', error);
      toast.error(error.message || 'Failed to save shop information');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Get status badge variant
   */
  const getStatusVariant = (status: ShopStatus) => {
    switch (status) {
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
  const getStatusMessage = (status: ShopStatus) => {
    switch (status) {
      case 'pending':
        return 'Your shop registration is pending approval from our admin team.';
      case 'approved':
        return 'Your shop has been approved and is active!';
      case 'rejected':
        return 'Your shop registration was rejected. Please review the reason below and resubmit.';
      case 'deactivated':
        return 'Your shop has been deactivated. Contact support for more information.';
      default:
        return '';
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
              {shopData ? 'Edit Shop Information' : 'Register Your Shop'}
            </h1>
          </div>
          <p className="text-gray-600">
            {shopData
              ? 'Update your shop details and settings'
              : 'Fill in your shop information to get started on the platform'}
          </p>
        </div>

        {/* Status Card */}
        {shopData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 mr-3">Status:</span>
                  <StatusBadge
                    status={shopData.status}
                    variant={getStatusVariant(shopData.status)}
                  />
                </div>
                <p className="text-sm text-gray-600 mb-3">{getStatusMessage(shopData.status)}</p>

                {/* Rejection Reason */}
                {shopData.status === 'rejected' && shopData.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-800">{shopData.rejection_reason}</p>
                    </div>
                  </div>
                )}

                {/* Approved Message */}
                {shopData.status === 'approved' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Your shop is live and ready to sell!
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
                Shop Avatar
              </label>
              <ImageUploadSingle
                value={avatarPreview}
                onChange={handleAvatarChange}
                maxSize={5}
                shape="square"
              />
              <p className="mt-2 text-xs text-gray-500">
                Recommended: Square image, minimum 400x400px, max 5MB
              </p>
            </div>

            {/* Shop Name */}
            <FormInput
              label="Shop Name"
              {...register('name')}
              error={errors.name?.message}
              placeholder="Enter your shop name"
              required
            />

            {/* Description */}
            <FormTextarea
              label="Description"
              {...register('description')}
              error={errors.description?.message}
              placeholder="Describe your shop, products, and what makes you unique"
              rows={4}
              required
            />

            {/* Contact Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <PhoneInput
                value={shopData?.contact_phone || ''}
                onChange={(value) => setValue('contact_phone', value)}
                error={errors.contact_phone?.message}
              />
            </div>

            {/* WhatsApp Phone (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Phone (Optional)
              </label>
              <PhoneInput
                value={shopData?.whatsapp_phone || ''}
                onChange={(value) => setValue('whatsapp_phone', value)}
                error={errors.whatsapp_phone?.message}
              />
              <p className="mt-1 text-xs text-gray-500">
                If different from contact phone
              </p>
            </div>

            {/* Address */}
            <FormTextarea
              label="Address"
              {...register('address')}
              error={errors.address?.message}
              placeholder="Enter your shop's physical address"
              rows={2}
              required
            />

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(ROUTES.SHOP.DASHBOARD)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
                disabled={isSaving}
              >
                {shopData ? 'Update Shop' : 'Submit for Approval'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShopRegistrationPage;
