import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const isSuccess = toast.type === 'success';

  return (
    <div className={`toast ${isSuccess ? 'toast-success' : 'toast-error'}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1 }}>
        {isSuccess ? (
          <CheckCircle size={18} color="var(--success)" />
        ) : (
          <AlertCircle size={18} color="var(--danger)" />
        )}
        <span style={{ fontSize: '0.88rem' }}>{toast.message}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#cbd5e1',
          display: 'flex',
          alignItems: 'center',
          padding: '2px'
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
