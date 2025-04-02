import React from "react";

export const Switch = ({ checked, onCheckedChange }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out
        ${
          checked ? "bg-primary border-primary" : "bg-gray-200 border-gray-200"
        }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition
          ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
};
