import { useState } from 'react';
import Button from '../components/ui/Button';

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  tone?: 'danger' | 'primary' | 'success';
  details?: Array<{
    label: string;
    value: string;
    tone?: 'neutral' | 'danger' | 'primary' | 'success';
  }>;
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ConfirmConfig | null>(null);

  const confirm = (options: ConfirmConfig) => {
    setConfig(options);
    setIsOpen(true);
  };

  const ConfirmModal = () => {
    if (!isOpen || !config) return null;

    const iconStyles = config.tone === 'danger'
      ? 'bg-red-50 text-red-600 ring-red-100'
      : config.tone === 'success'
        ? 'bg-emerald-50 text-emerald-600 ring-emerald-100'
        : 'bg-blue-50 text-blue-600 ring-blue-100';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-md transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          className="relative z-10 w-full max-w-md animate-[fadeIn_.2s_ease-out] overflow-hidden rounded-3xl border border-white/70 bg-white p-6 text-left shadow-2xl shadow-slate-950/25 ring-1 ring-slate-900/5 sm:p-7"
        >
          <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${iconStyles}`}>
            {config.tone === 'danger' ? (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.8 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
              </svg>
            ) : config.tone === 'success' ? (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
              </svg>
            ) : (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
              </svg>
            )}
          </div>
          <h3 id="confirm-title" className="text-xl font-bold leading-7 text-slate-950">
            {config.title}
          </h3>
          <div className="mt-2">
            <p className="text-sm leading-6 text-slate-600">
              {config.message}
            </p>
          </div>

          {config.details && config.details.length > 0 && (
            <dl className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80">
              {config.details.map((detail, index) => {
                const valueTone = detail.tone === 'danger'
                  ? 'text-red-700'
                  : detail.tone === 'success'
                    ? 'text-emerald-700'
                    : detail.tone === 'primary'
                      ? 'text-blue-700'
                      : 'text-slate-900';
                return (
                  <div key={`${detail.label}-${index}`} className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-4 py-3 last:border-b-0">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{detail.label}</dt>
                    <dd className={`text-right text-sm font-semibold ${valueTone}`}>{detail.value}</dd>
                  </div>
                );
              })}
            </dl>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button 
              variant="secondary" 
              onClick={() => setIsOpen(false)}
            >
              {config.cancelText || 'Cancelar'}
            </Button>
            <Button 
              variant={config.tone === 'danger' ? 'danger' : 'primary'} 
              onClick={() => {
                config.onConfirm();
                setIsOpen(false);
              }}
            >
              {config.confirmText || 'Confirmar'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return { confirm, ConfirmModal };
}
