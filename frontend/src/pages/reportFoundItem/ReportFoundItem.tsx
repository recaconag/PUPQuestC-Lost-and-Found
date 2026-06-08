import { Spinner } from "flowbite-react";
import confetti from "canvas-confetti";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useCategoryQuery,
  useCreateFoundItemMutation,
} from "../../redux/api/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FormField } from "../../ui/forms/FormField";
import {
  reportFoundSchema,
  type ReportFoundValues,
} from "../../ui/forms/schemas";
import { useZodForm } from "../../ui/forms/useZodForm";
import { PupInput } from "../../ui/PupInput";
import { PupTextarea } from "../../ui/PupTextarea";
import { PupButton } from "../../ui/PupButton";
import { ImageUpload } from "../../ui/ImageUpload";
import { cx } from "../../ui/cx";

const ReportFoundItem = () => {
  const {
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useZodForm<typeof reportFoundSchema, ReportFoundValues>(
    reportFoundSchema,
    {
      defaultValues: {
        foundItemName: "",
        description: "",
        imgUrl: "",
        location: "",
        claimProcess: "",
        categoryId: "",
      },
    }
  );

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [createFoundItem, { isLoading }] = useCreateFoundItemMutation();
  const { data: Category } = useCategoryQuery(undefined);

  const [startDate, setStartDate] = useState(new Date());
  const [uploadedImgUrl, setUploadedImgUrl] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
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

  useEffect(() => {
    const prefillName = searchParams.get("name");
    const prefillCategoryId = searchParams.get("categoryId");
    if (prefillName) setValue("foundItemName", prefillName, { shouldValidate: false });
    if (prefillCategoryId) setValue("categoryId", prefillCategoryId, { shouldValidate: false });
  }, [searchParams, setValue]);

  const onSubmit = async (data: ReportFoundValues) => {
    setSubmitError(null);
    try {
      const specPrefix = isOthers && otherSpec.trim()
        ? `[Others — ${otherSpec.trim()}] `
        : "";
      const foundData = {
        img: data.imgUrl,
        categoryId: data.categoryId,
        foundItemName: data.foundItemName,
        description: specPrefix + data.description,
        location: data.location,
        date: startDate,
        claimProcess: data.claimProcess,
      };

      await createFoundItem(foundData).unwrap();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#800000", "#eab308", "#ffffff", "#fef08a"],
        scalar: 1.1,
      });
      reset();
      setStartDate(new Date());
      setUploadedImgUrl("");
      setOtherSpec("");
      navigate("/found-items");
    } catch (err: any) {
      console.error("[ReportFoundItem] submit failed:", err);
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
            <h1 className="text-3xl font-black bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
              Report Found Item
            </h1>
            <p className="mt-1 text-sm text-gray-400">Fill in the details below to report a found item on campus.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* ── Row 1: Item Name | Category ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField<ReportFoundValues>
                name="foundItemName"
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
                    {...register("foundItemName")}
                    hasError={hasError}
                    ariaDescribedBy={ariaDescribedBy}
                    aria-required="true"
                  />
                )}
              </FormField>

              <FormField<ReportFoundValues>
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
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                      <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden>
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
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
              <FormField<ReportFoundValues>
                name="location"
                label="Location Found"
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
                <label htmlFor="report-found-date" className="block text-sm font-semibold text-gray-300">
                  Date Found
                </label>
                <DatePicker
                  id="report-found-date"
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

            {/* ── Row 3: Claim Process (full width) ── */}
            <div className="mt-6">
              <FormField<ReportFoundValues>
                name="claimProcess"
                label="Claim Process"
                errors={errors}
                required
              >
                {({ id, hasError, ariaDescribedBy }) => (
                  <PupInput
                    id={id}
                    type="text"
                    placeholder="e.g. Visit the Office of Student Affairs with valid ID"
                    className="h-12"
                    {...register("claimProcess")}
                    hasError={hasError}
                    ariaDescribedBy={ariaDescribedBy}
                    aria-required="true"
                  />
                )}
              </FormField>
            </div>

            {/* ── Row 4: Description | Item Photo (matched height) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <FormField<ReportFoundValues>
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

              <FormField<ReportFoundValues>
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
              <PupButton
                type="submit"
                disabled={isLoading}
                className="px-10 py-3 text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    Submitting…
                  </span>
                ) : "Submit Found Item"}
              </PupButton>
            </div>

          </form>
        </div>
      </div>
    </section>
  );
};
export default ReportFoundItem;
