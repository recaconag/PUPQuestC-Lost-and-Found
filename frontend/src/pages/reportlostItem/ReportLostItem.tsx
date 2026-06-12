import { Spinner } from "flowbite-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCategoryQuery,
  useCreateLostItemMutation,
} from "../../redux/api/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { IoIosArrowDown } from "react-icons/io";
import { FormField } from "../../ui/forms/FormField";
import { reportLostSchema, type ReportLostValues } from "../../ui/forms/schemas";
import { useZodForm } from "../../ui/forms/useZodForm";
import { PupInput } from "../../ui/PupInput";
import { PupTextarea } from "../../ui/PupTextarea";
import { PupButton } from "../../ui/PupButton";
import { ImageUpload } from "../../ui/ImageUpload";
import { cx } from "../../ui/cx";


const ReportLostItem = () => {
  const {
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useZodForm<typeof reportLostSchema, ReportLostValues>(reportLostSchema, {
    defaultValues: {
      lostItemName: "",
      description: "",
      imgUrl: "",
      location: "",
      categoryId: "",
    },
  });

  const navigate = useNavigate();
  const [createLostItem, { isLoading }] = useCreateLostItemMutation();
  const { data: Category } = useCategoryQuery(undefined);
  const [startDate, setStartDate] = useState(new Date());
  const [uploadedImgUrl, setUploadedImgUrl] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [otherSpec, setOtherSpec] = useState("");

  const categories = [...(Category?.data ?? [])].sort((a: any, b: any) => {
    if (a.name.toLowerCase() === "others") return 1;
    if (b.name.toLowerCase() === "others") return -1;
    return a.name.localeCompare(b.name);
  });
  const othersCategory = categories.find((c: { id: string; name: string }) =>
    c.name.toLowerCase() === "others"
  );
  const selectedCategoryId = watch("categoryId");
  const isOthers = !!othersCategory && selectedCategoryId === othersCategory.id;

  const onSubmit = async (data: ReportLostValues) => {
    setSubmitError(null);
    try {
      const specPrefix = isOthers && otherSpec.trim()
        ? `[Others — ${otherSpec.trim()}] `
        : "";
      const lostData = {
        lostItemName: data.lostItemName,
        description: specPrefix + data.description,
        categoryId: data.categoryId,
        img: data.imgUrl,
        location: data.location,
        date: startDate,
      };
      await createLostItem(lostData).unwrap();
      reset();
      setStartDate(new Date());
      setUploadedImgUrl("");
      setOtherSpec("");
      setSubmitSuccess(true);
      setTimeout(() => navigate("/lostItems"), 1800);
    } catch (err: any) {
      console.error("[ReportLostItem] submit failed:", err);
      setSubmitError(
        err?.data?.message ?? "Failed to submit. Please try again."
      );
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-950 py-12 px-4">
      <div className="w-full max-w-3xl">
        <div className="glass-card rounded-2xl p-8 md:p-10">

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent">
              Report Lost Item
            </h1>
            <p className="mt-1 text-sm text-gray-400">Describe what you lost so the campus community can help.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* ── Row 1: Item Name | Category ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField<ReportLostValues>
                name="lostItemName"
                label="Item Name"
                errors={errors}
                required
              >
                {({ id, hasError, ariaDescribedBy }) => (
                  <PupInput
                    id={id}
                    type="text"
                    placeholder="e.g. Laptop, Phone, Wallet"
                    className="h-12"
                    {...register("lostItemName")}
                    hasError={hasError}
                    ariaDescribedBy={ariaDescribedBy}
                    aria-required="true"
                  />
                )}
              </FormField>

              <FormField<ReportLostValues>
                name="categoryId"
                label="Category"
                errors={errors}
                required
              >
                {({ id, hasError, ariaDescribedBy }) => (
                  <div className="relative">
                    <select
                      id={id}
                      aria-invalid={hasError ? true : undefined}
                      aria-describedby={ariaDescribedBy}
                      aria-required="true"
                      {...register("categoryId")}
                      className={cx(
                        "h-12 w-full cursor-pointer appearance-none rounded-lg border bg-gray-800/50 px-4 text-sm text-white",
                        "transition-all duration-200 backdrop-blur-sm",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950",
                        hasError ? "border-red-600/70" : "border-gray-700/60"
                      )}
                    >
                      <option value="" disabled className="text-gray-400">Select a category</option>
                      {categories.map((category: { id: string; name: string }) => (
                        <option key={category.id} value={category.id} className="bg-gray-800 text-white">
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                      <IoIosArrowDown className="h-4 w-4" />
                    </div>
                  </div>
                )}
              </FormField>
            </div>

            {/* ── Others: Please Specify ── */}
            {isOthers && (
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                  Please specify category
                  <span className="ml-1.5 text-xs text-yellow-500 font-normal">(required for Others)</span>
                </label>
                <input
                  type="text"
                  value={otherSpec}
                  onChange={(e) => setOtherSpec(e.target.value)}
                  placeholder="e.g. Musical Instruments, Sports Equipment, Art Supplies"
                  maxLength={80}
                  className="h-12 w-full rounded-lg border border-yellow-600/50 bg-gray-800/50 px-4 text-sm text-white placeholder-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/70 transition-all duration-200"
                />
              </div>
            )}

            {/* ── Row 2: Location | Date ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <FormField<ReportLostValues>
                name="location"
                label="Last Seen Location"
                errors={errors}
                required
              >
                {({ id, hasError, ariaDescribedBy }) => (
                  <PupInput
                    id={id}
                    type="text"
                    placeholder="e.g. Library, Canteen, Room 201"
                    className="h-12"
                    {...register("location")}
                    hasError={hasError}
                    ariaDescribedBy={ariaDescribedBy}
                    aria-required="true"
                  />
                )}
              </FormField>

              <div className="space-y-1">
                <label htmlFor="report-lost-date" className="block text-sm font-semibold text-gray-300">
                  Date Lost
                </label>
                <DatePicker
                  id="report-lost-date"
                  wrapperClassName="w-full"
                  className={cx(
                    "h-12 w-full rounded-lg border border-gray-700/60 bg-gray-800/50 px-4 text-sm text-white",
                    "transition-all duration-200 backdrop-blur-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                  )}
                  selected={startDate}
                  onChange={(date: Date | null) => date && setStartDate(date)}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select date"
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  maxDate={new Date()}
                />
              </div>
            </div>

            {/* ── Row 3: Description | Item Photo (matched height) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <FormField<ReportLostValues>
                name="description"
                label="Description"
                errors={errors}
                required
              >
                {({ id, hasError, ariaDescribedBy }) => (
                  <PupTextarea
                    id={id}
                    placeholder="Describe the item — color, brand, size, distinguishing marks..."
                    className="min-h-[200px] resize-none"
                    {...register("description")}
                    hasError={hasError}
                    ariaDescribedBy={ariaDescribedBy}
                    aria-required="true"
                  />
                )}
              </FormField>

              <FormField<ReportLostValues>
                name="imgUrl"
                label="Item Photo"
                errors={errors}
                required
              >
                {({ hasError, ariaDescribedBy }) => (
                  <ImageUpload
                    uploadedUrl={uploadedImgUrl || undefined}
                    hasError={hasError}
                    disabled={isLoading}
                    ariaDescribedBy={ariaDescribedBy}
                    onUploadComplete={(url) => {
                      setUploadedImgUrl(url);
                      setValue("imgUrl", url, { shouldValidate: true });
                    }}
                    onUploadClear={() => {
                      setUploadedImgUrl("");
                      setValue("imgUrl", "", { shouldValidate: true });
                    }}
                  />
                )}
              </FormField>
            </div>

            {/* ── Submit ── */}
            <div className="mt-8 flex flex-col items-end gap-2">
              {submitError && (
                <p className="text-sm text-red-400 flex items-center gap-1.5 self-stretch justify-end" role="alert">
                  <span aria-hidden>✕</span> {submitError}
                </p>
              )}
              {submitSuccess && (
                <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-green-900/20 border border-green-500/40" role="status">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  <span className="text-sm text-green-300 font-medium">Lost item reported successfully! Redirecting you to the gallery…</span>
                </div>
              )}
              <PupButton
                type="submit"
                disabled={isLoading || submitSuccess}
                className="px-10 py-3 text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    Submitting…
                  </span>
                ) : submitSuccess ? "Submitted!" : "Submit Lost Item"}
              </PupButton>
            </div>

          </form>
        </div>
      </div>
    </section>
  );
};
export default ReportLostItem;
