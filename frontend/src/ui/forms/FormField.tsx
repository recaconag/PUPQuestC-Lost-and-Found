import type { ReactNode } from "react";
import type { FieldError, FieldErrors, FieldValues, Path } from "react-hook-form";
import { cx } from "../cx";

type Props<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  label: string;
  errors: FieldErrors<TFieldValues>;
  hint?: string;
  required?: boolean;
  children: (opts: { id: string; hasError: boolean; error?: FieldError; ariaDescribedBy: string }) => ReactNode;
};

export function FormField<TFieldValues extends FieldValues>({
  name,
  label,
  errors,
  hint,
  required = false,
  children,
}: Props<TFieldValues>) {
  const id = String(name);
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const error = errors[name] as FieldError | undefined;
  const hasError = Boolean(error?.message);

  const ariaDescribedBy = [
    hint && !hasError ? hintId : null,
    hasError ? errorId : null,
  ].filter(Boolean).join(" ");

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </label>
      {children({ id, hasError, error, ariaDescribedBy })}
      {hint && !hasError && (
        <p id={hintId} className="text-xs text-gray-400">{hint}</p>
      )}
      {hasError && (
        <p id={errorId} className={cx("text-sm font-medium", "text-red-500")} role="alert">
          {String(error?.message)}
        </p>
      )}
    </div>
  );
}

