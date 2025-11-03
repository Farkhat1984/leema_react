import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Settings as SettingsIcon, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { apiClient } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { Button } from '@/shared/components/ui/Button';
import { PageLoader } from '@/shared/components/feedback/PageLoader';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { FormModal } from '@/shared/components/ui/FormModal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Types
interface Setting {
  id: number;
  key: string;
  value: string;
  description: string;
  is_system: boolean;
  updated_at: string;
}

// Validation schemas
const addSettingSchema = z.object({
  key: z.string().min(1, 'Key is required').regex(/^[a-z0-9_]+$/, 'Key must be lowercase alphanumeric with underscores'),
  value: z.string().min(1, 'Value is required'),
  description: z.string().optional(),
});

type AddSettingFormData = z.infer<typeof addSettingSchema>;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<Setting | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Fetch settings
  const { data: settings, isLoading } = useQuery<Setting[]>({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.ADMIN.SETTINGS);
      return response.data;
    },
  });

  // Update setting mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, value }: { id: number; value: string }) => {
      const response = await apiClient.put(API_ENDPOINTS.ADMIN.SETTING_UPDATE(String(id)), { value });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Setting updated successfully');
      setEditingId(null);
      setEditValue('');
    },
    onError: () => {
      toast.error('Failed to update setting');
    },
  });

  // Delete setting mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(API_ENDPOINTS.ADMIN.SETTING_DELETE(String(id)));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Setting deleted successfully');
      setDeleteDialogOpen(false);
      setSettingToDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete setting');
    },
  });

  // Add setting mutation
  const addMutation = useMutation({
    mutationFn: async (data: AddSettingFormData) => {
      const response = await apiClient.post(API_ENDPOINTS.ADMIN.SETTINGS, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Setting created successfully');
      setAddModalOpen(false);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create setting';
      toast.error(message);
    },
  });

  // Form for adding setting
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddSettingFormData>({
    resolver: zodResolver(addSettingSchema),
  });

  const handleEdit = (setting: Setting) => {
    setEditingId(setting.id);
    setEditValue(setting.value);
  };

  const handleSave = (id: number) => {
    if (editValue.trim()) {
      updateMutation.mutate({ id, value: editValue.trim() });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleDeleteClick = (setting: Setting) => {
    setSettingToDelete(setting);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (settingToDelete) {
      deleteMutation.mutate(settingToDelete.id);
    }
  };

  const onAddSubmit = (data: AddSettingFormData) => {
    addMutation.mutate(data);
  };

  const handleAddModalClose = () => {
    setAddModalOpen(false);
    reset();
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="w-7 h-7" />
            Platform Settings
          </h1>
          <p className="text-gray-600 mt-1">Manage system configuration and settings</p>
        </div>
        <Button onClick={() => setAddModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Setting
        </Button>
      </div>

      {/* Settings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Setting Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {settings?.map((setting) => (
                <tr key={setting.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{setting.key}</span>
                      {setting.is_system && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          System
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === setting.id ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{setting.value}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{setting.description || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {new Date(setting.updated_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {editingId === setting.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(setting.id)}
                          isLoading={updateMutation.isPending}
                          className="flex items-center gap-1"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </Button>
                        <Button size="sm" variant="secondary" onClick={handleCancel}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(setting)}
                          className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!setting.is_system && (
                          <button
                            onClick={() => handleDeleteClick(setting)}
                            className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty State */}
          {settings?.length === 0 && (
            <div className="text-center py-12">
              <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No settings found</p>
              <Button onClick={() => setAddModalOpen(true)} className="mt-4">
                Add First Setting
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Setting"
        message={`Are you sure you want to delete the setting "${settingToDelete?.key}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Add Setting Modal */}
      <FormModal
        isOpen={addModalOpen}
        onClose={handleAddModalClose}
        title="Add New Setting"
        onSubmit={handleSubmit(onAddSubmit)}
        submitText="Create Setting"
        isSubmitting={isSubmitting || addMutation.isPending}
        size="md"
      >
        <div className="space-y-4">
          {/* Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Setting Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('key')}
              placeholder="e.g., newsletter_min_frequency_days"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.key && <p className="text-red-500 text-sm mt-1">{errors.key.message}</p>}
            <p className="text-gray-500 text-xs mt-1">
              Use lowercase letters, numbers, and underscores only
            </p>
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('value')}
              placeholder="e.g., 7"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.value && <p className="text-red-500 text-sm mt-1">{errors.value.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              placeholder="Optional description of what this setting controls"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>
        </div>
      </FormModal>
    </div>
  );
}
