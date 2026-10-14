import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'normal' | 'large';

interface BaseButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

type ButtonProps = BaseButtonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type LinkButtonProps = BaseButtonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

type Props = ButtonProps | LinkButtonProps;

function Button({
  children,
  href,
  variant = 'primary',
  size = 'normal',
  fullWidth = false,
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}: Props) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 hover:shadow-md hover:shadow-blue-500/25 focus:ring-blue-500',
    secondary: 'border border-[#E2E8F0] bg-white text-[#0F172A] shadow-sm hover:border-slate-300 hover:bg-slate-50 focus:ring-slate-300',
    danger: 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm shadow-red-500/20 hover:from-red-700 hover:to-rose-700 focus:ring-red-500',
    ghost: 'text-[#475569] hover:bg-slate-100 hover:text-[#0F172A] focus:ring-slate-300',
  };

  const sizeClasses = {
    sm: 'px-3.5 py-2 text-xs',
    normal: 'px-5 py-2.5 text-sm',
    large: 'px-6 py-3 text-base',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
    fullWidth ? 'w-full' : ''
  } ${className}`;

  const hasEnhancedContent = isLoading || Boolean(leftIcon) || Boolean(rightIcon);

  if (href && !hasEnhancedContent) {
    return (
      <a href={href} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  if (!href && !hasEnhancedContent) {
    return (
      <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
        {children}
      </button>
    );
  }

  const content = (
    <>
      {isLoading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-90" fill="currentColor" d="M21 12a9 9 0 0 0-9-9v3a6 6 0 0 1 6 6h3Z" />
        </svg>
      ) : leftIcon}
      {isLoading ? <span>{loadingText || children}</span> : children}
      {!isLoading && rightIcon}
    </>
  );

  if (href) {
    return (
      <a
        href={isLoading ? undefined : href}
        className={`${classes} ${isLoading ? 'pointer-events-none' : ''}`}
        aria-busy={isLoading}
        aria-disabled={isLoading}
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </a>
    );
  }

  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      className={classes}
      {...buttonProps}
      disabled={isLoading || buttonProps.disabled}
      aria-busy={isLoading}
    >
      {content}
    </button>
  );
}

export default Button;
