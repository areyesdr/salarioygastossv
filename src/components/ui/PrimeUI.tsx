import React, { useEffect, useRef } from 'react';
import { Button as PRButton } from 'primereact/button';
import { InputText as PRInputText } from 'primereact/inputtext';
import { Checkbox as PRCheckbox } from 'primereact/checkbox';
import { ToggleSwitch as PRToggleSwitch } from 'primereact/toggleswitch';
import { ToggleButton as PRToggleButton } from 'primereact/togglebutton';
import { ToggleButtonGroup as PRToggleButtonGroup } from 'primereact/togglebuttongroup';
import { Tabs as PRTabs } from 'primereact/tabs';
import { Dialog as PRDialog } from 'primereact/dialog';
import { Card as PRCard } from 'primereact/card';
import { Tag as PRTag } from 'primereact/tag';
import { Message as PRMessage } from 'primereact/message';
import { ProgressBar as PRProgressBar } from 'primereact/progressbar';
import { Divider as PRDivider } from 'primereact/divider';
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
    'bg-[var(--color-accent)] text-[var(--color-accent-ink)] border border-transparent hover:bg-[var(--color-accent-hi)] shadow-xs',
  secondary:
    'bg-[var(--color-ink)] text-[var(--color-card)] border border-transparent hover:opacity-90 shadow-xs',
  outline:
    'bg-transparent text-[var(--color-ink)] border border-[var(--color-rule)] hover:bg-[var(--color-surface)]',
  ghost:
    'bg-transparent text-[var(--color-muted)] border border-transparent hover:text-[var(--color-ink)] hover:bg-[var(--color-surface)]',
  danger:
    'bg-[var(--color-danger)] text-white border border-transparent hover:opacity-90',
  success:
    'bg-[var(--color-emerald)] text-white border border-transparent hover:opacity-90',
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
  ...rest
}: PrimeButtonProps) {
  return (
    <PRButton
      type={type}
      className={`inline-flex items-center justify-center font-medium cursor-pointer select-none transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
        BUTTON_VARIANTS[variant]
      } ${BUTTON_SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...(rest as any)}
    >
      {children}
    </PRButton>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 PrimeInput                                 */
/* -------------------------------------------------------------------------- */
interface PrimeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: 'sm' | 'md' | 'lg';
  mono?: boolean;
}

export function PrimeInput({
  inputSize = 'md',
  mono = false,
  className = '',
  ...rest
}: PrimeInputProps) {
  const sizeCls =
    inputSize === 'sm'
      ? 'px-2.5 py-1.5 text-xs rounded-lg'
      : inputSize === 'lg'
        ? 'px-3.5 py-2.5 text-base rounded-xl'
        : 'px-3 py-2 text-sm rounded-lg';

  return (
    <PRInputText
      className={`w-full bg-[var(--color-card)] text-[var(--color-ink)] border border-[var(--color-rule)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-focus)] focus:outline-none transition-colors duration-150 disabled:opacity-60 ${sizeCls} ${
        mono ? 'font-mono tabular-nums' : ''
      } ${className}`}
      {...(rest as any)}
    />
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
      className={`w-full bg-[var(--color-card)] text-[var(--color-ink)] border border-[var(--color-rule)] focus:border-[var(--color-focus)] focus:outline-none transition-colors duration-150 cursor-pointer ${sizeCls} ${className}`}
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
    <PRCheckbox.Root
      checked={checked}
      onCheckedChange={(e: { checked?: boolean }) => onChange(Boolean(e.checked))}
      disabled={disabled}
      inputId={id}
      ariaLabel={ariaLabel}
      inputClassName="sr-only"
      className={`relative inline-flex items-center justify-center shrink-0 cursor-pointer ${className}`}
      title={title}
    >
      <PRCheckbox.Box
        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors duration-150 ${
          checked
            ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-accent-ink)]'
            : 'bg-[var(--color-card)] border-[var(--color-rule)] hover:border-[var(--color-muted)]'
        }`}
      >
        <PRCheckbox.Indicator className="flex items-center justify-center">
          {checked && <Check size={11} strokeWidth={3} />}
        </PRCheckbox.Indicator>
      </PRCheckbox.Box>
    </PRCheckbox.Root>
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
    <PRToggleSwitch.Root
      checked={checked}
      onCheckedChange={(e: { value?: unknown }) => onChange(Boolean(e.value))}
      disabled={disabled}
      inputId={id}
      aria-label={ariaLabel}
      inputClassName="sr-only"
      className="relative inline-flex items-center cursor-pointer shrink-0"
    >
      <PRToggleSwitch.Control
        className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-150 flex items-center border ${
          checked
            ? 'bg-[var(--color-accent)] border-[var(--color-accent)] justify-end'
            : 'bg-[var(--color-paper-2)] border-[var(--color-rule)] justify-start'
        }`}
      >
        <PRToggleSwitch.Handle className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
      </PRToggleSwitch.Control>
    </PRToggleSwitch.Root>
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
    <PRToggleButtonGroup
      value={value}
      onValueChange={(e: { value?: unknown }) => {
        if (e.value !== null && e.value !== undefined) {
          onChange(e.value as T);
        }
      }}
      className={`inline-flex items-center p-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-rule)] gap-1 ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <PRToggleButton.Root
            key={opt.value}
            value={opt.value}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium cursor-pointer transition-colors duration-150 ${padCls} ${
              fullWidth ? 'flex-1' : ''
            } ${
              active
                ? 'bg-[var(--color-card)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule)]'
                : 'bg-transparent text-[var(--color-muted)] border border-transparent hover:text-[var(--color-ink)]'
            }`}
          >
            {opt.label}
          </PRToggleButton.Root>
        );
      })}
    </PRToggleButtonGroup>
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
    <PRCard.Root className={`surface-card overflow-hidden ${padded ? 'p-4 sm:p-5' : ''} ${className}`}>
      {children}
    </PRCard.Root>
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
    <PRTag
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${TAG_SEVERITIES[severity]} ${className}`}
    >
      {children}
    </PRTag>
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
    <PRMessage.Root
      className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs leading-relaxed ${MESSAGE_SEVERITIES[severity]} ${className}`}
    >
      {icon && <PRMessage.Icon className="shrink-0 mt-0.5">{icon}</PRMessage.Icon>}
      <PRMessage.Text className="flex-1 min-w-0">{children}</PRMessage.Text>
    </PRMessage.Root>
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
    <PRProgressBar.Root
      value={safeVal}
      className={`w-full rounded-full overflow-hidden bg-[var(--color-paper-2)] ${heightClass} ${className}`}
    >
      <PRProgressBar.Track className="w-full h-full">
        <PRProgressBar.Value
          className={`h-full rounded-full transition-[width] duration-300 ${colorClass}`}
          style={{ width: `${safeVal}%` }}
        />
      </PRProgressBar.Track>
    </PRProgressBar.Root>
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
  return (
    <PRDialog.Root open={open} onOpenChange={(e: { value?: unknown }) => !e.value && onClose()}>
      <PRDialog.Portal>
        <PRDialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs" />
        <PRDialog.Positioner className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <PRDialog.Popup
            className={`w-full ${maxWidthClass} surface-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
          >
            <PRDialog.Header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[var(--color-rule)] bg-[var(--color-surface)]">
              <PRDialog.Title className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2 m-0">
                {title}
              </PRDialog.Title>
              <PRDialog.Close
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-2)] cursor-pointer border-0 bg-transparent"
                aria-label="Cerrar"
              >
                <X size={16} />
              </PRDialog.Close>
            </PRDialog.Header>
            <PRDialog.Content className="p-5 overflow-y-auto flex-1">{children}</PRDialog.Content>
            {footer && (
              <PRDialog.Footer className="px-5 py-3 border-t border-[var(--color-rule)] bg-[var(--color-surface)] flex justify-end gap-2">
                {footer}
              </PRDialog.Footer>
            )}
          </PRDialog.Popup>
        </PRDialog.Positioner>
      </PRDialog.Portal>
    </PRDialog.Root>
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
    <PRTabs.Root
      value={value}
      onValueChange={(e: { value?: unknown }) => {
        if (e.value !== undefined) onChange(e.value as T);
      }}
      className={className}
    >
      <PRTabs.List className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-[var(--color-rule)]">
        {items.map((item) => {
          const active = value === item.value;
          return (
            <PRTabs.Tab
              key={item.value}
              value={item.value}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 cursor-pointer transition-colors duration-150 bg-transparent ${
                active
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)] font-semibold'
                  : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </PRTabs.Tab>
          );
        })}
      </PRTabs.List>
    </PRTabs.Root>
  );
}

/* -------------------------------------------------------------------------- */
/*                                PrimeDivider                                */
/* -------------------------------------------------------------------------- */
export function PrimeDivider({ className = '' }: { className?: string }) {
  return <PRDivider className={`border-t border-[var(--color-rule)] my-3 ${className}`} />;
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
