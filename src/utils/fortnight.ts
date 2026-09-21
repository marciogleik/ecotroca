export interface FortnightRange {
  fortnightNumber: 1 | 2;
  startDate: Date;
  endDate: Date;
  startDateIso: string;
  endDateIso: string;
  startIsoDateString: string; // YYYY-MM-DD
  endIsoDateString: string;   // YYYY-MM-DD
  label: string;             // ex: "1ª Quinzena (01 a 15/09)"
  fullLabel: string;         // ex: "1ª Quinzena de Setembro (01 a 15/09/2026)"
  rangeDescription: string;  // ex: "01 a 15 de setembro"
}

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

/**
 * Calcula a quinzena no calendário civil para uma determinada data.
 * - 1ª Quinzena: do dia 01 às 00:00:00 até o dia 15 às 23:59:59
 * - 2ª Quinzena: do dia 16 às 00:00:00 até o último dia do mês às 23:59:59
 */
export function getCurrentFortnight(date = new Date()): FortnightRange {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const isFirst = day <= 15;
  const fortnightNumber: 1 | 2 = isFirst ? 1 : 2;

  // Início da quinzena (00:00:00.000 local)
  const startDate = isFirst
    ? new Date(year, month, 1, 0, 0, 0, 0)
    : new Date(year, month, 16, 0, 0, 0, 0);

  // Fim da quinzena (23:59:59.999 local)
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const endDate = isFirst
    ? new Date(year, month, 15, 23, 59, 59, 999)
    : new Date(year, month, lastDayOfMonth, 23, 59, 59, 999);

  const monthNumberStr = String(month + 1).padStart(2, '0');
  const monthName = MONTH_NAMES[month];

  const startDayStr = isFirst ? '01' : '16';
  const endDayStr = isFirst ? '15' : String(lastDayOfMonth).padStart(2, '0');

  const startIsoDateString = `${year}-${monthNumberStr}-${startDayStr}`;
  const endIsoDateString = `${year}-${monthNumberStr}-${endDayStr}`;

  const label = isFirst
    ? `1ª Quinzena (01 a 15/${monthNumberStr})`
    : `2ª Quinzena (16 a ${endDayStr}/${monthNumberStr})`;

  const fullLabel = isFirst
    ? `1ª Quinzena de ${capitalize(monthName)} (01 a 15/${monthNumberStr}/${year})`
    : `2ª Quinzena de ${capitalize(monthName)} (16 a ${endDayStr}/${monthNumberStr}/${year})`;

  const rangeDescription = `${startDayStr} a ${endDayStr} de ${monthName}`;

  return {
    fortnightNumber,
    startDate,
    endDate,
    startDateIso: startDate.toISOString(),
    endDateIso: endDate.toISOString(),
    startIsoDateString,
    endIsoDateString,
    label,
    fullLabel,
    rangeDescription,
  };
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
