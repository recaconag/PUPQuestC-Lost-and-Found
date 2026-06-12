import { useState, useEffect } from "react";
import { FaTimes, FaCheckCircle } from "react-icons/fa";
import { useEditMyFoundItemMutation } from "../../redux/api/api";
import { ImageUpload } from "../../ui/ImageUpload";
import { FormField } from "../../ui/forms/FormField";
import { editFoundItemSchema, type EditFoundItemValues } from "../../ui/forms/schemas";
import { useZodForm } from "../../ui/forms/useZodForm";
import { PupInput } from "../../ui/PupInput";
import { PupTextarea } from "../../ui/PupTextarea";
import { PupButton } from "../../ui/PupButton";
import { cx } from "../../ui/cx";

interface FoundItemSnapshot {
  id: string;
  foundItemName: string;
  description: string;
  location: string;
  date: string;
  claimProcess?: string;
  img?: string;
  category?: { id: string; name: string };
}

interface Props {
  item: FoundItemSnapshot;
  onClose: () => void;
  onSuccess: () => void;
}

const inputCls =
  "w-full px-3 py-2.5 bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200 text-sm";

const EditFoundItemModal = ({ item, onClose, onSuccess }: Props) => {
  const [imgUrl, setImgUrl] = useState(item.img ?? "");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  const [editMyFoundItem, { isLoading }] = useEditMyFoundItemMutation();

  const today = new Date().toISOString().split("T")[0];

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useZodForm<typeof editFoundItemSchema, EditFoundItemValues>(editFoundItemSchema, {
    defaultValues: {
      foundItemName: item.foundItemName,
      description: item.description,
      location: item.location,
      date: item.date ? new Date(item.date).toISOString().split("T")[0] : "",
      claimProcess: item.claimProcess ?? "",
    },
  });

  const onSubmit = async (data: EditFoundItemValues) => {
    setSubmitError(null);
    try {
      await editMyFoundItem({
        id: item.id,
        foundItemName: data.foundItemName.trim(),
        description: data.description.trim(),
        location: data.location.trim(),
        claimProcess: data.claimProcess.trim(),
        categoryId: item.category?.id,
        img: imgUrl || item.img,
        date: new Date(data.date).toISOString(),
      }).unwrap();
      setEditSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1400);
    } catch (err: any) {
      setSubmitError(err?.data?.message ?? "Failed to update. Please try again.");
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !isLoading) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLoading, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl glass-card rounded-xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/60">
          <div>
            <h2 className="text-xl font-bold gold-text">Edit Found Item</h2>
            <p className="text-xs text-gray-500 mt-0.5">Changes are saved immediately to your report.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-700/50 disabled:opacity-40"
            aria-label="Close modal"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="edit-found-item-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

            {/* Item name */}
            <FormField<EditFoundItemValues> name="foundItemName" label="Item Name" errors={errors} required>
              {({ id, hasError, ariaDescribedBy }) => (
                <PupInput
                  id={id}
                  type="text"
                  placeholder="e.g. Black Leather Wallet"
                  {...register("foundItemName")}
                  hasError={hasError}
                  ariaDescribedBy={ariaDescribedBy}
                  aria-required="true"
                />
              )}
            </FormField>

            {/* Description */}
            <FormField<EditFoundItemValues> name="description" label="Description" errors={errors} required>
              {({ id, hasError, ariaDescribedBy }) => (
                <PupTextarea
                  id={id}
                  rows={3}
                  placeholder="Describe the item in detail — color, brand, size, condition…"
                  {...register("description")}
                  hasError={hasError}
                  ariaDescribedBy={ariaDescribedBy}
                  aria-required="true"
                  className="resize-none"
                />
              )}
            </FormField>

            {/* Category + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Category</label>
                <input
                  type="text"
                  value={item.category?.name || ""}
                  disabled
                  className={cx(inputCls, "cursor-not-allowed opacity-60")}
                />
                <p className="text-xs text-gray-500 mt-1">Category cannot be changed</p>
              </div>
              <FormField<EditFoundItemValues> name="date" label="Date Found" errors={errors} required>
                {({ id, hasError, ariaDescribedBy }) => (
                  <input
                    id={id}
                    type="date"
                    max={today}
                    aria-invalid={hasError ? "true" : undefined}
                    aria-describedby={ariaDescribedBy}
                    aria-required="true"
                    {...register("date")}
                    className={cx(inputCls, hasError ? "border-red-600/70" : "border-red-900/40")}
                  />
                )}
              </FormField>
            </div>

            {/* Location */}
            <FormField<EditFoundItemValues> name="location" label="Location" errors={errors} required>
              {({ id, hasError, ariaDescribedBy }) => (
                <PupInput
                  id={id}
                  type="text"
                  placeholder="e.g. CAFA Building, 2nd Floor Hallway"
                  {...register("location")}
                  hasError={hasError}
                  ariaDescribedBy={ariaDescribedBy}
                  aria-required="true"
                />
              )}
            </FormField>

            {/* Claim instructions */}
            <FormField<EditFoundItemValues> name="claimProcess" label="How to Claim Instructions" errors={errors} hint="(optional)">
              {({ id, hasError, ariaDescribedBy }) => (
                <PupTextarea
                  id={id}
                  rows={3}
                  placeholder="Describe what the claimer must provide or do to retrieve this item…"
                  {...register("claimProcess")}
                  hasError={hasError}
                  ariaDescribedBy={ariaDescribedBy}
                  className="resize-none"
                />
              )}
            </FormField>

            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Item Photo
                <span className="ml-1.5 text-xs text-gray-500 font-normal">
                  (hover over image to change or remove)
                </span>
              </label>
              <ImageUpload
                uploadedUrl={imgUrl || undefined}
                disabled={isLoading}
                onUploadComplete={(url) => setImgUrl(url)}
                onUploadClear={() => setImgUrl("")}
              />
            </div>

            {/* Feedback */}
            {submitError && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-900/20 border border-red-500/40">
                <span className="text-red-400 mt-0.5 flex-shrink-0 text-sm">✕</span>
                <p className="text-sm text-red-300">{submitError}</p>
              </div>
            )}
            {editSuccess && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-900/20 border border-green-500/40">
                <FaCheckCircle className="text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-300">Item updated successfully! Closing…</p>
              </div>
            )}
          </form>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700/60 hover:bg-gray-600/60 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <PupButton
            type="submit"
            form="edit-found-item-form"
            disabled={isLoading || editSuccess}
            className="px-5 py-2 text-sm font-semibold"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : editSuccess ? (
              <>
                <FaCheckCircle className="w-3.5 h-3.5" />
                Saved!
              </>
            ) : (
              "Save Changes"
            )}
          </PupButton>
        </div>
      </div>
    </div>
  );
};

export default EditFoundItemModal;
