import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef, type Row } from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, Trash2, FolderOpen } from 'lucide-react';
import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { DataTable } from '@/shared/components/ui/DataTable';
import { Button } from '@/shared/components/ui/Button';
import { FormModal } from '@/shared/components/ui/FormModal';
import { FormInput } from '@/shared/components/forms/FormInput';
import { FormTextarea } from '@/shared/components/forms/FormTextarea';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { formatDate } from '@/shared/lib/utils';
import { categorySchema, type CategoryFormData } from '@/shared/lib/validation/schemas';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  products_count: number;
  created_at: string;
  updated_at: string;
}

function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);

  // Fetch categories
  const { data: categoriesData, isLoading } = useQuery<{ categories: Category[]; total: number }>({
    queryKey: ['admin-categories'],
    queryFn: () => apiRequest<{ categories: Category[]; total: number }>(API_ENDPOINTS.CATEGORIES.LIST),
  });

  const categories = categoriesData?.categories || [];

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    values: editingCategory
      ? {
          name: editingCategory.name,
          slug: editingCategory.slug || '',
          description: editingCategory.description || '',
        }
      : undefined,
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) =>
      apiRequest(API_ENDPOINTS.CATEGORIES.CREATE, 'POST', data),
    onMutate: async (newCategory) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-categories'] });

      // Snapshot previous data
      const previousCategories = queryClient.getQueryData<Category[]>(['admin-categories']);

      // Optimistically add new category
      if (previousCategories) {
        const optimisticCategory: Category = {
          id: Date.now(), // Temporary ID
          name: newCategory.name,
          description: newCategory.description,
          products_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        queryClient.setQueryData<Category[]>(
          ['admin-categories'],
          [...previousCategories, optimisticCategory]
        );
      }

      return { previousCategories };
    },
    onSuccess: () => {
      toast.success('Category created successfully');
      setIsCreateModalOpen(false);
      reset();
    },
    onError: (_error, _variables, context) => {
      toast.error('Failed to create category');
      // Rollback to previous data
      if (context?.previousCategories) {
        queryClient.setQueryData(['admin-categories'], context.previousCategories);
      }
    },
    onSettled: () => {
      // Refetch to get real data from server
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: (data: CategoryFormData) =>
      apiRequest(
        API_ENDPOINTS.CATEGORIES.UPDATE(editingCategory!.id),
        'PUT',
        data
      ),
    onMutate: async (updatedData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-categories'] });

      // Snapshot previous data
      const previousCategories = queryClient.getQueryData<Category[]>(['admin-categories']);

      // Optimistically update category
      if (previousCategories && editingCategory) {
        queryClient.setQueryData<Category[]>(
          ['admin-categories'],
          previousCategories.map((cat) =>
            cat.id === editingCategory.id
              ? {
                  ...cat,
                  name: updatedData.name,
                  description: updatedData.description,
                  updated_at: new Date().toISOString(),
                }
              : cat
          )
        );
      }

      return { previousCategories };
    },
    onSuccess: () => {
      toast.success('Category updated successfully');
      setEditingCategory(null);
      reset();
    },
    onError: (_error, _variables, context) => {
      toast.error('Failed to update category');
      // Rollback to previous data
      if (context?.previousCategories) {
        queryClient.setQueryData(['admin-categories'], context.previousCategories);
      }
    },
    onSettled: () => {
      // Refetch to get real data from server
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(API_ENDPOINTS.CATEGORIES.DELETE(id), 'DELETE'),
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-categories'] });

      // Snapshot previous data
      const previousCategories = queryClient.getQueryData<Category[]>(['admin-categories']);

      // Optimistically remove category
      if (previousCategories) {
        queryClient.setQueryData<Category[]>(
          ['admin-categories'],
          previousCategories.filter((cat) => cat.id !== deletedId)
        );
      }

      return { previousCategories };
    },
    onSuccess: () => {
      toast.success('Category deleted successfully');
      setDeletingCategoryId(null);
    },
    onError: (_error, _variables, context) => {
      toast.error('Failed to delete category');
      // Rollback to previous data
      if (context?.previousCategories) {
        queryClient.setQueryData(['admin-categories'], context.previousCategories);
      }
    },
    onSettled: () => {
      // Refetch to get real data from server
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingCategory(null);
    reset();
  };

  const columns: ColumnDef<Category>[] = [
    {
      header: 'Name',
      accessorKey: 'name',
      cell: ({ row }: { row: Row<Category> }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{row.original.name}</div>
            {row.original.description && (
              <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                {row.original.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Products',
      accessorKey: 'products_count',
      cell: ({ row }: { row: Row<Category> }) => (
        <span className="text-gray-900 dark:text-white">{row.original.products_count || 0}</span>
      ),
    },
    {
      header: 'Created',
      accessorKey: 'created_at',
      cell: ({ row }: { row: Row<Category> }) => formatDate(row.original.created_at),
    },
    {
      header: 'Last Updated',
      accessorKey: 'updated_at',
      cell: ({ row }: { row: Row<Category> }) => formatDate(row.original.updated_at),
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: ({ row }: { row: Row<Category> }) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(row.original)}
            aria-label={`Edit category ${row.original.name}`}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeletingCategoryId(row.original.id)}
            className="text-red-600 hover:text-red-700"
            aria-label={`Delete category ${row.original.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Categories Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage product categories for the platform
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {categories?.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="w-12 h-12 text-gray-400" />}
            title="No categories yet"
            message="Create your first category to organize products"
            action={{
              label: 'Add Category',
              onClick: () => setIsCreateModalOpen(true)
            }}
          />
        ) : (
          <DataTable columns={columns} data={categories || []} loading={isLoading} />
        )}
      </div>

      {/* Create/Edit Modal */}
      <FormModal
        isOpen={isCreateModalOpen || editingCategory !== null}
        onClose={handleCloseModal}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            label="Category Name"
            placeholder="e.g., Dresses, Shoes, Accessories"
            {...register('name')}
            error={errors.name?.message}
          />
          <FormInput
            label="Slug"
            placeholder="e.g., dresses, shoes, accessories"
            {...register('slug')}
            error={errors.slug?.message}
            helperText="Lowercase letters, numbers, and hyphens only"
          />
          <FormTextarea
            label="Description (Optional)"
            placeholder="Brief description of this category"
            rows={3}
            {...register('description')}
            error={errors.description?.message}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Delete Confirmation */}
      {deletingCategoryId !== null && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeletingCategoryId(null)}
          onConfirm={() => deleteMutation.mutate(deletingCategoryId)}
          title="Delete Category"
          message="Are you sure you want to delete this category? This action cannot be undone. Products in this category will become uncategorized."
          confirmText="Delete"
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
};
export default AdminCategoriesPage;
