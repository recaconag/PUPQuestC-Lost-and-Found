import { forwardRef } from "react";
import { cx } from "./cx";
import { ui } from "./tokens";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
  ariaDescribedBy?: string;
};

export const PupInput = forwardRef<HTMLInputElement, Props>(function PupInput(
  { className, hasError, ariaDescribedBy, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      {...props}
      aria-invalid={hasError ? "true" : undefined}
      aria-describedby={ariaDescribedBy || props["aria-describedby"]}
      className={cx(
        ui.motion,
        ui.focusRing,
        "w-full rounded-lg border bg-gray-800/50 px-4 py-3 text-white placeholder:text-gray-400 backdrop-blur-sm",
        hasError
          ? "border-red-600/70 focus-visible:ring-red-500/40 focus-visible:border-red-500/70"
          : "border-red-900/40 hover:border-red-800/60 focus-visible:border-yellow-500/60",
        className
      )}
    />
  );
});

