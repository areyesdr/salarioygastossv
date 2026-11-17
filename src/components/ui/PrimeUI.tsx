import React, { useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import {
  Chart,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  DoughnutController,
  BarController,
  type ChartConfiguration,
  type ChartType,
} from 'chart.js';
import { useTheme } from '../../context/ThemeContext.tsx';

Chart.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  DoughnutController,
  BarController
);

/* -------------------------------------------------------------------------- */
/*                                 PrimeButton                                */
/* -------------------------------------------------------------------------- */
export type PrimeButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type PrimeButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface PrimeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PrimeButtonVariant;
  size?: PrimeButtonSize;
  fullWidth?: boolean;
}

const BUTTON_VARIANTS: Record<PrimeButtonVariant, string> = {
  primary:
    'bg-emerald-600 dark:bg-emerald-600 text-white border border-transparent hover:bg-emerald-500 dark:hover:bg-emerald-500 shadow-xs hover:shadow-sm active:translate-y-[0.5px]',
  secondary:
    'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 dark:border dark:border-slate-700 hover:bg-slate-800 dark:hover:bg-slate-700 shadow-xs active:translate-y-[0.5px]',
  outline:
    'bg-transparent text-[var(--color-ink)] border border-[var(--color-rule)] hover:bg-[var(--color-surface)] hover:border-slate-400 dark:hover:border-slate-600 active:translate-y-[0.5px]',
  ghost:
    'bg-transparent text-[var(--color-muted)] border border-transparent hover:text-[var(--color-ink)] hover:bg-[var(--color-surface)] active:translate-y-[0.5px]',
  danger:
    'bg-rose-600 text-white border border-transparent hover:bg-rose-500 shadow-xs active:translate-y-[0.5px]',
  success:
    'bg-emerald-600 text-white border border-transparent hover:bg-emerald-500 shadow-xs active:translate-y-[0.5px]',
};

const BUTTON_SIZES: Record<PrimeButtonSize, string> = {
  xs: 'px-2 py-1 text-[11px] rounded-md gap-1',
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-sm rounded-xl gap-2',
};

