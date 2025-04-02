import React from "react";
import clsx from "clsx";

export const Badge = ({
  children,
  variant = "default",
  className = "",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-colors";

  const variants = {
    default: "bg-primary text-white",
    secondary: "bg-secondary text-black",
    outline: "border border-gray-300 text-gray-700",
  };

  return (
    <span
      className={clsx(baseClasses, variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
};
