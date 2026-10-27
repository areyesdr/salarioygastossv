/**
 * Utilidades de formato numérico y monetario en estándar de Estados Unidos (USD - $#,##0.00)
 * Moneda de curso legal oficial en la República de El Salvador.
 */

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formatea un valor numérico al formato estándar de moneda estadounidense.
 * Ejemplos:
 *  formatUSD(408.8)   => "$408.80"
 *  formatUSD(1500)    => "$1,500.00"
 *  formatUSD(-30)     => "-$30.00"
 *  formatUSD(0)       => "$0.00"
 */
export function formatUSD(value: number): string {
  if (!Number.isFinite(value)) return '$0.00';
  const isNegative = value < 0;
  const absFormatted = USD_FORMATTER.format(Math.abs(value));
  return isNegative ? `-${absFormatted}` : absFormatted;
}

/**
 * Formatea un monto con prefijo de signo explícito (+ o -).
 * Ejemplos:
 *  formatSignedUSD(250) => "+$250.00"
 *  formatSignedUSD(-30) => "-$30.00"
 *  formatSignedUSD(0)   => "$0.00"
 */
export function formatSignedUSD(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '$0.00';
  if (value > 0) return `+${formatUSD(value)}`;
  return formatUSD(value);
}

/**
 * Parsea una entrada de texto numérica en estándar USA (coma para miles, punto para decimales)
 * con tolerancia a caracteres de moneda y espacios.
 */
export function parseUSDCurrency(raw: string): number {
  if (!raw) return 0;
  let cleaned = raw.replace(/\$/g, '').trim();

  // Si contiene coma y punto, determinar según posición
  if (cleaned.includes('.') && cleaned.includes(',')) {
    if (cleaned.lastIndexOf('.') > cleaned.lastIndexOf(',')) {
      // Formato USA: 1,500.50 -> eliminar comas
      cleaned = cleaned.replace(/,/g, '');
    } else {
      // Entrada con formato europeo: 1.500,50 -> eliminar puntos, reemplazar coma por punto
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    // Si solo tiene coma y 1 o 2 dígitos después, asumir decimal: 408,80 -> 408.80
    // Si tiene 3 dígitos después (ej. 1,000), asumir miles
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length >= 1) {
      cleaned = cleaned.replace(',', '');
    } else {
      cleaned = cleaned.replace(',', '.');
    }
  } else {
    // Normal: quitar comas si las hubiera
    cleaned = cleaned.replace(/,/g, '');
  }

  const val = parseFloat(cleaned);
  return Number.isFinite(val) && val >= 0 ? val : 0;
}

/**
 * Formato amigable de horas y minutos
 */
export function formatHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0h';
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  return mins > 0 ? `${whole}h ${mins}m` : `${whole}h`;
}
