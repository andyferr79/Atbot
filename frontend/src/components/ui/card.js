import React from "react";
import clsx from "clsx";

export const Card = ({ children, className = "", ...props }) => {
  return (
    <div
      className={clsx(
        "rounded-xl border bg-white text-black shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardContent = ({ children, className = "", ...props }) => {
  return (
    <div className={clsx("p-4", className)} {...props}>
      {children}
    </div>
  );
};
