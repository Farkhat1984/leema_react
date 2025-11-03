import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  FileSpreadsheet,
  Phone,
  MessageSquare,
  Check,
  X,
} from 'lucide-react'
import { DataTable } from '@/shared/components/ui/DataTable'
import { Button } from '@/shared/components/ui/Button'
import { SearchInput } from '@/shared/components/ui/SearchInput'
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog'
import { useDebounce } from '@/shared/hooks'
import { contactsService } from '../services/contacts.service'
import { ContactFormModal } from './ContactFormModal'
import { ContactsImportModal } from './ContactsImportModal'
import type { Contact } from '../types/newsletter.types'
import type { ContactFormData } from '../lib/validation'
import toast from 'react-hot-toast'

export function ContactsTab() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // Row selection state
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const selectedIds = Object.keys(rowSelection).map((id) => parseInt(id))

  // Fetch contacts
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['contacts', page, debouncedSearch],
    queryFn: () =>
      contactsService.getContacts({
        page,
        per_page: 20,
        search: debouncedSearch,
      }),
  })

  // Create contact mutation
  const createMutation = useMutation({
    mutationFn: (data: ContactFormData) => contactsService.createContact(data),
    onSuccess: () => {
      toast.success('Contact added successfully')
      setIsAddModalOpen(false)
      refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add contact')
    },
  })

  // Update contact mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ContactFormData }) =>
      contactsService.updateContact(id, { ...data, id }),
    onSuccess: () => {
      toast.success('Contact updated successfully')
      setEditingContact(null)
      refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update contact')
    },
  })

  // Delete contact mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => contactsService.deleteContact(id),
    onSuccess: () => {
      toast.success('Contact deleted successfully')
      setDeletingContact(null)
      refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete contact')
    },
  })

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => contactsService.bulkDeleteContacts(ids),
    onSuccess: () => {
      toast.success(`${selectedIds.length} contacts deleted successfully`)
      setRowSelection({})
      refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete contacts')
    },
  })

  // Import contacts mutation
  const importMutation = useMutation({
    mutationFn: (file: File) => contactsService.importFromExcel(file),
  })

  // Export contacts
  const handleExport = async () => {
    try {
      const blob = await contactsService.exportToExcel()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contacts_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Contacts exported successfully')
    } catch (error) {
      toast.error('Failed to export contacts')
    }
  }

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      const blob = await contactsService.downloadTemplate()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'contacts_template.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Template downloaded successfully')
    } catch (error) {
      toast.error('Failed to download template')
    }
  }

  // Table columns
  const columns: ColumnDef<Contact>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-medium text-gray-900">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-gray-700">
          <Phone className="w-4 h-4 text-gray-400" />
          {row.original.phone}
        </div>
      ),
    },
    {
      accessorKey: 'has_whatsapp',
      header: 'WhatsApp',
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          {row.original.has_whatsapp ? (
            <div className="flex items-center gap-1 text-green-600">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Yes</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-400">
              <X className="w-4 h-4" />
              <span className="text-sm">No</span>
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Added Date',
      cell: ({ row }) => (
        <div className="text-gray-600 text-sm">
          {new Date(row.original.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingContact(row.original)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingContact(row.original)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search contacts..."
          className="w-full sm:w-80"
        />

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Template
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!data?.data || !Array.isArray(data.data) || data.data.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedIds.length} contact{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <Button
            variant="danger"
            size="sm"
            onClick={() => bulkDeleteMutation.mutate(selectedIds)}
            isLoading={isLoading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={Array.isArray(data?.data) ? data.data : []}
        loading={isLoading}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={(row) => row.id.toString()}
        pageSize={20}
        pageIndex={page - 1}
        pageCount={data?.total_pages || 0}
        totalRows={data?.total || 0}
        onPaginationChange={(pageIndex) => setPage(pageIndex + 1)}
        manualPagination
        emptyMessage="No contacts found. Add your first contact!"
      />

      {/* Add/Edit Modal */}
      {(isAddModalOpen || editingContact) && (
        <ContactFormModal
          isOpen={isAddModalOpen || !!editingContact}
          onClose={() => {
            setIsAddModalOpen(false)
            setEditingContact(null)
          }}
          onSubmit={async (data) => {
            if (editingContact) {
              await updateMutation.mutateAsync({ id: editingContact.id, data })
            } else {
              await createMutation.mutateAsync(data)
            }
          }}
          contact={editingContact || undefined}
        />
      )}

      {/* Import Modal */}
      <ContactsImportModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false)
          refetch()
        }}
        onImport={importMutation.mutateAsync}
        onDownloadTemplate={handleDownloadTemplate}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingContact}
        onClose={() => setDeletingContact(null)}
        onConfirm={() => {
          if (deletingContact) {
            deleteMutation.mutate(deletingContact.id);
          }
        }}
        title="Delete Contact"
        description={`Are you sure you want to delete "${deletingContact?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
