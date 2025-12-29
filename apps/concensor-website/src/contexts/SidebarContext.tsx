'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface SidebarContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userManuallyClosed, setUserManuallyClosed] = useState(false);
  
  // Use refs to track state without causing re-renders
  const sidebarOpenRef = useRef(false);
  const isMobileRef = useRef(false);

  // Initialize on mount only
  useEffect(() => {
    const initialWidth = window.innerWidth;
    const initialMobile = initialWidth < 1024;
    isMobileRef.current = initialMobile;
    setIsMobile(initialMobile);
    
    if (initialWidth >= 1024) {
      setSidebarOpen(true); // Open by default on desktop
      sidebarOpenRef.current = true;
    } else {
      setSidebarOpen(false); // Closed by default on mobile
      sidebarOpenRef.current = false;
    }
  }, []); // Only run on mount

  // Handle resize separately
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 1024;
      const wasMobile = isMobileRef.current;
      const currentOpen = sidebarOpenRef.current;
      
      isMobileRef.current = mobile;
      setIsMobile(mobile);

      if (width >= 1024) {
        // Desktop: 
        // - If resizing from mobile and sidebar was open, keep it open
        // - Otherwise, open unless user manually closed
        if (wasMobile && currentOpen) {
          // Mobile → Desktop: keep open if it was open
          setSidebarOpen(true);
          sidebarOpenRef.current = true;
        } else if (!userManuallyClosed) {
          // Desktop: auto-open unless manually closed
          setSidebarOpen(true);
          sidebarOpenRef.current = true;
        }
        // If userManuallyClosed is true, don't change state (respect user's choice)
      } else {
        // Mobile: always close when resizing to mobile
        setSidebarOpen(false);
        sidebarOpenRef.current = false;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [userManuallyClosed]);

  // Update refs when state changes
  useEffect(() => {
    sidebarOpenRef.current = sidebarOpen;
  }, [sidebarOpen]);

  useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const newState = !prev;
      sidebarOpenRef.current = newState; // Update ref immediately
      // Track if user manually closed on desktop
      if (window.innerWidth >= 1024 && !newState) {
        setUserManuallyClosed(true);
      } else if (window.innerWidth >= 1024 && newState) {
        setUserManuallyClosed(false);
      }
      return newState;
    });
  };

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen, toggleSidebar, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

