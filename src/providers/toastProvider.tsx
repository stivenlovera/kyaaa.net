"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { FaBan, FaCheck, FaInfo, FaQuestion, FaTimes } from "react-icons/fa";

// Aviso flotante (abajo a la derecha) que no bloquea la página, a diferencia de alertProvider.
// Se cierra solo a los TOAST_DURATION_MS o con su botón; si llegan varios se apilan (máximo TOAST_MAX).
type ToastType = "success" | "warning" | "danger" | "info";

interface IToast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const TOAST_DURATION_MS = 3500;
const TOAST_MAX = 3;

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <FaCheck className="text-green-400" />,
  warning: <FaQuestion className="text-yellow-400" />,
  danger: <FaBan className="text-red-500" />,
  info: <FaInfo className="text-blue-400" />,
};

function ToastItem({ toast, onClose }: { toast: IToast, onClose: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div
      className="pointer-events-auto flex items-center gap-3 w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg shadow-md shadow-black"
      role="status"
    >
      <div className="inline-flex shrink-0 items-center justify-center w-8 h-8 bg-neutral-900 rounded-lg">
        {ICONS[toast.type]}
      </div>
      <div className="flex-1 text-sm">
        {toast.message}
      </div>
      <button
        onClick={() => { onClose(toast.id) }}
        className="btn-primary-icon rounded-lg p-1"
        aria-label="Cerrar"
      >
        <FaTimes size={14} color="white" />
      </button>
    </div>
  );
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<IToast[]>([]);
  const nextId = useRef(0);

  const closeToast = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = nextId.current++;
    setToasts((list) => [...list, { id, message, type }].slice(-TOAST_MAX));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-4 right-4 sm:left-auto sm:w-80 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={closeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
