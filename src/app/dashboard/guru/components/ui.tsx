import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import Image from 'next/image';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

export function LoadingState({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" aria-label={label}>
      {children}
    </div>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-ui-border bg-surface shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  const variants = {
    primary: 'bg-brand-700 text-white hover:bg-brand-800 focus-visible:outline-brand-700',
    secondary: 'border border-ui-border bg-white text-ink hover:bg-canvas focus-visible:outline-brand-700',
    ghost: 'text-brand-700 hover:bg-brand-50 focus-visible:outline-brand-700',
  };
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function SectionHeader({
  title,
  description,
  action,
  className = '',
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-base font-bold leading-6 text-ink sm:text-lg">{title}</h2>
        {description && <p className="mt-1 text-sm leading-5 text-secondary-content">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  tone = 'brand',
  className = '',
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone?: 'brand' | 'success' | 'warning' | 'info';
  className?: string;
}) {
  const toneStyles = {
    brand: 'bg-brand-100 text-brand-800',
    success: 'bg-success-50 text-success-800',
    warning: 'bg-warning-50 text-warning-800',
    info: 'bg-info-50 text-info-800',
  };
  return (
    <Card className={`flex min-h-[88px] items-center gap-3 p-3 sm:p-4 ${className}`}>
      <span className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl text-lg font-bold ${toneStyles[tone]}`} aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-6 text-ink sm:text-xl">{value}</p>
        <p className="text-xs leading-4 text-secondary-content">{label}</p>
      </div>
    </Card>
  );
}

export function Avatar({
  name,
  src,
  size = 'md',
  className = '',
}: {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-[72px] w-[72px] text-2xl',
  };
  const imageSrc = src?.trim() || null;
  return (
    <span
      aria-hidden="true"
      className={`relative grid flex-shrink-0 place-items-center overflow-hidden rounded-full bg-brand-100 font-bold text-brand-800 ${sizes[size]} ${className}`}
    >
      {imageSrc
        ? <Image src={imageSrc} alt="" fill unoptimized sizes={size === 'lg' ? '72px' : '40px'} className="object-cover" />
        : (name.trim().charAt(0).toLocaleUpperCase('id') || '?')}
    </span>
  );
}

export function StatusBadge({
  status,
}: {
  status: 'not_started' | 'learning' | 'attention' | 'completed';
}) {
  const labels = {
    not_started: 'Belum mulai',
    learning: 'Sedang belajar',
    attention: 'Perlu perhatian',
    completed: 'Tuntas',
  };
  const styles = {
    not_started: 'bg-neutral-100 text-neutral-700',
    learning: 'bg-info-50 text-info-800',
    attention: 'bg-warning-50 text-warning-800',
    completed: 'bg-success-50 text-success-800',
  };
  return (
    <span className={`inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function SearchInput({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      type={props.type ?? 'search'}
      className={`min-h-11 w-full rounded-xl border border-ui-border bg-white px-3 text-sm text-ink placeholder:text-secondary-content focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-neutral-100 ${className}`}
    />
  );
}

export function EmptyState({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" className={`rounded-xl bg-canvas px-4 py-6 text-center text-sm leading-5 text-secondary-content ${className}`}>
      {children}
    </div>
  );
}

export function ErrorState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div role="alert" className="rounded-xl border border-danger-200 bg-danger-50 p-4">
      <p className="text-sm font-bold text-danger-800">{title}</p>
      <p className="mt-1 break-words text-sm text-danger-700">{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ProgressBar({
  value,
  label = 'Progress',
  className = '',
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const pct = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={`h-2 overflow-hidden rounded-full bg-brand-100 ${className}`}
    >
      <div
        className="h-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-700 transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 56,
  stroke = 5,
  className = '',
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className={className} role="img" aria-label={`Progress ${Math.round(pct)}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#1769B0"
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={size * 0.22}
        fontWeight="700"
        fill="#1769B0"
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

export function Badge({
  children,
  color = 'primary',
}: {
  children: React.ReactNode;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'info';
}) {
  const map = {
    primary: 'bg-brand-50 text-brand-700',
    secondary: 'bg-info-50 text-info-800',
    accent: 'bg-accent-50 text-accent-700',
    success: 'bg-success-50 text-success-800',
    warning: 'bg-warning-50 text-warning-800',
    error: 'bg-error-50 text-error-700',
    info: 'bg-info-50 text-info-800',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[color]}`}>
      {children}
    </span>
  );
}
