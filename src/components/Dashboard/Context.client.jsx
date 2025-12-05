"use client";

import React, { createContext, useState, useCallback } from "react";

export const ContentContext = createContext({
  activeContent: null,
  setActiveContent: () => {},
});

export default function ContentProvider({ children }) {
  const [activeContent, setActiveContent] = useState(null);

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
