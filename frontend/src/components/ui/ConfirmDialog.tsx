import { useEffect, useId, useRef } from 'react';
import Button from './Button';

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

interface ConfirmDialogProps {
  config: ConfirmConfig;
  onClose: () => void;
}

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function ConfirmDialog({ config, onClose }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.querySelector<HTMLElement>(focusableSelector)?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const iconStyles = config.tone === 'danger'
    ? 'bg-red-50 text-danger ring-red-100'
    : config.tone === 'success'
      ? 'bg-emerald-50 text-success ring-emerald-100'
      : 'bg-blue-50 text-primary ring-blue-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overscroll-contain p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Fechar confirmação"
        className="fixed inset-0 cursor-default bg-slate-950/55 backdrop-blur-sm transition-opacity duration-fast"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-ui-lg border border-border bg-surface p-6 text-left shadow-2xl sm:p-7"
      >
        <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-ui ring-1 ${iconStyles}`}>
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

        <h2 id={titleId} className="text-pretty text-xl font-bold leading-7 text-foreground">{config.title}</h2>
        <p id={descriptionId} className="mt-2 text-sm leading-6 text-muted-foreground">{config.message}</p>

        {config.details && config.details.length > 0 ? (
          <dl className="mt-5 overflow-hidden rounded-ui border border-border bg-muted/55">
            {config.details.map((detail, index) => {
              const valueTone = detail.tone === 'danger'
                ? 'text-danger'
                : detail.tone === 'success'
                  ? 'text-success'
                  : detail.tone === 'primary'
                    ? 'text-primary'
                    : 'text-foreground';
              return (
                <div key={`${detail.label}-${index}`} className="flex items-start justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0">
                  <dt className="text-sm font-medium text-muted-foreground">{detail.label}</dt>
                  <dd className={`break-words text-right text-sm font-semibold ${valueTone}`}>{detail.value}</dd>
                </div>
              );
            })}
          </dl>
        ) : null}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>{config.cancelText || 'Cancelar'}</Button>
          <Button
            variant={config.tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => {
              config.onConfirm();
              onClose();
            }}
          >
            {config.confirmText || 'Confirmar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
