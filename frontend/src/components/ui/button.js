import React from "react";
import clsx from "clsx";

export const Button = ({
  children,
  variant = "default",
  size = "md",
  className = "",
  ...props
}) => {
  const variants = {
    default: "bg-primary text-white hover:bg-primary/90",
    link: "text-primary underline underline-offset-2 hover:opacity-80",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-800",
  };

  const sizes = {
    sm: "text-sm px-3 py-1.5",
    md: "text-base px-4 py-2",
    lg: "text-lg px-5 py-3",
  };

  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
