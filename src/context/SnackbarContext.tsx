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

const SEVERITY_STYLES: Record<SnackbarSeverity, { border: string; iconBg: string; iconText: string }> = {
  error: {
    border: 'border-red-300',
    iconBg: 'bg-red-100',
    iconText: 'text-red-700',
  },
  success: {
    border: 'border-[#22C55E]',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-700',
  },
  info: {
    border: 'border-sky-300',
    iconBg: 'bg-sky-100',
    iconText: 'text-sky-700',
  },
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
      <div
        aria-atomic="true"
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed left-4 right-4 z-40 flex flex-col items-start gap-3 sm:left-auto sm:right-6 sm:top-6 sm:items-end"
        style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        {items.map((item) => {
          const styles = SEVERITY_STYLES[item.severity];

          return (
            <div
              key={item.id}
              role="status"
              className={`inline-flex min-h-[48px] w-fit max-w-[calc(100vw-32px)] items-center gap-3 rounded-[16px] border bg-white/95 px-4 py-3 text-sm font-semibold leading-5 text-neutral-900 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-sm transition-all duration-200 ease-out sm:min-h-[56px] sm:max-w-[380px] animate-toast-in ${styles.border} ${item.closing ? 'translate-y-[-6px] opacity-0' : 'translate-y-0 opacity-100'}`}
            >
              <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-base ${styles.iconBg} ${styles.iconText}`}>
                {item.severity === 'error' ? '!' : '✓'}
              </span>
              <span className="min-w-0 whitespace-nowrap sm:whitespace-normal">{item.message}</span>
            </div>
          );
        })}
      </div>
    </SnackbarContext.Provider>
  );
}
