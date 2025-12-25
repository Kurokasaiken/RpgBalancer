import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DragContextType {
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}

const DragContext = createContext<DragContextType | undefined>(undefined);

export function DragProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  return (
    <DragContext.Provider value={{ activeId, setActiveId }}>
      {children}
    </DragContext.Provider>
  );
}

export function useDragContext() {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error('useDragContext must be used within DragProvider');
  }
  return context;
}
