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
    'inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-ui font-semibold transition-[color,background-color,border-color,box-shadow,opacity] duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55';

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-blue-700 active:bg-blue-800',
    secondary: 'border border-border bg-surface text-foreground shadow-sm hover:border-slate-300 hover:bg-muted',
    danger: 'bg-danger text-white shadow-sm hover:bg-red-700 active:bg-red-800',
    ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  };

  const sizeClasses = {
    sm: 'px-3.5 py-2 text-sm',
    normal: 'px-5 py-2.5 text-sm',
    large: 'min-h-12 px-6 py-3 text-base',
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
