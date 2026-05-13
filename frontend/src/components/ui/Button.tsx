import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'normal' | 'large';

interface BaseButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
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
  className = '',
  ...props
}: Props) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

  const variantClasses = {
    primary: 'bg-[#2563EB] text-white shadow-md shadow-blue-600/20 hover:bg-[#1E3A8A] focus:ring-[#2563EB]',
    secondary: 'border border-[#E2E8F0] bg-white text-[#0F172A] shadow-sm hover:border-slate-300 hover:bg-slate-50 focus:ring-slate-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
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

  if (href) {
    return (
      <a href={href} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}

export default Button;
