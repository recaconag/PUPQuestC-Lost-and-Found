import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { FaCloudUploadAlt, FaCheckCircle, FaTimesCircle, FaImage, FaPen, FaTrash } from "react-icons/fa";
import { cx } from "./cx";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  onUploadClear: () => void;
  uploadedUrl?: string;
  hasError?: boolean;
  disabled?: boolean;
  className?: string;
  ariaDescribedBy?: string;
}

type UploadState = "idle" | "uploading" | "done" | "error";

export const ImageUpload = ({
  onUploadComplete,
  onUploadClear,
  uploadedUrl,
  hasError = false,
  disabled = false,
  className,
  ariaDescribedBy,
}: ImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>(
    uploadedUrl ? "done" : "idle"
  );
  const [preview, setPreview] = useState<string | null>(uploadedUrl ?? null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const getToken = () => {
    return (
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken") ||
      ""
    );
  };

  const processFile = async (file: File) => {
    setErrorMsg(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrorMsg("Only JPG, PNG, and WEBP images are allowed.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrorMsg("Image must be under 5 MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploadState("uploading");
    setProgress(0);

    const formData = new FormData();
    formData.append("image", file);

    const baseUrl = import.meta.env.VITE_SERVER_URL
      ? `${import.meta.env.VITE_SERVER_URL}/api`
      : "http://localhost:5000/api";

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.open("POST", `${baseUrl}/upload`);
        xhr.setRequestHeader("authorization", `Bearer ${getToken()}`);

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            onUploadComplete(data.data.url);
            setUploadState("done");
            resolve();
          } else {
            let msg = `Upload failed (${xhr.status})`;
            try {
              const body = JSON.parse(xhr.responseText);
              if (body?.message) msg = body.message;
            } catch { /* non-JSON response */ }
            if (xhr.status === 401 || xhr.status === 403) {
              msg = "Session expired — please log in again before uploading.";
            }
            reject(new Error(msg));
          }
        };
        xhr.onerror = () => reject(new Error("Network error. Check your connection and try again."));
        xhr.send(formData);
      });
    } catch (err: unknown) {
      setUploadState("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
      setPreview(null);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleClear = () => {
    setUploadState("idle");
    setPreview(null);
    setErrorMsg(null);
    setProgress(0);
    onUploadClear();
  };

  const isUploading = uploadState === "uploading";
  const isDone = uploadState === "done";

  return (
    <div className={cx("space-y-2", className)}>
      {isDone && preview ? (
        /* ── PREVIEW STATE ── */
        <div className="relative group rounded-xl overflow-hidden border border-yellow-500/40 bg-gray-800/60 shadow-lg min-h-[200px]">
          <img
            src={preview}
            alt="Uploaded preview"
            className="w-full h-full min-h-[200px] object-cover"
            loading="lazy"
          />
          {/* Desktop Overlay: Visible on hover/focus on desktop screens that support hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 hidden [@media(hover:hover)]:md:flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-gradient-to-br from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-semibold text-xs px-3 py-1.5 rounded-lg transition-all duration-200 shadow-[0_2px_8px_rgba(202,138,4,0.30)] hover:shadow-[0_4px_16px_rgba(202,138,4,0.45)]"
              aria-label="Change image"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-all duration-200 shadow-[0_2px_8px_rgba(128,0,0,0.40)] hover:shadow-[0_4px_16px_rgba(128,0,0,0.55)]"
              aria-label="Remove image"
            >
              Remove
            </button>
          </div>

          {/* Mobile Floating Action Buttons: Always visible on touchscreens / mobile devices, hidden on desktop hover-capable screens */}
          <div className="absolute top-2 left-2 flex gap-2 [@media(hover:hover)]:md:hidden">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-gray-950/85 hover:bg-gray-900 active:scale-95 text-yellow-500 p-2.5 rounded-xl border border-yellow-500/30 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-md flex items-center justify-center"
              aria-label="Change image"
            >
              <FaPen className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="bg-gray-950/85 hover:bg-red-950/40 active:scale-95 text-red-500 p-2.5 rounded-xl border border-red-500/30 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-md flex items-center justify-center"
              aria-label="Remove image"
            >
              <FaTrash className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="absolute top-2 right-2 bg-yellow-600 text-gray-900 rounded-full p-1 shadow">
            <FaCheckCircle className="w-4 h-4" />
          </div>
        </div>
      ) : (
        /* ── DROP ZONE ── */
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Upload image"
          aria-describedby={ariaDescribedBy}
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !disabled && !isUploading) {
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cx(
            "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-0 min-h-[200px] text-center transition-all duration-200 cursor-pointer",
            dragging
              ? "border-yellow-500 bg-yellow-500/10 scale-[1.01]"
              : hasError
                ? "border-red-600/70 bg-red-900/10"
                : "border-gray-700/60 bg-gray-800/40 hover:border-yellow-500/60 hover:bg-gray-700/40",
            (disabled || isUploading) && "cursor-not-allowed opacity-60"
          )}
        >
          {isUploading ? (
            <>
              <div className="w-10 h-10 rounded-full border-4 border-yellow-500/30 border-t-yellow-500 animate-spin" />
              <p className="text-sm font-medium text-yellow-400">
                Uploading... {progress}%
              </p>
              <div className="w-full max-w-[180px] h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className={cx(
                "w-14 h-14 rounded-2xl flex items-center justify-center",
                hasError
                  ? "bg-red-700/20 text-red-400"
                  : "bg-gray-700/60 text-gray-400"
              )}>
                {hasError
                  ? <FaTimesCircle className="w-7 h-7" />
                  : dragging
                    ? <FaImage className="w-7 h-7 text-yellow-500" />
                    : <FaCloudUploadAlt className="w-7 h-7" />
                }
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  {dragging ? "Drop to upload" : "Click or drag & drop"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  JPG, PNG, WEBP · Max 5 MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {uploadState === "error" && errorMsg && (
        <p className="text-xs text-red-400 flex items-center gap-1.5">
          <FaTimesCircle className="w-3 h-3 flex-shrink-0" />
          {errorMsg}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        aria-hidden
      />
    </div>
  );
};
