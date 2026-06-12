import { NavLink, type NavLinkProps } from "react-router-dom";
import { cx } from "./cx";
import { ui } from "./tokens";

type Props = NavLinkProps & {
  label: string;
};

export function PupNavLink({ label, className, ...props }: Props) {
  return (
    <NavLink
      {...props}
      aria-label={label}
      className={({ isActive }) =>
        cx(
          "relative text-sm font-medium tracking-wide",
          ui.motion,
          ui.focusRing,
          ui.linkUnderline,
          isActive ? "text-yellow-500 after:w-full" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white after:w-0 hover:after:w-full",
          ui.nav.mobileItem,
          ui.nav.desktopItem,
          typeof className === "function" ? className({ isActive, isPending: false, isTransitioning: false }) : className
        )
      }
    >
      {label}
    </NavLink>
  );
}

