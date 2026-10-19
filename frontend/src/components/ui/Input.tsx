import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  type AriaAttributes,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

interface FieldProps {
  label?: ReactNode;
  error?: string;
  hint?: string;
  children: ReactElement<{
    id?: string;
    'aria-describedby'?: AriaAttributes['aria-describedby'];
    'aria-invalid'?: AriaAttributes['aria-invalid'];
  }>;
}

export function Field({ label, error, hint, children }: FieldProps) {
  const generatedId = useId();
  const inputId = children.props.id || `field-${generatedId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [children.props['aria-describedby'], hintId, errorId].filter(Boolean).join(' ') || undefined;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: inputId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : children.props['aria-invalid'],
      })
    : children;

  return (
    <div className="block">
      {label && <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-foreground">{label}</label>}
      {control}
      {hint && <p id={hintId} className="mt-1.5 text-sm text-muted-foreground">{hint}</p>}
      {error && <p id={errorId} role="alert" className="mt-1.5 text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}

const baseInput =
  'w-full min-h-11 rounded-ui border border-border bg-surface px-4 py-3 text-base text-foreground transition-[border-color,box-shadow,background-color] duration-fast placeholder:text-slate-400 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input ref={ref} {...props} className={`${baseInput} ${className}`} />
  ),
);

Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', ...props }, ref) => (
    <select ref={ref} {...props} className={`${baseInput} ${className}`} />
  ),
);

Select.displayName = 'Select';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => (
    <textarea ref={ref} {...props} className={`${baseInput} resize-none ${className}`} />
  ),
);

Textarea.displayName = 'Textarea';