export function PrimeButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
  children,
  disabled,
  ...rest
}: PrimeButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium cursor-pointer select-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
        BUTTON_VARIANTS[variant]
      } ${BUTTON_SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 PrimeInput                                 */
/* -------------------------------------------------------------------------- */
interface PrimeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: 'sm' | 'md' | 'lg';
  mono?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function PrimeInput({
  inputSize = 'md',
  mono = false,
  leftIcon,
  rightIcon,
  className = '',
  ...rest
}: PrimeInputProps) {
  const sizeCls =
    inputSize === 'sm'
      ? 'px-2.5 py-1.5 text-xs rounded-lg'
      : inputSize === 'lg'
        ? 'px-3.5 py-2.5 text-base rounded-xl'
        : 'px-3 py-2 text-sm rounded-lg';

  const padLeft = leftIcon ? (inputSize === 'sm' ? 'pl-8' : 'pl-9') : '';
  const padRight = rightIcon ? (inputSize === 'sm' ? 'pr-8' : 'pr-9') : '';

  const inputEl = (
    <input
      className={`w-full bg-[var(--color-card)] text-[var(--color-ink)] border border-[var(--color-rule)] placeholder:text-[var(--color-muted)] hover:border-slate-400 dark:hover:border-slate-600 focus:border-[var(--color-focus)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] transition-colors duration-150 disabled:opacity-60 ${sizeCls} ${padLeft} ${padRight} ${
        mono ? 'font-mono tabular-nums' : ''
      } ${className}`}
      {...rest}
    />
  );

  if (!leftIcon && !rightIcon) return inputEl;

  return (
    <div className="relative w-full flex items-center">
      {leftIcon && (
        <span className="absolute left-3 text-[var(--color-muted)] pointer-events-none flex items-center justify-center">
          {leftIcon}
        </span>
      )}
      {inputEl}
      {rightIcon && (
        <span className="absolute right-3 text-[var(--color-muted)] flex items-center justify-center">
          {rightIcon}
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 PrimeSelect                                */
/* -------------------------------------------------------------------------- */
interface PrimeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  selectSize?: 'sm' | 'md';
}

export function PrimeSelect({
  selectSize = 'md',
  className = '',
  children,
  ...rest
}: PrimeSelectProps) {
  const sizeCls = selectSize === 'sm' ? 'px-2.5 py-1.5 text-xs rounded-lg' : 'px-3 py-2 text-sm rounded-lg';
  return (
    <select
      className={`w-full bg-[var(--color-card)] text-[var(--color-ink)] border border-[var(--color-rule)] hover:border-[var(--color-muted)] focus:border-[var(--color-focus)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] transition-colors duration-150 cursor-pointer ${sizeCls} ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

/* -------------------------------------------------------------------------- */
/*                                PrimeCheckbox                               */
/* -------------------------------------------------------------------------- */
interface PrimeCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
  className?: string;
}

export function PrimeCheckbox({
  checked,
  onChange,
  id,
  disabled = false,
  title,
  ariaLabel,
  className = '',
}: PrimeCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
        checked
          ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-accent-ink)]'
          : 'bg-[var(--color-card)] border-[var(--color-rule)] hover:border-[var(--color-muted)]'
      } ${className}`}
    >
      {checked && <Check size={11} strokeWidth={3} />}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 PrimeSwitch                                */
/* -------------------------------------------------------------------------- */
interface PrimeSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export function PrimeSwitch({
  checked,
  onChange,
  id,
  disabled = false,
  ariaLabel,
}: PrimeSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 flex items-center border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
        checked
          ? 'bg-[var(--color-accent)] border-[var(--color-accent)] justify-end'
          : 'bg-[var(--color-paper-2)] border-[var(--color-rule)] justify-start'
      }`}
    >
      <span className="w-3.5 h-3.5 rounded-full bg-white shadow-xs transition-transform duration-200" />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                              PrimeSelectButton                             */
/* -------------------------------------------------------------------------- */
export interface SelectOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

interface PrimeSelectButtonProps<T extends string> {
  value: T;
  onChange: (val: T) => void;
  options: readonly SelectOption<T>[];
  size?: 'xs' | 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}

export function PrimeSelectButton<T extends string>({
  value,
  onChange,
  options,
  size = 'sm',
  fullWidth = false,
  className = '',
}: PrimeSelectButtonProps<T>) {
  const padCls =
    size === 'xs'
      ? 'px-2.5 py-1 text-[11px]'
      : size === 'sm'
        ? 'px-3 py-1.5 text-xs'
        : 'px-4 py-2 text-sm';

  return (
    <div
      role="group"
      className={`inline-flex items-center p-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-rule)] gap-1 ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium cursor-pointer transition-all duration-150 ${padCls} ${
              fullWidth ? 'flex-1' : ''
            } ${
              active
                ? 'bg-[var(--color-card)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule)]'
                : 'bg-transparent text-[var(--color-muted)] border border-transparent hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-2)]/50'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  PrimeCard                                 */
/* -------------------------------------------------------------------------- */
interface PrimeCardProps {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}

export function PrimeCard({ children, className = '', padded = false }: PrimeCardProps) {
  return (
    <div className={`surface-card overflow-hidden transition-all duration-200 ${padded ? 'p-4 sm:p-5' : ''} ${className}`}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  PrimeTag                                  */
/* -------------------------------------------------------------------------- */
export type PrimeTagSeverity = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

interface PrimeTagProps {
  children: React.ReactNode;
  severity?: PrimeTagSeverity;
  className?: string;
}

const TAG_SEVERITIES: Record<PrimeTagSeverity, string> = {
  neutral: 'bg-[var(--color-surface)] text-[var(--color-ink-2)] border-[var(--color-rule)]',
  info: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-transparent',
  success: 'bg-[var(--color-emerald-soft)] text-[var(--color-emerald)] border-transparent',
  warning: 'bg-[var(--color-amber-soft)] text-[var(--color-amber)] border-transparent',
  danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-transparent',
};

export function PrimeTag({ children, severity = 'neutral', className = '' }: PrimeTagProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${TAG_SEVERITIES[severity]} ${className}`}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                                PrimeMessage                                */
/* -------------------------------------------------------------------------- */
interface PrimeMessageProps {
  severity?: 'info' | 'success' | 'warning' | 'danger';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const MESSAGE_SEVERITIES = {
  info: 'bg-[var(--color-accent-soft)] border-[var(--color-accent)]/30 text-[var(--color-ink)]',
  success: 'bg-[var(--color-emerald-soft)] border-[var(--color-emerald)]/30 text-[var(--color-ink)]',
  warning: 'bg-[var(--color-amber-soft)] border-[var(--color-amber)]/30 text-[var(--color-ink)]',
  danger: 'bg-[var(--color-danger-soft)] border-[var(--color-danger)]/30 text-[var(--color-ink)]',
};

export function PrimeMessage({
  severity = 'info',
  icon,
  children,
  className = '',
}: PrimeMessageProps) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs leading-relaxed ${MESSAGE_SEVERITIES[severity]} ${className}`}
    >
      {icon && <span className="shrink-0 mt-0.5">{icon}</span>}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              PrimeProgressBar                              */
/* -------------------------------------------------------------------------- */
interface PrimeProgressBarProps {
  value: number;
  colorClass?: string;
  heightClass?: string;
  className?: string;
}

export function PrimeProgressBar({
  value,
  colorClass = 'bg-[var(--color-accent)]',
  heightClass = 'h-2',
  className = '',
}: PrimeProgressBarProps) {
  const safeVal = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={safeVal}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full rounded-full overflow-hidden bg-[var(--color-paper-2)] ${heightClass} ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${colorClass}`}
        style={{ width: `${safeVal}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                PrimeDialog                                 */
/* -------------------------------------------------------------------------- */
interface PrimeDialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
}

export function PrimeDialog({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidthClass = 'max-w-2xl',
}: PrimeDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog Body */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full ${maxWidthClass} surface-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150`}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[var(--color-rule)] bg-[var(--color-surface)]">
          <div className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2 m-0">
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-2)] cursor-pointer border-0 bg-transparent"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-[var(--color-rule)] bg-[var(--color-surface)] flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 PrimeTabs                                  */
/* -------------------------------------------------------------------------- */
export interface PrimeTabItem<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface PrimeTabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  items: readonly PrimeTabItem<T>[];
  className?: string;
}

export function PrimeTabs<T extends string>({
  value,
  onChange,
  items,
  className = '',
}: PrimeTabsProps<T>) {
  return (
    <div className={className}>
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-[var(--color-rule)]">
        {items.map((item) => {
          const active = value === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 cursor-pointer transition-colors duration-150 bg-transparent ${
                active
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)] font-semibold'
                  : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                PrimeDivider                                */
/* -------------------------------------------------------------------------- */
export function PrimeDivider({ className = '' }: { className?: string }) {
  return <hr className={`border-0 border-t border-[var(--color-rule)] my-3 ${className}`} />;
}

/* -------------------------------------------------------------------------- */
/*                                 PrimeChart                                 */
/* -------------------------------------------------------------------------- */
interface PrimeChartProps {
  type: 'doughnut' | 'bar';
  data: ChartConfiguration<ChartType>['data'];
  options?: ChartConfiguration<ChartType>['options'];
  height?: number;
  className?: string;
}

export function PrimeChart({
  type,
  data,
  options,
  height = 220,
  className = '',
}: PrimeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const isDark = resolvedTheme === 'dark';
    const textColor = isDark ? '#cbd5e1' : '#334155';
    const gridColor = isDark ? 'rgba(148, 163, 184, 0.14)' : 'rgba(15, 23, 42, 0.07)';

    chartRef.current = new Chart(canvas, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: textColor,
              boxWidth: 10,
              boxHeight: 10,
              padding: 14,
              font: { family: "'Inter', sans-serif", size: 11 },
            },
          },
          tooltip: {
            backgroundColor: isDark ? '#0f172a' : '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            padding: 10,
            cornerRadius: 8,
          },
          ...(options?.plugins || {}),
        },
        scales:
          type === 'bar'
            ? {
                x: {
                  ticks: { color: textColor, font: { size: 11 } },
                  grid: { display: false },
                },
                y: {
                  ticks: { color: textColor, font: { size: 11 } },
                  grid: { color: gridColor },
                },
                ...(options?.scales || {}),
              }
            : undefined,
        ...options,
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [type, data, options, resolvedTheme]);

  return (
    <div className={`relative w-full ${className}`} style={{ height: `${height}px` }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
