"use client";
import { Spinner, Modal, ModalHeader, ModalBody } from "flowbite-react";
import {
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
} from "react-icons/fa";
import img from "../../assets/3576506_65968.jpg";
import {
  useDeleteMyLostItemMutation,
  useEditMyLostItemMutation,
  useGetMyLostItemQuery,
} from "../../redux/api/api";
import { useState } from "react";
import { PupButton } from "../../ui/PupButton";
import { PupInput } from "../../ui/PupInput";
import { FormField } from "../../ui/forms/FormField";
import {
  editLostItemSchema,
  type EditLostItemValues,
} from "../../ui/forms/schemas";
import { useZodForm } from "../../ui/forms/useZodForm";
import { formatDate } from "../../utils/formatDate";
import { useFocusTrap } from "../../hooks/useFocusTrap";

const MyLostItems = () => {
  const { data: myLostItems, isLoading } = useGetMyLostItemQuery({});
  const [deleteMyLostItem] = useDeleteMyLostItemMutation();
  const [isOpen, setIsOpen] = useState(false);
  const [currId, setCurrId]: any = useState();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete]: any = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const editModalRef = useFocusTrap(isOpen);

  const handleDeleteClick = (item: any) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      await deleteMyLostItem(itemToDelete.id);
    } catch {
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
    setIsDeleting(false);
  };

  const [editMyLostItem, { isLoading: isEditLoading }] = useEditMyLostItemMutation();
  const [editError, setEditError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useZodForm<typeof editLostItemSchema, EditLostItemValues>(
    editLostItemSchema,
    {
      defaultValues: {
        lostItemName: "",
        description: "",
        location: "",
        date: "",
      },
    }
  );

  const openModal = (item: any) => {
    setIsOpen(true);
    setCurrId(item?.id);
    reset({
      lostItemName: item.lostItemName,
      description: item.description,
      location: item.location,
      date: item.date ? item.date.split("T")[0] : "",
    });
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditError(null);
    reset();
  };

  const onSubmit = async (data: EditLostItemValues) => {
    setEditError(null);
    try {
      const updatePayload = {
        id: currId,
        ...data,
        date: new Date(data.date).toISOString(),
      };
      await editMyLostItem(updatePayload).unwrap();
      closeModal();
    } catch (err: any) {
      console.error("[MyLostItems] edit failed:", err);
      const msg = err?.data?.message;
      setEditError(typeof msg === "string" ? msg : "Failed to update. Please try again.");
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="glass-panel">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <div className="h-12 bg-gray-700 rounded-lg w-56 mx-auto mb-4 animate-pulse" />
            <div className="h-5 bg-gray-700 rounded w-64 mx-auto animate-pulse" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-xl p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-3 bg-gray-700 rounded w-16 mb-3" />
                    <div className="h-7 bg-gray-700 rounded w-10" />
                  </div>
                  <div className="w-10 h-10 bg-gray-700 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900/60 border-b border-yellow-700/15">
                <tr>
                  {["Item", "Status", "Location", "Date Lost", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-700 flex-shrink-0" />
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-700 rounded w-32" />
                          <div className="h-2.5 bg-gray-700 rounded w-48" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-700 rounded-full w-20" /></td>
                    <td className="px-6 py-4"><div className="h-3 bg-gray-700 rounded w-28" /></td>
                    <td className="px-6 py-4"><div className="h-3 bg-gray-700 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-700 rounded w-16" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header Section */}
      <div className="glass-panel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent mb-6">
              My Lost Items
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Manage and track your lost item reports
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Items</p>
                <p className="text-2xl font-bold text-white">
                  {myLostItems?.data?.length || 0}
                </p>
              </div>
              <div className="bg-gray-500 p-3 rounded-lg">
                <FaSearch className="text-white" />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Not Found</p>
                <p className="text-2xl font-bold text-red-400">
                  {myLostItems?.data?.filter((item: any) => !item.isFound)
                    .length || 0}
                </p>
              </div>
              <div className="bg-gray-500 p-3 rounded-lg">
                <FaTimesCircle className="text-white" />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Found</p>
                <p className="text-2xl font-bold text-green-400">
                  {myLostItems?.data?.filter((item: any) => item.isFound)
                    .length || 0}
                </p>
              </div>
              <div className="bg-gray-500 p-3 rounded-lg">
                <FaCheckCircle className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        {myLostItems?.data?.length === 0 ? (
          <div className="text-center py-16">
            <div className="glass-card rounded-2xl p-12 max-w-md mx-auto">
              <div className="text-6xl mb-6">📋</div>
              <h3 className="text-2xl font-bold gold-text mb-4">
                No Lost Items Found
              </h3>
              <p className="text-gray-300 mb-6">
                You haven't reported any lost items yet. Start by reporting a
                lost item to track it here.
              </p>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/60 border-b border-yellow-700/15">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                      Item
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                      Date Lost
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-yellow-500/70 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {myLostItems?.data?.map((myLostItem: any) => (
                    <tr
                      key={myLostItem.id}
                      className="hover:bg-yellow-900/10 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-12 h-12 mr-4">
                            <img
                              className="w-12 h-12 rounded-lg object-cover"
                              src={myLostItem?.img || img}
                              alt={myLostItem?.lostItemName}
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = img;
                              }}
                            />
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {myLostItem?.lostItemName}
                            </div>
                            <div className="text-sm text-gray-400 truncate max-w-xs">
                              {myLostItem?.description ||
                                "No description provided."}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          {myLostItem?.isFound ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-900/40 border border-green-500/50 text-green-300 w-fit shadow-[0_0_8px_rgba(34,197,94,0.15)]">
                              <FaCheckCircle className="w-3 h-3" /> Recovered
                            </span>
                          ) : myLostItem?.approvalStatus === "PENDING" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-900/30 border border-yellow-600/50 text-yellow-300 w-fit">
                              ⏳ Pending Approval
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-900/30 border border-red-500/50 text-red-300 w-fit">
                              <FaTimesCircle className="w-3 h-3" /> Still Missing
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        <div className="flex items-center">
                          <FaMapMarkerAlt className="mr-2 text-gray-400" />
                          <span className="truncate max-w-xs">
                            {myLostItem?.location || "Location not specified"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-2 text-gray-400" />
                          <span>
                            {formatDate(myLostItem?.date) || "No date reported"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {myLostItem?.isFound ? (
                            <span className="text-xs text-green-400/70 italic px-1">Recovered</span>
                          ) : (
                            <button
                              onClick={() => openModal(myLostItem)}
                              className="p-2 text-yellow-500 hover:bg-yellow-500 hover:text-white rounded-lg transition-colors duration-200 hover:scale-110"
                              title="Edit item"
                              aria-label="Edit item"
                            >
                              <FaEdit />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteClick(myLostItem)}
                            className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors duration-200 hover:scale-110"
                            title="Delete item"
                            aria-label="Delete item"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal show={isOpen} size="md" popup={true} onClose={closeModal}>
        <div ref={editModalRef} className="glass-card rounded-xl">
          <ModalHeader className="border-b border-gray-700">
            <h3 className="text-xl font-medium text-white">Edit Lost Item</h3>
          </ModalHeader>
          <ModalBody className="bg-gray-900/80">
            <div className="space-y-6 p-6">
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="mb-4 space-y-5">
                  <FormField<EditLostItemValues>
                    name="lostItemName"
                    label="Item name"
                    errors={errors}
                    required
                  >
                    {({ id, hasError, ariaDescribedBy }) => (
                      <PupInput
                        id={id}
                        {...register("lostItemName")}
                        hasError={hasError}
                        ariaDescribedBy={ariaDescribedBy}
                        aria-required="true"
                        className="mt-1"
                      />
                    )}
                  </FormField>

                  <FormField<EditLostItemValues>
                    name="description"
                    label="Description"
                    errors={errors}
                    required
                  >
                    {({ id, hasError, ariaDescribedBy }) => (
                      <PupInput
                        id={id}
                        {...register("description")}
                        hasError={hasError}
                        ariaDescribedBy={ariaDescribedBy}
                        aria-required="true"
                        className="mt-1"
                      />
                    )}
                  </FormField>

                  <FormField<EditLostItemValues>
                    name="location"
                    label="Location"
                    errors={errors}
                    required
                  >
                    {({ id, hasError, ariaDescribedBy }) => (
                      <PupInput
                        id={id}
                        {...register("location")}
                        hasError={hasError}
                        ariaDescribedBy={ariaDescribedBy}
                        aria-required="true"
                        className="mt-1"
                      />
                    )}
                  </FormField>

                  <FormField<EditLostItemValues>
                    name="date"
                    label="Date lost"
                    errors={errors}
                    required
                  >
                    {({ id, hasError, ariaDescribedBy }) => (
                      <PupInput
                        type="date"
                        id={id}
                        {...register("date")}
                        hasError={hasError}
                        ariaDescribedBy={ariaDescribedBy}
                        aria-required="true"
                        className="mt-1"
                      />
                    )}
                  </FormField>
                </div>

                {editError && (
                  <div className="px-3 py-2 bg-red-900/30 border border-red-600/40 rounded-lg text-sm text-red-300 mb-3" role="alert">
                    ✕ {editError}
                  </div>
                )}
                <div className="flex justify-end space-x-3">
                  <PupButton type="submit" disabled={isEditLoading}>
                    {isEditLoading ? (
                      <span className="flex items-center gap-2">
                        <Spinner size="sm" />
                        Saving…
                      </span>
                    ) : "Save Changes"}
                  </PupButton>
                  <PupButton variant="ghost" onClick={closeModal} disabled={isEditLoading}>
                    Cancel
                  </PupButton>
                </div>
              </form>
            </div>
          </ModalBody>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={isDeleteModalOpen}
        size="md"
        popup={true}
        onClose={handleDeleteCancel}
      >
        <div className="glass-card rounded-xl">
          <ModalHeader className="border-b border-gray-700">
            <h3 className="text-xl font-medium text-white">Delete Lost Item</h3>
          </ModalHeader>
          <ModalBody className="bg-gray-900/80">
            <div className="space-y-6 p-6">
              <div className="text-center">
                <div className="mb-4">
                  <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <FaTrash className="text-red-600 text-xl" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Are you sure you want to delete this item?
                  </h3>
                  <p className="text-gray-400 mb-4">
                    This action cannot be undone. The lost item report will be
                    permanently removed.
                  </p>
                </div>

                {itemToDelete && (
                  <div className="bg-gray-700 rounded-lg p-4 mb-6 text-left">
                    <div className="flex items-center">
                      <img
                        className="w-12 h-12 rounded-lg object-cover mr-4"
                        src={itemToDelete?.img || img}
                        alt={itemToDelete?.lostItemName}
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = img;
                        }}
                      />
                      <div>
                        <h4 className="font-medium text-white mb-1">
                          {itemToDelete?.lostItemName}
                        </h4>
                        <p className="text-sm text-gray-400 mb-1">
                          {itemToDelete?.description}
                        </p>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Location: {itemToDelete?.location}</span>
                          <span>Date: {formatDate(itemToDelete?.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-center space-x-3">
                  <PupButton
                    variant="ghost"
                    onClick={handleDeleteCancel}
                    disabled={isDeleting}
                  >
                    Cancel
                  </PupButton>
                  <PupButton
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                    variant="danger"
                  >
                    {isDeleting ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Item"
                    )}
                  </PupButton>
                </div>
              </div>
            </div>
          </ModalBody>
        </div>
      </Modal>
    </div>
  );
};

export default MyLostItems;
