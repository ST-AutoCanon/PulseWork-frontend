"use client";

import React, { createContext, useState, useCallback } from "react";

/**
 * ContentContext
 * - Provides `activeContent` (React node) and `setActiveContent(node)` to update it.
 * - This file is a client component (uses hooks and should only be imported from other client components).
 */

export const ContentContext = createContext({
  activeContent: null,
  setActiveContent: () => {},
});

export default function ContentProvider({ children }) {
  const [activeContent, setActiveContent] = useState(null);

  // wrap setter in useCallback to keep stable reference for consumers
  const setActiveContentCB = useCallback((node) => {
    setActiveContent(node);
  }, []);

  return (
    <ContentContext.Provider
      value={{ activeContent, setActiveContent: setActiveContentCB }}
    >
      {children}
    </ContentContext.Provider>
  );
}
