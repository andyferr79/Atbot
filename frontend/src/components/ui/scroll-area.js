import React from "react";
import clsx from "clsx";

export const ScrollArea = ({ children, className = "", ...props }) => {
  return (
    <div
      className={clsx(
        "overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 rounded-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
