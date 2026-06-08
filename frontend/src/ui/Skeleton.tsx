import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rectangular",
  width,
  height,
}) => {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700";
  
  const variantClasses = {
    text: "rounded",
    rectangular: "rounded-md",
    circular: "rounded-full",
  };

  const style: React.CSSProperties = {
    width: width || (variant === "text" ? "100%" : undefined),
    height: height || (variant === "text" ? "1rem" : undefined),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

// Card skeleton for item lists
export const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
    <div className="flex gap-4">
      <Skeleton variant="rectangular" width={120} height={120} className="flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <Skeleton variant="text" width="70%" height={24} />
        <Skeleton variant="text" width="40%" height={16} />
        <Skeleton variant="text" width="90%" height={16} />
        <Skeleton variant="text" width="60%" height={16} />
      </div>
    </div>
  </div>
);

// Table row skeleton
export const TableRowSkeleton: React.FC = () => (
  <tr className="border-b border-gray-200 dark:border-gray-700">
    <td className="px-4 py-3">
      <Skeleton variant="text" width="80%" height={20} />
    </td>
    <td className="px-4 py-3">
      <Skeleton variant="text" width="60%" height={20} />
    </td>
    <td className="px-4 py-3">
      <Skeleton variant="text" width="50%" height={20} />
    </td>
    <td className="px-4 py-3">
      <Skeleton variant="text" width="40%" height={20} />
    </td>
  </tr>
);

// Spinner component
export const Spinner: React.FC<{ size?: "sm" | "md" | "lg" }> = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-4 border-gray-200 border-t-red-600 rounded-full animate-spin`}
      />
    </div>
  );
};
