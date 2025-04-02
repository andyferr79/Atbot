import React, { useState } from "react";
import clsx from "clsx";

export const Tabs = ({ defaultValue, children }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  // Inietta `activeTab` e `setActiveTab` nei children via cloneElement
  const childrenWithProps = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    return React.cloneElement(child, { activeTab, setActiveTab });
  });

  return <div>{childrenWithProps}</div>;
};

export const TabsList = ({ children, className = "" }) => {
  return (
    <div className={clsx("inline-flex items-center gap-2", className)}>
      {children}
    </div>
  );
};

export const TabsTrigger = ({
  value,
  activeTab,
  setActiveTab,
  children,
  className = "",
}) => {
  const isActive = value === activeTab;

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={clsx(
        "px-3 py-1.5 rounded-md text-sm font-medium",
        isActive
          ? "bg-primary text-white"
          : "bg-muted text-muted-foreground hover:bg-accent",
        className
      )}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, activeTab, children, className = "" }) => {
  if (value !== activeTab) return null;

  return <div className={clsx("mt-4", className)}>{children}</div>;
};
