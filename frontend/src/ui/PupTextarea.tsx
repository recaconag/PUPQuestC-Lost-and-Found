import { forwardRef } from "react";
import { cx } from "./cx";

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
  ariaDescribedBy?: string;
}

export const PupTextarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ hasError, ariaDescribedBy, className, ...rest }, ref) => (
    <textarea
      ref={ref}
      rows={3}
      aria-invalid={hasError ? "true" : undefined}
      aria-describedby={ariaDescribedBy || rest["aria-describedby"]}
      className={cx(
        "w-full rounded-lg border bg-gray-800/50 px-4 py-3 text-sm text-white placeholder-gray-500",
        "transition-all duration-200 resize-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950",
        hasError ? "border-red-600/70 ring-1 ring-red-600/50" : "border-red-900/40 hover:border-red-800/60 focus-visible:border-yellow-500/60",
        className
      )}
      {...rest}
    />
  )
);

PupTextarea.displayName = "PupTextarea";
