import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import Button from './Button';
import QuickExitButton from './QuickExitButton';
import { useQuickExitVisibility } from './useQuickExitVisibility';
import { lockBodyScroll } from '../../utils/scrollLock';

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  tone?: 'danger' | 'primary' | 'success';
  compact?: boolean;
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

interface DialogProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement>;
  role?: 'dialog' | 'alertdialog';
  maxWidthClassName?: string;
  headerIcon?: ReactNode;
  variant?: 'default' | 'form' | 'compact';
}

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function Dialog({
  title,
  description,
  children,
  footer,
  onClose,
  initialFocusRef,
  role = 'dialog',
  maxWidthClassName = 'max-w-md',
  headerIcon,
  variant = 'default',
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();
  const showQuickExit = useQuickExitVisibility();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const unlock = lockBodyScroll();
    

    const requestedFocus = initialFocusRef?.current;
    const focusTarget = requestedFocus && !requestedFocus.matches(':disabled')
      ? requestedFocus
      : dialog.querySelector<HTMLElement>(focusableSelector) ?? dialog;
    focusTarget.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
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
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
      unlock();
      requestAnimationFrame(() => previouslyFocused?.focus());
    };
  }, [initialFocusRef]);

  return (
    <div className={`fixed inset-0 flex items-center justify-center overscroll-contain p-4 ${role === 'alertdialog' ? 'z-[80]' : 'z-50'}`}>
      <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm" aria-hidden="true" />

      <div
        ref={dialogRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`relative z-10 flex w-full flex-col overflow-hidden border border-border bg-surface text-left shadow-2xl ${variant === 'form' ? 'max-h-[94dvh] rounded-3xl' : 'max-h-[90dvh] rounded-ui-lg'} ${maxWidthClassName}`}
      >
        <div className={`shrink-0 ${variant === 'form' ? 'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 bg-white px-6 pb-5 pt-6 sm:px-8 sm:pt-8' : 'flex items-start justify-between gap-3 border-b border-border bg-muted/45 px-6 py-5'}`}>
          {headerIcon ? <div className={`shrink-0 ${variant === 'form' ? 'col-start-1 row-start-1 sm:row-span-2' : ''}`}>{headerIcon}</div> : null}
          <div className={variant === 'form' ? 'contents' : 'min-w-0 flex-1'}>
            <h2 id={titleId} className={`text-pretty font-bold text-foreground ${variant === 'form' ? 'col-start-2 row-start-1 text-xl tracking-tight sm:text-3xl' : 'text-xl leading-7'}`}>{title}</h2>
            {description ? (
              <p id={descriptionId} className={`text-sm leading-6 text-muted-foreground ${variant === 'form' ? 'col-span-3 row-start-2 sm:col-span-1 sm:col-start-2' : 'mt-1'}`}>{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label={`Fechar ${title}`}
            onClick={onClose}
            className={`-mr-2 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-ui text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${variant === 'form' ? 'col-start-3 row-start-1 self-start sm:row-span-2' : ''}`}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {showQuickExit && variant !== 'compact' && <div className="flex shrink-0 justify-end px-6 py-2"><QuickExitButton /></div>}
        {children && <div className={`min-h-0 overflow-y-auto px-6 ${variant === 'form' ? 'pb-4 sm:px-8' : 'py-5'}`}>{children}</div>}
        {footer ? (
          <div className={`flex shrink-0 gap-3 border-t border-border px-6 py-4 ${variant === 'compact' ? 'flex-col-reverse items-stretch sm:flex-row sm:items-center sm:justify-between' : 'flex-col-reverse sm:flex-row sm:justify-end'} ${variant === 'form' ? 'bg-white sm:px-8' : 'bg-muted/30'}`}>
            {variant === 'compact' ? <>
              {showQuickExit && <div className="flex justify-center sm:justify-start"><QuickExitButton /></div>}
              <div className="grid grid-cols-2 gap-3 sm:ml-auto sm:flex">{footer}</div>
            </> : footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ConfirmDialog({ config, onClose }: ConfirmDialogProps) {
  const iconStyles = config.tone === 'danger'
    ? 'bg-red-50 text-danger ring-red-100'
    : config.tone === 'success'
      ? 'bg-emerald-50 text-success ring-emerald-100'
      : 'bg-blue-50 text-primary ring-blue-100';

  const icon = (
    <div className={`${config.compact ? '' : 'mb-5'} flex h-12 w-12 items-center justify-center rounded-ui ring-1 ${iconStyles}`}>
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
  );

  return (
    <Dialog
      role="alertdialog"
      variant={config.compact ? 'compact' : 'default'}
      headerIcon={config.compact ? icon : undefined}
      title={config.title}
      description={config.message}
      onClose={onClose}
      footer={(
        <>
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
        </>
      )}
    >
      {config.compact && !config.details?.length ? null : <>
        {!config.compact && icon}

        {config.details && config.details.length > 0 ? (
          <dl className="overflow-hidden rounded-ui border border-border bg-muted/55">
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
      </>}
    </Dialog>
  );
}
