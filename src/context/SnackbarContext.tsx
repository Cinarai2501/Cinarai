'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

type SnackbarSeverity = 'error' | 'success' | 'info';

interface SnackbarMessage {
  id: number;
  message: string;
  severity: SnackbarSeverity;
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
    setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 5000);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {/* Toast container — fixed bottom, mobile-safe */}
      <div
        aria-live="polite"
        className="fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-4"
        style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            role="alert"
            className={`w-full max-w-lg rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg animate-fade-in-up ${COLORS[item.severity]}`}
            style={{ marginBottom: '0.25rem' }}
          >
            {item.message}
          </div>
        ))}
      </div>
    </SnackbarContext.Provider>
  );
}
