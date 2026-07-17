'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

type SnackbarSeverity = 'error' | 'success' | 'info';

interface SnackbarMessage {
  id: number;
  message: string;
  severity: SnackbarSeverity;
  closing?: boolean;
}

interface SnackbarContextValue {
  showSnackbar: (message: string, severity?: SnackbarSeverity) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider');
  return ctx;
}

const COLORS: Record<SnackbarSeverity, string> = {
  error:   'bg-error-600 text-white',
  success: 'bg-accent-600 text-white',
  info:    'bg-neutral-800 text-white',
};

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SnackbarMessage[]>([]);
  const counter = useRef(0);

  const showSnackbar = useCallback((message: string, severity: SnackbarSeverity = 'info') => {
    const id = ++counter.current;
    setItems((prev) => [...prev, { id, message, severity }]);

    window.setTimeout(() => {
      setItems((prev) => prev.map((item) => item.id === id ? { ...item, closing: true } : item));
    }, 1800);

    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 2000);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {/* Toast container — fixed bottom, mobile-safe */}
      <div
        aria-live="polite"
        role="status"
        className="fixed top-4 left-4 right-4 z-40 flex flex-col items-center gap-3 sm:left-auto sm:right-6"
        style={{ top: 'max(1.5rem, env(safe-area-inset-top) + 12px)' }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            role="alert"
            className={
              `w-fit max-w-[320px] sm:max-w-[380px] rounded-[16px] border border-[#22C55E] bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-[0_12px_40px_rgba(15,23,42,0.12)] transition duration-200 ease-in-out animate-toast-in flex items-center gap-3 ${item.closing ? 'opacity-0 -translate-y-1' : 'opacity-100 translate-y-0'}`
            }
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              ✓
            </span>
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </SnackbarContext.Provider>
  );
}
