import { useState } from "react";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaSave,
  FaTimes,
  FaBoxOpen,
} from "react-icons/fa";
import { Modal, ModalBody, ModalHeader } from "flowbite-react";
import {
  useCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "../../redux/api/api";
import { FormField } from "../../ui/forms/FormField";
import EmptyState from "../../components/shared/EmptyState";
import {
  categoryNameSchema,
  type CategoryNameValues,
} from "../../ui/forms/schemas";
import { useZodForm } from "../../ui/forms/useZodForm";
import { PupInput } from "../../ui/PupInput";
import { PupButton } from "../../ui/PupButton";
import { formatDate } from "../../utils/formatDate";

interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const CategoriesManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );

  const addForm = useZodForm<typeof categoryNameSchema, CategoryNameValues>(
    categoryNameSchema,
    { defaultValues: { name: "" } }
  );

  const editForm = useZodForm<typeof categoryNameSchema, CategoryNameValues>(
    categoryNameSchema,
    { defaultValues: { name: "" } }
  );

  const { data: categoriesData, isLoading } = useCategoryQuery(undefined);
  const [createCategory, { isLoading: isCreating }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] =
    useDeleteCategoryMutation();

  const categories: Category[] = categoriesData?.data || [];

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    editForm.reset({ name: category.name });
  };

  const handleSave = editForm.handleSubmit(async (data: CategoryNameValues) => {
    if (!editingId) return;
    try {
      await updateCategory({
        id: editingId,
        data: { name: data.name.trim() },
      }).unwrap();
      setEditingId(null);
      editForm.reset({ name: "" });
    } catch {
    }
  });

  const handleCancel = () => {
    setEditingId(null);
    editForm.reset({ name: "" });
  };

  const handleAdd = addForm.handleSubmit(async (data: CategoryNameValues) => {
    try {
      await createCategory({ name: data.name.trim() }).unwrap();
      addForm.reset({ name: "" });
      setShowAddForm(false);
    } catch {
    }
  });

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete.id).unwrap();
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch {
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent">
            Category Management
          </h1>
          <p className="text-gray-400 mt-1">
            Manage item categories and classifications
          </p>
        </div>
        <PupButton
          type="button"
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2"
        >
          <FaPlus className="mr-2" aria-hidden />
          Add Category
        </PupButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Categories</p>
              <p className="text-2xl font-bold text-white">
                {categories.length}
              </p>
            </div>
            <div className="bg-red-900/40 p-3 rounded-lg border border-red-700/30">
              <FaBoxOpen className="text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Recently Added</p>
              <p className="text-2xl font-bold text-green-500">
                {
                  categories.filter((cat) => {
                    const createdDate = new Date(cat.createdAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return createdDate > weekAgo;
                  }).length
                }
              </p>
            </div>
            <div className="bg-yellow-900/40 p-3 rounded-lg border border-yellow-700/30">
              <FaBoxOpen className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold gold-text mb-4">
            Add New Category
          </h3>
          <form
            onSubmit={handleAdd}
            className="flex flex-col gap-4 md:flex-row md:items-start"
            noValidate
          >
            <div className="flex-1 w-full">
              <FormField<CategoryNameValues>
                name="name"
                label="Category name"
                errors={addForm.formState.errors}
                required
              >
                {({ id, hasError, ariaDescribedBy }) => (
                  <PupInput
                    id={id}
                    type="text"
                    placeholder="e.g. Electronics, IDs, Apparel"
                    disabled={isCreating}
                    {...addForm.register("name")}
                    hasError={hasError}
                    ariaDescribedBy={ariaDescribedBy}
                    aria-required="true"
                  />
                )}
              </FormField>
            </div>
            <div className="flex shrink-0 gap-2 pt-7 md:pt-0">
              <PupButton
                type="submit"
                disabled={isCreating}
                className="inline-flex items-center gap-2 px-4 py-2"
              >
                <FaSave aria-hidden />
                {isCreating ? "Adding..." : "Add"}
              </PupButton>
              <PupButton
                type="button"
                variant="ghost"
                disabled={isCreating}
                onClick={() => {
                  setShowAddForm(false);
                  addForm.reset({ name: "" });
                }}
                className="inline-flex items-center gap-2 px-4 py-2"
              >
                <FaTimes aria-hidden />
                Cancel
              </PupButton>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="glass-card rounded-xl p-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <PupInput
            type="search"
            aria-label="Search categories"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/70 border-b border-yellow-700/15">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Category Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Created At
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Updated At
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredCategories.map((category) => (
                <tr
                  key={category.id}
                  className="hover:bg-yellow-900/10 transition-colors"
                >
                  <td className="px-6 py-4">
                    {editingId === category.id ? (
                      <div className="space-y-1">
                        <PupInput
                          type="text"
                          aria-label="Edit category name"
                          aria-invalid={
                            editForm.formState.errors.name ? true : undefined
                          }
                          disabled={isUpdating}
                          {...editForm.register("name")}
                          hasError={Boolean(editForm.formState.errors.name)}
                          className="py-2"
                        />
                        {editForm.formState.errors.name?.message && (
                          <p className="text-xs text-red-400" role="alert">
                            {String(editForm.formState.errors.name.message)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="font-medium text-white">
                        {category.name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {formatDate(category.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {formatDate(category.updatedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {editingId === category.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleSave()}
                            disabled={isUpdating}
                            className="p-2 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                            aria-label="Save category name"
                          >
                            <FaSave aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isUpdating}
                            className="p-2 text-gray-500 hover:bg-gray-500 hover:text-white rounded-lg transition-colors"
                            aria-label="Cancel editing"
                          >
                            <FaTimes aria-hidden />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEdit(category)}
                            className="p-2 text-yellow-500 hover:bg-yellow-500 hover:text-white rounded-lg transition-colors"
                            aria-label={`Edit ${category.name}`}
                          >
                            <FaEdit aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(category)}
                            className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                            aria-label={`Delete ${category.name}`}
                          >
                            <FaTrash aria-hidden />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCategories.length === 0 && (
          <EmptyState
            icon={<FaBoxOpen className="w-full h-full" />}
            title="No Categories Found"
            description={
              searchTerm
                ? "No categories match your search criteria. Try adjusting your search terms."
                : "No categories have been created yet. Categories will appear here when you add them."
            }
            action={
              searchTerm ? (
                <button
                  onClick={() => setSearchTerm("")}
                  className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Clear Search
                </button>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <FaPlus className="mr-2" />
                  Add Category
                </button>
              )
            }
          />
        )}
      </div>

      <Modal
        show={showDeleteModal}
        size="md"
        popup
        onClose={handleCancelDelete}
      >
        <div className="glass-card rounded-xl to-gray-900">
          <ModalHeader className="border-b border-gray-700">
            <span className="text-lg font-medium text-white">
              Delete category
            </span>
          </ModalHeader>
          <ModalBody className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-900/40 border border-red-700/50">
                <FaTrash className="h-5 w-5 text-red-400" aria-hidden />
              </div>
              <p className="text-sm text-gray-300">
                Delete{" "}
                <span className="font-semibold text-white">
                  {categoryToDelete?.name}
                </span>
                ? This cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <PupButton
                type="button"
                variant="ghost"
                disabled={isDeleting}
                onClick={handleCancelDelete}
                className="min-w-[6rem]"
              >
                Cancel
              </PupButton>
              <PupButton
                type="button"
                variant="danger"
                disabled={isDeleting}
                onClick={() => void handleConfirmDelete()}
                className="min-w-[6rem]"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </PupButton>
            </div>
          </ModalBody>
        </div>
      </Modal>
    </div>
  );
};

export default CategoriesManagement;
