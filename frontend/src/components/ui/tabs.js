import React, { createContext, useContext, useState } from "react";
import clsx from "clsx";

const TabsContext = createContext();

export const Tabs = ({ defaultValue, children }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className = "" }) => {
  return (
    <div className={clsx("inline-flex items-center gap-2", className)}>
      {children}
    </div>
  );
};

export const TabsTrigger = ({ value, children, className = "" }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
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

export const TabsContent = ({ value, children, className = "" }) => {
  const { activeTab } = useContext(TabsContext);
  if (value !== activeTab) return null;

  return <div className={clsx("mt-4", className)}>{children}</div>;
};
